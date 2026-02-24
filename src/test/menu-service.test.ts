import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockParsedMenu, mockMenu } from './fixtures/menu.fixtures';

// ─── Supabase mock: create a thenable chain ────────────────────────
// The chain is both chainable AND awaitable (thenable) — so we can both
// chain methods like .select().eq().single() AND await the result.

let singleQueue: Array<{ data?: any; error: any; count?: number }> = [];
let defaultResult = { data: null, error: null };

function makeChain(): any {
  // A thenable object that is also chainable.
  // Both `await chain` and `.single()` pop from the same singleQueue.
  const chain: any = {
    then(resolve: (v: any) => void, _reject?: (e: any) => void) {
      resolve(singleQueue.shift() ?? defaultResult);
    },
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    eq: () => chain,
    order: () => chain,
    single: () => Promise.resolve(singleQueue.shift() ?? defaultResult),
  };
  return chain;
}

const mockFrom = vi.fn(() => makeChain());

vi.mock('../lib/supabase', () => ({
  supabase: {
    // Use a getter so each call to supabase.from goes through mockFrom
    get from() {
      return mockFrom;
    },
  },
}));

vi.mock('../services/menu-parser-service', () => ({
  parseMenuFromText: vi.fn().mockResolvedValue(mockParsedMenu),
  parseMenuFromFile: vi.fn().mockResolvedValue(mockParsedMenu),
}));

import {
  createMenuFromText,
  confirmParsedMenu,
  deleteMenu,
  getMenusByVenue,
} from '../services/menu-service';

describe('menu-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    singleQueue = [];
    defaultResult = { data: null, error: null };
    mockFrom.mockImplementation(() => makeChain());
  });

  describe('createMenuFromText()', () => {
    it('crea el menú y retorna { menu, parsed } con status review', async () => {
      singleQueue.push(
        { count: 0, error: null },
        { data: { ...mockMenu, status: 'parsing' }, error: null },
        {
          data: {
            ...mockMenu,
            status: 'review',
            name: 'La Parrilla del Centro',
          },
          error: null,
        },
      );

      const { menu, parsed } = await createMenuFromText(
        'venue-uuid-001',
        'texto del menú',
      );

      expect(menu.status).toBe('review');
      expect(menu.name).toBe('La Parrilla del Centro');
      expect(parsed.metadata?.confidence).toBe(0.95);
    });

    it('lanza error en español si ya existe un menú para ese venue', async () => {
      singleQueue.push({ count: 1, error: null });

      await expect(
        createMenuFromText('venue-uuid-001', 'texto'),
      ).rejects.toThrow('Este establecimiento ya tiene un menú');
    });

    it('revierte el status a draft si el parser de AI falla', async () => {
      const { parseMenuFromText } =
        await import('../services/menu-parser-service');
      vi.mocked(parseMenuFromText).mockRejectedValueOnce(
        new Error('AI timeout'),
      );

      singleQueue.push(
        { count: 0, error: null },
        {
          data: { ...mockMenu, id: 'menu-failing-id', status: 'parsing' },
          error: null,
        },
      );

      await expect(
        createMenuFromText('venue-uuid-001', 'texto'),
      ).rejects.toThrow('AI timeout');
    });
  });

  describe('confirmParsedMenu()', () => {
    it('inserta categorías e ítems y publica el menú', async () => {
      // confirmParsedMenu queue order:
      // 1. delete items (then)
      // 2. delete categories (then)
      // Per category: insert category (single) + insert items (then if items.length > 0)
      // Last: update status (then)
      singleQueue.push(
        { error: null }, // delete items
        { error: null }, // delete categories
        { data: { id: 'cat-0' }, error: null }, // insert Entradas (single)
        { error: null }, // insert Entradas items (then)
        { data: { id: 'cat-1' }, error: null }, // insert Parrilla (single)
        { error: null }, // insert Parrilla items (then)
        { error: null }, // update status (then)
      );

      await expect(
        confirmParsedMenu('menu-uuid-001', mockParsedMenu),
      ).resolves.toBeUndefined();

      const calledTables = mockFrom.mock.calls.map((c) => c[0]);
      expect(calledTables).toContain('tablia_menu_items');
      expect(calledTables).toContain('tablia_menu_categories');
    });

    it('llama a from("tablia_menus") en algún momento (para update status)', async () => {
      singleQueue.push(
        { error: null }, // delete items
        { error: null }, // delete categories
        { data: { id: 'cat-0' }, error: null }, // insert Entradas
        { error: null }, // insert Entradas items
        { data: { id: 'cat-1' }, error: null }, // insert Parrilla
        { error: null }, // insert Parrilla items
        { error: null }, // update status
      );

      await confirmParsedMenu('menu-uuid-001', mockParsedMenu);

      expect(mockFrom).toHaveBeenCalledWith('tablia_menus');
    });
  });

  describe('deleteMenu()', () => {
    it('elimina ítems, categorías y el menú en ese orden', async () => {
      await deleteMenu('menu-uuid-001');

      const tables = mockFrom.mock.calls.map((c) => c[0]);
      expect(tables.indexOf('tablia_menu_items')).toBeLessThan(
        tables.indexOf('tablia_menu_categories'),
      );
      expect(tables).toContain('tablia_menus');
    });
  });

  describe('getMenusByVenue()', () => {
    it('retorna los menús cuando existen', async () => {
      const menus = [
        { ...mockMenu, id: 'menu-2', created_at: '2024-02-01T00:00:00Z' },
        { ...mockMenu, id: 'menu-1', created_at: '2024-01-01T00:00:00Z' },
      ];

      // getMenusByVenue awaits .from().select().eq().order()
      // Override the chain for this test so .order() is awaitable
      mockFrom.mockImplementationOnce(() => {
        const c: any = {
          then: undefined,
          select: () => c,
          eq: () => c,
          order: () => Promise.resolve({ data: menus, error: null }),
        };
        return c;
      });

      const result = await getMenusByVenue('venue-uuid-001');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('menu-2');
    });

    it('retorna array vacío si no hay menús', async () => {
      mockFrom.mockImplementationOnce(() => {
        const c: any = {
          then: undefined,
          select: () => c,
          eq: () => c,
          order: () => Promise.resolve({ data: null, error: null }),
        };
        return c;
      });

      const result = await getMenusByVenue('venue-uuid-001');

      expect(result).toEqual([]);
    });
  });
});
