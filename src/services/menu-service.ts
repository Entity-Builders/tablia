import { supabase } from '../lib/supabase';
import { parseMenuFromText, parseMenuFromFile } from './menu-parser-service';
import type {
  Menu,
  MenuCategory,
  MenuItem,
  MenuSourceType,
  ChatPersona,
  ParsedMenu,
  ParsedMenuCharge,
  ParsedMenuVisualStyle,
} from '../types';
import { normalizeParsedMenu } from './parsed-menu-normalizer';
import { normalizeMenuVisualStyle } from './menu-visual-style';
import { normalizeChatPersona } from './chat-persona';
import { throwIfSupabaseError, toServiceError } from './supabase-errors';

const DEFAULT_MENU_NAME = 'Menú Principal';
const DUPLICATE_MENU_MESSAGE =
  'Este establecimiento ya tiene un menú. Eliminá el existente antes de crear uno nuevo.';

type MenuImportInput = {
  venueId: string;
  name?: string;
  sourceType: MenuSourceType;
  sourceContent: string;
  parse: () => Promise<ParsedMenu>;
};

type PublishedMenuRow = {
  name: string;
  slug: string;
  cuisine_type: string | null;
  logo_url: string | null;
  chat_persona?: unknown;
  menus?: PublishedMenuData | PublishedMenuData[] | null;
};

type PublishedMenuData = {
  parsed_json?: unknown;
  menu_categories?: PublishedCategoryRow[] | null;
};

type PublishedCategoryRow = MenuCategory & {
  menu_items?: MenuItem[] | null;
};

/** Derive source_type from MIME. */
function mimeToSourceType(mime: string): MenuSourceType {
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  return 'text';
}

function sortBySortOrder<T extends { sort_order: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function firstOrSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function ensureVenueCanCreateMenu(venueId: string): Promise<void> {
  const { count, error } = await supabase
    .from('menus')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', venueId);

  throwIfSupabaseError(error, 'No se pudo verificar el menú existente.');

  if ((count ?? 0) > 0) {
    throw new Error(DUPLICATE_MENU_MESSAGE);
  }
}

async function createParsingMenu({
  venueId,
  name,
  sourceType,
  sourceContent,
}: Omit<MenuImportInput, 'parse'>): Promise<Menu> {
  const { data, error } = await supabase
    .from('menus')
    .insert({
      venue_id: venueId,
      name: name || DEFAULT_MENU_NAME,
      source_type: sourceType,
      source_content: sourceContent,
      status: 'parsing',
    })
    .select()
    .single();

  throwIfSupabaseError(error, 'No se pudo crear el menú.');
  if (!data) throw new Error('No se pudo crear el menú.');

  return data as Menu;
}

async function markMenuAsDraft(menuId: string): Promise<void> {
  const { error } = await supabase
    .from('menus')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', menuId);

  throwIfSupabaseError(error, 'No se pudo revertir el menú a borrador.');
}

async function updateMenuWithParsedResult(
  menu: Menu,
  parsed: ParsedMenu,
): Promise<Menu> {
  const { data, error } = await supabase
    .from('menus')
    .update({
      parsed_json: parsed as unknown as Record<string, unknown>,
      status: 'review',
      name: parsed.metadata?.restaurant_name || menu.name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', menu.id)
    .select()
    .single();

  throwIfSupabaseError(error, 'No se pudo guardar el menú parseado.');
  if (!data) throw new Error('No se pudo guardar el menú parseado.');

  return data as Menu;
}

async function createParsedMenu(
  input: MenuImportInput,
): Promise<{ menu: Menu; parsed: ParsedMenu }> {
  await ensureVenueCanCreateMenu(input.venueId);
  const menu = await createParsingMenu(input);

  try {
    const parsed = await input.parse();
    const updatedMenu = await updateMenuWithParsedResult(menu, parsed);
    return { menu: updatedMenu, parsed };
  } catch (error) {
    try {
      await markMenuAsDraft(menu.id);
    } catch (rollbackError) {
      console.warn('[menu-service] Failed to mark parsing menu as draft:', rollbackError);
    }

    throw toServiceError(error, 'No se pudo interpretar el menú.');
  }
}

function normalizePublishedCategories(
  categories: PublishedCategoryRow[] | null | undefined,
): (MenuCategory & { items: MenuItem[] })[] {
  return sortBySortOrder(categories ?? [])
    .filter((category) => category.is_visible)
    .map(({ menu_items: menuItems, ...category }) => ({
      ...category,
      items: sortBySortOrder(menuItems ?? []).filter(
        (item) => item.is_available,
      ),
    }));
}

function getParsedMenu(value: unknown): ParsedMenu | null {
  if (!value || typeof value !== 'object') return null;
  return value as ParsedMenu;
}

export async function getStoredParsedMenu(menuId: string): Promise<ParsedMenu> {
  const { data, error } = await supabase
    .from('menus')
    .select('parsed_json')
    .eq('id', menuId)
    .single();

  throwIfSupabaseError(error, 'No se pudo cargar el menú parseado.');

  const parsedMenu = getParsedMenu(
    (data as { parsed_json?: unknown } | null)?.parsed_json,
  );
  if (!parsedMenu) {
    throw new Error('No se encontraron datos del menú parseado.');
  }

  return parsedMenu;
}

/**
 * Create a new menu from pasted text. Calls AI parser and stores the result.
 * Returns the menu with parsed_json populated (status: 'review').
 */
export async function createMenuFromText(
  venueId: string,
  text: string,
  name?: string,
): Promise<{ menu: Menu; parsed: ParsedMenu }> {
  return createParsedMenu({
    venueId,
    name,
    sourceType: 'text',
    sourceContent: text,
    parse: () => parseMenuFromText(text),
  });
}

/**
 * Create a new menu from a PDF or image file. Calls AI multimodal parser.
 * Returns the menu with parsed_json populated (status: 'review').
 */
export async function createMenuFromFile(
  venueId: string,
  file: File,
  name?: string,
): Promise<{ menu: Menu; parsed: ParsedMenu }> {
  return createParsedMenu({
    venueId,
    name,
    sourceType: mimeToSourceType(file.type),
    sourceContent: file.name,
    parse: () => parseMenuFromFile(file),
  });
}

/**
 * Confirm a parsed menu: write categories + items to DB, set status to 'published'.
 * The parsedMenu can be edited by the user before confirming.
 */
export async function confirmParsedMenu(
  menuId: string,
  parsedMenu: ParsedMenu,
): Promise<void> {
  const normalizedMenu = normalizeParsedMenu(parsedMenu);

  // 1. Delete any existing categories/items for this menu (in case of re-parse)
  const deleteItems = await supabase
    .from('menu_items')
    .delete()
    .eq('menu_id', menuId);
  throwIfSupabaseError(deleteItems.error, 'No se pudieron eliminar ítems previos.');

  const deleteCategories = await supabase
    .from('menu_categories')
    .delete()
    .eq('menu_id', menuId);
  throwIfSupabaseError(
    deleteCategories.error,
    'No se pudieron eliminar categorías previas.',
  );

  // 2. Insert categories and items
  for (
    let catIndex = 0;
    catIndex < normalizedMenu.categories.length;
    catIndex++
  ) {
    const cat = normalizedMenu.categories[catIndex];

    const { data: category, error: catError } = await supabase
      .from('menu_categories')
      .insert({
        menu_id: menuId,
        name: cat.name,
        description: cat.description || null,
        sort_order: catIndex,
        is_visible: true,
      })
      .select()
      .single();

    if (catError)
      throw new Error(`Error creating category: ${catError.message}`);
    if (!category) throw new Error('No se pudo crear la categoría.');

    // Insert items for this category
    const items = cat.items.map((item, itemIndex) => ({
      category_id: category.id,
      menu_id: menuId,
      name: item.name,
      description: item.description || null,
      price: item.price,
      currency: item.currency || 'ARS',
      tags: item.tags || [],
      is_available: true,
      sort_order: itemIndex,
    }));

    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from('menu_items')
        .insert(items);

      if (itemsError)
        throw new Error(`Error creating items: ${itemsError.message}`);
    }
  }

  // 3. Set menu status to published
  const { error: publishError } = await supabase
    .from('menus')
    .update({
      status: 'published',
      parsed_json: normalizedMenu as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq('id', menuId);

  throwIfSupabaseError(publishError, 'No se pudo publicar el menú.');
}

/**
 * Delete a menu and all its categories/items.
 */
export async function deleteMenu(menuId: string): Promise<void> {
  const deleteItems = await supabase
    .from('menu_items')
    .delete()
    .eq('menu_id', menuId);
  throwIfSupabaseError(deleteItems.error, 'No se pudieron eliminar los ítems.');

  const deleteCategories = await supabase
    .from('menu_categories')
    .delete()
    .eq('menu_id', menuId);
  throwIfSupabaseError(
    deleteCategories.error,
    'No se pudieron eliminar las categorías.',
  );

  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', menuId);

  throwIfSupabaseError(error, 'No se pudo eliminar el menú.');
}

/**
 * Get all menus for a venue (Dashboard).
 */
export async function getMenusByVenue(venueId: string): Promise<Menu[]> {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error, 'No se pudieron cargar los menús.');
  return (data || []) as Menu[];
}

/**
 * Get a full published menu with categories and items (for MenuView).
 * Uses a single query with nested selects to minimize roundtrips.
 */
export async function getPublishedMenu(venueSlug: string): Promise<{
  venue: {
    name: string;
    slug: string;
    cuisine_type: string | null;
    logo_url: string | null;
    chat_persona?: ChatPersona;
  };
  categories: (MenuCategory & { items: MenuItem[] })[];
  visualStyle: ParsedMenuVisualStyle;
  additionalCharges: ParsedMenuCharge[];
  legalNotes: string[];
} | null> {
  // Single query: venue → published menu → categories → items
  const { data: venue, error } = await supabase
    .from('venues')
    .select(
      `
      id, name, slug, cuisine_type, logo_url, chat_persona,
      menus!inner (
        id, status, parsed_json,
        menu_categories (
          *,
          menu_items (*)
        )
      )
    `,
    )
    .eq('slug', venueSlug)
    .eq('menus.status', 'published')
    .single();

  if (error || !venue) return null;
  const typedVenue = venue as PublishedMenuRow;

  // Extract from nested structure
  const menu = firstOrSingle(typedVenue.menus);
  if (!menu) return null;

  const parsedMenu = getParsedMenu(menu.parsed_json);

  return {
    venue: {
      name: typedVenue.name,
      slug: typedVenue.slug,
      cuisine_type: typedVenue.cuisine_type,
      logo_url: typedVenue.logo_url,
      chat_persona: normalizeChatPersona(typedVenue.chat_persona),
    },
    categories: normalizePublishedCategories(menu.menu_categories),
    visualStyle: normalizeMenuVisualStyle(
      parsedMenu?.visual_style,
      typedVenue.cuisine_type,
    ),
    additionalCharges: parsedMenu?.additional_charges || [],
    legalNotes: parsedMenu?.legal_notes || [],
  };
}

/**
 * Load an existing menu's data as a ParsedMenu shape (for editing in MenuReview).
 */
export async function getMenuForEdit(menuId: string): Promise<ParsedMenu> {
  const { data: menu, error: menuError } = await supabase
    .from('menus')
    .select('parsed_json')
    .eq('id', menuId)
    .single();

  throwIfSupabaseError(menuError, 'No se pudo cargar el menú.');

  const { data: categories, error: categoriesError } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('menu_id', menuId)
    .order('sort_order');

  throwIfSupabaseError(categoriesError, 'No se pudieron cargar las categorías.');

  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select('*')
    .eq('menu_id', menuId)
    .order('sort_order');

  throwIfSupabaseError(itemsError, 'No se pudieron cargar los ítems.');

  const storedParsed = menu?.parsed_json as ParsedMenu | null | undefined;

  return {
    metadata: storedParsed?.metadata,
    contact_info: storedParsed?.contact_info,
    visual_style: storedParsed?.visual_style,
    categories: (categories || []).map((cat) => ({
      name: cat.name,
      description: cat.description || undefined,
      items: (items || [])
        .filter((item) => item.category_id === cat.id)
        .map((item) => ({
          name: item.name,
          description: item.description || undefined,
          price: item.price,
          currency: item.currency || 'ARS',
          tags: item.tags || [],
        })),
    })),
  };
}
