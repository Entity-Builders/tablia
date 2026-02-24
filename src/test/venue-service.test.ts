import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockVenue } from './fixtures/menu.fixtures';

// ─── Mock Supabase (factory-only — avoids hoisting issues) ────────
vi.mock('../lib/supabase', () => {
  const mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-uuid-001' } },
    error: null,
  });

  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(chain),
      auth: { getUser: mockGetUser },
    },
  };
});

import {
  createVenue,
  getMyVenues,
  getVenueBySlug,
} from '../services/venue-service';

// ─── Tests ────────────────────────────────────────────────────────
describe('venue-service', () => {
  let supabase: any;
  let chain: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../lib/supabase');
    supabase = mod.supabase;

    // Rebuild chain after clearAllMocks
    chain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    vi.mocked(supabase.from).mockReturnValue(chain);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-uuid-001' } },
      error: null,
    });
  });

  describe('createVenue()', () => {
    it('crea un venue y retorna los datos', async () => {
      chain.single.mockResolvedValue({ data: mockVenue, error: null });

      const result = await createVenue({
        name: 'La Parrilla del Centro',
        slug: 'la-parrilla-del-centro',
        cuisine_type: 'Parrilla',
      });

      expect(result.name).toBe('La Parrilla del Centro');
      expect(result.slug).toBe('la-parrilla-del-centro');
      expect(result.owner_id).toBe('user-uuid-001');
    });

    it('normaliza el slug a lowercase sin caracteres especiales', async () => {
      chain.single.mockResolvedValue({ data: mockVenue, error: null });

      await createVenue({ name: 'Café & Resto', slug: 'Café & Bár' });

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: expect.stringMatching(/^[a-z0-9-]+$/),
        }),
      );
    });

    it('lanza error descriptivo cuando el slug ya está en uso', async () => {
      chain.single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Unique violation' },
      });

      await expect(
        createVenue({ name: 'Test', slug: 'slug-repetido' }),
      ).rejects.toThrow('Ese slug ya está en uso');
    });

    it('lanza error si el usuario no está autenticado', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      await expect(
        createVenue({ name: 'Test', slug: 'test-slug' }),
      ).rejects.toThrow('No estás autenticado');
    });
  });

  describe('getMyVenues()', () => {
    it('retorna los venues del usuario autenticado', async () => {
      chain.order.mockResolvedValueOnce({ data: [mockVenue], error: null });

      const venues = await getMyVenues();

      expect(venues).toHaveLength(1);
      expect(venues[0].name).toBe('La Parrilla del Centro');
    });

    it('retorna array vacío si el usuario no está autenticado', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const venues = await getMyVenues();

      expect(venues).toEqual([]);
    });
  });

  describe('getVenueBySlug()', () => {
    it('retorna el venue cuando existe el slug', async () => {
      chain.single.mockResolvedValueOnce({ data: mockVenue, error: null });

      const result = await getVenueBySlug('la-parrilla-del-centro');

      expect(result?.slug).toBe('la-parrilla-del-centro');
    });

    it('retorna null si no existe el venue', async () => {
      chain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await getVenueBySlug('no-existe');

      expect(result).toBeNull();
    });
  });
});
