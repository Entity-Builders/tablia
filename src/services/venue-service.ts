import { supabase } from '../lib/supabase';
import type { ChatPersona, LandingLink, Venue } from '../types';
import { normalizeChatPersona } from './chat-persona';
import { throwIfSupabaseError } from './supabase-errors';

type VenueLandingRow = {
  name: string;
  slug: string;
  logo_url: string | null;
  cuisine_type: string | null;
  landing_links?: LandingLink[] | null;
};

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
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id' });
  throwIfSupabaseError(profileError, 'No se pudo preparar tu perfil.');

  const { data: venue, error } = await supabase
    .from('venues')
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

  if (!venue) throw new Error('No se pudo crear el establecimiento.');

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
    .from('venues')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error, 'No se pudieron cargar tus establecimientos.');
  return (data || []) as Venue[];
}

/**
 * Get a venue by its public slug (for MenuView page).
 */
export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data as Venue;
}

/**
 * Lightweight venue fetch for the public Landing page.
 * Only fetches the fields needed to render the landing (no menu data).
 */
export async function getVenueLanding(slug: string): Promise<{
  name: string;
  slug: string;
  logo_url: string | null;
  cuisine_type: string | null;
  landing_links: LandingLink[];
} | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('name, slug, logo_url, cuisine_type, landing_links')
    .eq('slug', slug)
    .single();

  if (error) return null;
  const landing = data as VenueLandingRow | null;
  if (!landing) return null;

  return {
    name: landing.name,
    slug: landing.slug,
    logo_url: landing.logo_url,
    cuisine_type: landing.cuisine_type,
    landing_links: landing.landing_links ?? [],
  };
}

/**
 * Update venue landing links from the Dashboard editor.
 */
export async function updateVenueLandingLinks(
  venueId: string,
  links: LandingLink[],
): Promise<void> {
  const { error } = await supabase
    .from('venues')
    .update({
      landing_links: links as unknown as Record<string, unknown>[],
      updated_at: new Date().toISOString(),
    })
    .eq('id', venueId);

  throwIfSupabaseError(error, 'No se pudieron guardar los links.');
}

/**
 * Update the assistant voice used by the public menu chat.
 */
export async function updateVenueChatPersona(
  venueId: string,
  persona: ChatPersona,
): Promise<ChatPersona> {
  const chatPersona = normalizeChatPersona(persona);

  const { error } = await supabase
    .from('venues')
    .update({
      chat_persona: chatPersona as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq('id', venueId);

  throwIfSupabaseError(error, 'No se pudo guardar el locutor.');
  return chatPersona;
}
