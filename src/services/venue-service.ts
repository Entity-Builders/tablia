import { supabase } from '../lib/supabase';
import type { Venue } from '../types';

/**
 * Create a new venue for the current user.
 */
export async function createVenue(data: {
  name: string;
  slug: string;
  description?: string;
  cuisine_type?: string;
}): Promise<Venue> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No estás autenticado');

  // Ensure profile exists
  await supabase
    .from('tablia_profiles')
    .upsert({ id: user.id }, { onConflict: 'id' });

  const { data: venue, error } = await supabase
    .from('tablia_venues')
    .insert({
      owner_id: user.id,
      name: data.name,
      slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: data.description || null,
      cuisine_type: data.cuisine_type || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ese slug ya está en uso. Elegí otro nombre corto.');
    }
    throw new Error(error.message);
  }

  return venue as Venue;
}

/**
 * Get all venues owned by the current user.
 */
export async function getMyVenues(): Promise<Venue[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('tablia_venues')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Venue[];
}

/**
 * Get a venue by its public slug (for MenuView page).
 */
export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('tablia_venues')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data as Venue;
}
