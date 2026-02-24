import type {
  ParsedMenu,
  Menu,
  Venue,
  MenuCategory,
  MenuItem,
} from '../../types';

// ─── Venue ────────────────────────────────────────────────────────
export const mockVenue: Venue = {
  id: 'venue-uuid-001',
  owner_id: 'user-uuid-001',
  name: 'La Parrilla del Centro',
  slug: 'la-parrilla-del-centro',
  description: 'La mejor parrilla argentina del microcentro',
  cuisine_type: 'Parrilla',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

// ─── Menu ─────────────────────────────────────────────────────────
export const mockMenu: Menu = {
  id: 'menu-uuid-001',
  venue_id: 'venue-uuid-001',
  name: 'Menú Principal',
  source_type: 'text',
  source_content: 'Menú de La Parrilla del Centro...',
  status: 'published',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

export const mockMenuDraft: Menu = {
  ...mockMenu,
  id: 'menu-uuid-002',
  status: 'draft',
};
export const mockMenuReview: Menu = {
  ...mockMenu,
  id: 'menu-uuid-003',
  status: 'review',
};

// ─── Categories & Items ───────────────────────────────────────────
export const mockCategories: (MenuCategory & { items: MenuItem[] })[] = [
  {
    id: 'cat-uuid-001',
    menu_id: 'menu-uuid-001',
    name: 'Entradas',
    description: 'Para abrir el apetito',
    sort_order: 0,
    is_visible: true,
    items: [
      {
        id: 'item-uuid-001',
        category_id: 'cat-uuid-001',
        menu_id: 'menu-uuid-001',
        name: 'Empanadas x6',
        description: 'Rellenas de carne cortada a cuchillo',
        price: 2400,
        currency: 'ARS',
        tags: [],
        is_available: true,
        sort_order: 0,
      },
      {
        id: 'item-uuid-002',
        category_id: 'cat-uuid-001',
        menu_id: 'menu-uuid-001',
        name: 'Ensalada Mixta',
        description: 'Lechuga, tomate, zanahoria',
        price: 1800,
        currency: 'ARS',
        tags: ['vegano', 'sin-tacc'],
        is_available: true,
        sort_order: 1,
      },
    ],
  },
  {
    id: 'cat-uuid-002',
    menu_id: 'menu-uuid-001',
    name: 'Parrilla',
    description: 'Cortes seleccionados',
    sort_order: 1,
    is_visible: true,
    items: [
      {
        id: 'item-uuid-003',
        category_id: 'cat-uuid-002',
        menu_id: 'menu-uuid-001',
        name: 'Bife de Chorizo 400g',
        description: 'Servido con papas fritas',
        price: 8500,
        currency: 'ARS',
        tags: ['sin-tacc'],
        is_available: true,
        sort_order: 0,
      },
      {
        id: 'item-uuid-004',
        category_id: 'cat-uuid-002',
        menu_id: 'menu-uuid-001',
        name: 'Entraña 300g',
        price: 7200,
        currency: 'ARS',
        tags: [],
        is_available: true,
        sort_order: 1,
      },
    ],
  },
  {
    id: 'cat-uuid-003',
    menu_id: 'menu-uuid-001',
    name: 'Hidden Category',
    sort_order: 2,
    is_visible: false,
    items: [],
  },
];

// ─── ParsedMenu ───────────────────────────────────────────────────
export const mockParsedMenu: ParsedMenu = {
  categories: [
    {
      name: 'Entradas',
      description: 'Para abrir el apetito',
      items: [
        {
          name: 'Empanadas x6',
          description: 'Rellenas de carne',
          price: 2400,
          currency: 'ARS',
          tags: [],
        },
        {
          name: 'Ensalada Mixta',
          description: 'Lechuga, tomate',
          price: 1800,
          currency: 'ARS',
          tags: ['vegano'],
        },
      ],
    },
    {
      name: 'Parrilla',
      items: [
        {
          name: 'Bife de Chorizo 400g',
          price: 8500,
          currency: 'ARS',
          tags: ['sin-tacc'],
        },
      ],
    },
  ],
  metadata: {
    restaurant_name: 'La Parrilla del Centro',
    cuisine_type: 'Parrilla',
    confidence: 0.95,
  },
};

// ─── Raw menu text (input for parsing) ───────────────────────────
export const mockMenuText = `
LA PARRILLA DEL CENTRO

ENTRADAS:
- Empanadas x6: $2400
  Rellenas de carne cortada a cuchillo
- Ensalada Mixta: $1800 (vegano)

PARRILLA:
- Bife de Chorizo 400g: $8500 (sin-tacc)
  Servido con papas fritas
- Entraña 300g: $7200
`;
