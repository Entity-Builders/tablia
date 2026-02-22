import { supabase } from '../lib/supabase';
import { parseMenuFromText } from './menu-parser-service';
import type { Menu, MenuCategory, MenuItem, ParsedMenu } from '../types';

/**
 * Create a new menu from pasted text. Calls AI parser and stores the result.
 * Returns the menu with parsed_json populated (status: 'review').
 */
export async function createMenuFromText(
  venueId: string,
  text: string,
  name?: string,
): Promise<{ menu: Menu; parsed: ParsedMenu }> {
  // 1. Create menu record in 'parsing' state
  const { data: menu, error: menuError } = await supabase
    .from('tablia_menus')
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
      .from('tablia_menus')
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
      .from('tablia_menus')
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
  // 1. Delete any existing categories/items for this menu (in case of re-parse)
  await supabase.from('tablia_menu_items').delete().eq('menu_id', menuId);
  await supabase.from('tablia_menu_categories').delete().eq('menu_id', menuId);

  // 2. Insert categories and items
  for (let catIndex = 0; catIndex < parsedMenu.categories.length; catIndex++) {
    const cat = parsedMenu.categories[catIndex];

    const { data: category, error: catError } = await supabase
      .from('tablia_menu_categories')
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
        .from('tablia_menu_items')
        .insert(items);

      if (itemsError)
        throw new Error(`Error creating items: ${itemsError.message}`);
    }
  }

  // 3. Set menu status to published
  const { error: publishError } = await supabase
    .from('tablia_menus')
    .update({
      status: 'published',
      updated_at: new Date().toISOString(),
    })
    .eq('id', menuId);

  if (publishError) throw new Error(publishError.message);
}

/**
 * Get all menus for a venue (Dashboard).
 */
export async function getMenusByVenue(venueId: string): Promise<Menu[]> {
  const { data, error } = await supabase
    .from('tablia_menus')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Menu[];
}

/**
 * Get a full published menu with categories and items (for MenuView).
 */
export async function getPublishedMenu(venueSlug: string): Promise<{
  venue: {
    name: string;
    slug: string;
    cuisine_type: string | null;
    logo_url: string | null;
  };
  categories: (MenuCategory & { items: MenuItem[] })[];
} | null> {
  // 1. Get venue
  const { data: venue } = await supabase
    .from('tablia_venues')
    .select('id, name, slug, cuisine_type, logo_url')
    .eq('slug', venueSlug)
    .single();

  if (!venue) return null;

  // 2. Get published menu
  const { data: menu } = await supabase
    .from('tablia_menus')
    .select('id')
    .eq('venue_id', venue.id)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!menu) return null;

  // 3. Get categories with items
  const { data: categories } = await supabase
    .from('tablia_menu_categories')
    .select('*')
    .eq('menu_id', menu.id)
    .eq('is_visible', true)
    .order('sort_order');

  const { data: items } = await supabase
    .from('tablia_menu_items')
    .select('*')
    .eq('menu_id', menu.id)
    .eq('is_available', true)
    .order('sort_order');

  // Group items by category
  const categoriesWithItems = (categories || []).map((cat) => ({
    ...cat,
    items: (items || []).filter((item) => item.category_id === cat.id),
  }));

  return {
    venue: {
      name: venue.name,
      slug: venue.slug,
      cuisine_type: venue.cuisine_type,
      logo_url: venue.logo_url,
    },
    categories: categoriesWithItems as (MenuCategory & { items: MenuItem[] })[],
  };
}
