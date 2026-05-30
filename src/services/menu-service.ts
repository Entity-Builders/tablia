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

/** Derive source_type from MIME. */
function mimeToSourceType(mime: string): MenuSourceType {
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  return 'text';
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
  // 0. Guard: only 1 menu per venue
  const { count, error: countError } = await supabase
    .from('menus')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', venueId);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error(
      'Este establecimiento ya tiene un menú. Eliminá el existente antes de crear uno nuevo.',
    );
  }

  // 1. Create menu record in 'parsing' state
  const { data: menu, error: menuError } = await supabase
    .from('menus')
    .insert({
      venue_id: venueId,
      name: name || 'Menú Principal',
      source_type: 'text',
      source_content: text,
      status: 'parsing',
    })
    .select()
    .single();

  if (menuError) throw new Error(menuError.message);

  try {
    // 2. Parse with AI
    const parsed = await parseMenuFromText(text);

    // 3. Update menu with parsed result, set status to 'review'
    const { data: updatedMenu, error: updateError } = await supabase
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

    if (updateError) throw new Error(updateError.message);

    return { menu: updatedMenu as Menu, parsed };
  } catch (error) {
    // If parsing fails, set status back to draft
    await supabase
      .from('menus')
      .update({ status: 'draft' })
      .eq('id', menu.id);

    throw error;
  }
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
  // 0. Guard: only 1 menu per venue
  const { count, error: countError } = await supabase
    .from('menus')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', venueId);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error(
      'Este establecimiento ya tiene un menú. Eliminá el existente antes de crear uno nuevo.',
    );
  }

  const sourceType = mimeToSourceType(file.type);

  // 1. Create menu record in 'parsing' state
  const { data: menu, error: menuError } = await supabase
    .from('menus')
    .insert({
      venue_id: venueId,
      name: name || 'Menú Principal',
      source_type: sourceType,
      source_content: file.name,
      status: 'parsing',
    })
    .select()
    .single();

  if (menuError) throw new Error(menuError.message);

  try {
    // 2. Parse with AI (multimodal)
    const parsed = await parseMenuFromFile(file);

    // 3. Update menu with parsed result, set status to 'review'
    const { data: updatedMenu, error: updateError } = await supabase
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

    if (updateError) throw new Error(updateError.message);

    return { menu: updatedMenu as Menu, parsed };
  } catch (error) {
    // If parsing fails, set status back to draft
    await supabase
      .from('menus')
      .update({ status: 'draft' })
      .eq('id', menu.id);

    throw error;
  }
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
  await supabase.from('menu_items').delete().eq('menu_id', menuId);
  await supabase.from('menu_categories').delete().eq('menu_id', menuId);

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

  if (publishError) throw new Error(publishError.message);
}

/**
 * Delete a menu and all its categories/items.
 */
export async function deleteMenu(menuId: string): Promise<void> {
  await supabase.from('menu_items').delete().eq('menu_id', menuId);
  await supabase.from('menu_categories').delete().eq('menu_id', menuId);

  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', menuId);

  if (error) throw new Error(error.message);
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

  if (error) throw new Error(error.message);
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

  // Extract from nested structure
  const menus = (venue as any).menus;
  const menu = Array.isArray(menus) ? menus[0] : menus;
  if (!menu) return null;

  const rawCategories = menu.menu_categories || [];

  // Filter visible categories, sort, and attach sorted available items
  const categoriesWithItems = rawCategories
    .filter((cat: any) => cat.is_visible)
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((cat: any) => ({
      ...cat,
      items: (cat.menu_items || [])
        .filter((item: any) => item.is_available)
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    }));

  return {
    venue: {
      name: venue.name,
      slug: venue.slug,
      cuisine_type: venue.cuisine_type,
      logo_url: venue.logo_url,
      chat_persona: normalizeChatPersona((venue as any).chat_persona),
    },
    categories: categoriesWithItems as (MenuCategory & { items: MenuItem[] })[],
    visualStyle: normalizeMenuVisualStyle(
      (menu.parsed_json as ParsedMenu | null | undefined)?.visual_style,
      venue.cuisine_type,
    ),
    additionalCharges:
      (menu.parsed_json as ParsedMenu | null | undefined)?.additional_charges ||
      [],
    legalNotes:
      (menu.parsed_json as ParsedMenu | null | undefined)?.legal_notes || [],
  };
}

/**
 * Load an existing menu's data as a ParsedMenu shape (for editing in MenuReview).
 */
export async function getMenuForEdit(menuId: string): Promise<ParsedMenu> {
  const { data: menu } = await supabase
    .from('menus')
    .select('parsed_json')
    .eq('id', menuId)
    .single();

  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('menu_id', menuId)
    .order('sort_order');

  const { data: items } = await supabase
    .from('menu_items')
    .select('*')
    .eq('menu_id', menuId)
    .order('sort_order');

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
