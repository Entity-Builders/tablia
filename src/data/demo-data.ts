import type { MenuCategory, MenuItem } from '../types';

/**
 * Demo restaurant data for the landing page interactive demo.
 * Hardcoded so it works without auth/Supabase.
 * Represents "El Rancho" — a classic Argentine parrilla.
 */

export const DEMO_VENUE_SLUG = 'el-rancho-demo';
export const DEMO_VENUE_NAME = 'El Rancho';

type DemoCategory = MenuCategory & { items: MenuItem[] };

export const DEMO_CATEGORIES: DemoCategory[] = [
  {
    id: 'cat-entradas',
    menu_id: 'demo-menu',
    name: 'Entradas',
    position: 0,
    items: [
      {
        id: 'item-provoleta',
        category_id: 'cat-entradas',
        name: 'Provoleta',
        description:
          'Queso provolone a la parrilla con orégano y tomate cherry',
        price: 1800,
        currency: 'ARS',
        tags: ['vegetariano'],
        position: 0,
        is_available: true,
      },
      {
        id: 'item-empanadas',
        category_id: 'cat-entradas',
        name: 'Empanadas de carne x6',
        description:
          'Rellenas con carne cortada a cuchillo, cebolla, huevo y aceitunas',
        price: 2400,
        currency: 'ARS',
        tags: [],
        position: 1,
        is_available: true,
      },
      {
        id: 'item-molleja',
        category_id: 'cat-entradas',
        name: 'Molleja a la parrilla',
        description:
          'Glándula de vacuno asada, crocante por fuera y cremosa por dentro. Con limón y chimichurri',
        price: 3200,
        currency: 'ARS',
        tags: ['sin-tacc'],
        position: 2,
        is_available: true,
      },
      {
        id: 'item-tabla',
        category_id: 'cat-entradas',
        name: 'Tabla de quesos y fiambres',
        description:
          'Brie, reggianito, salame, jamón serrano, frutas secas y pan casero',
        price: 4500,
        currency: 'ARS',
        tags: ['para-compartir'],
        position: 3,
        is_available: true,
      },
    ],
  },
  {
    id: 'cat-parrilla',
    menu_id: 'demo-menu',
    name: 'Parrilla',
    position: 1,
    items: [
      {
        id: 'item-bife',
        category_id: 'cat-parrilla',
        name: 'Bife de Chorizo 400g',
        description:
          'Corte de lomo ancho con grasa lateral. Servido con chimichurri de la casa',
        price: 8500,
        currency: 'ARS',
        tags: ['sin-tacc', 'estrella'],
        position: 0,
        is_available: true,
      },
      {
        id: 'item-vacio',
        category_id: 'cat-parrilla',
        name: 'Vacío a la parrilla',
        description: 'Corte generoso, 350-400g. Ideal para compartir de a dos',
        price: 7200,
        currency: 'ARS',
        tags: ['sin-tacc'],
        position: 1,
        is_available: true,
      },
      {
        id: 'item-costillar',
        category_id: 'cat-parrilla',
        name: 'Costillar de cerdo',
        description:
          'Media plancha (~5 costillas) a fuego lento. Glaseado con miel y mostaza. Tarda 35-45 min',
        price: 9800,
        currency: 'ARS',
        tags: ['sin-tacc', 'especial-semana'],
        position: 2,
        is_available: true,
      },
      {
        id: 'item-entrana',
        category_id: 'cat-parrilla',
        name: 'Entraña fina',
        description:
          'Corte fino y fibroso, sabor intenso. Se recomienda jugosa o a punto',
        price: 6800,
        currency: 'ARS',
        tags: ['sin-tacc'],
        position: 3,
        is_available: true,
      },
    ],
  },
  {
    id: 'cat-bebidas',
    menu_id: 'demo-menu',
    name: 'Bebidas',
    position: 2,
    items: [
      {
        id: 'item-malbec',
        category_id: 'cat-bebidas',
        name: 'Malbec Mendoza 2022',
        description: 'Carácter frutado con notas de ciruela. En copa o botella',
        price: 1200,
        currency: 'ARS',
        tags: [],
        position: 0,
        is_available: true,
      },
      {
        id: 'item-agua',
        category_id: 'cat-bebidas',
        name: 'Agua mineral',
        description: 'Con o sin gas, 500ml',
        price: 600,
        currency: 'ARS',
        tags: ['sin-tacc', 'vegano'],
        position: 1,
        is_available: true,
      },
      {
        id: 'item-gaseosa',
        category_id: 'cat-bebidas',
        name: 'Gaseosa',
        description: 'Coca Cola, Sprite o Fanta. Lata 354ml',
        price: 800,
        currency: 'ARS',
        tags: ['vegano'],
        position: 2,
        is_available: true,
      },
      {
        id: 'item-limonada',
        category_id: 'cat-bebidas',
        name: 'Limonada natural',
        description: 'Exprimida al momento, con menta y azúcar. Con o sin gas',
        price: 1100,
        currency: 'ARS',
        tags: ['vegano', 'sin-tacc'],
        position: 3,
        is_available: true,
      },
    ],
  },
  {
    id: 'cat-postres',
    menu_id: 'demo-menu',
    name: 'Postres',
    position: 3,
    items: [
      {
        id: 'item-flan',
        category_id: 'cat-postres',
        name: 'Flan casero',
        description:
          'Preparado diariamente en cocina, con dulce de leche repostero y crema',
        price: 1500,
        currency: 'ARS',
        tags: ['sin-tacc', 'vegetariano'],
        position: 0,
        is_available: true,
      },
      {
        id: 'item-mousse',
        category_id: 'cat-postres',
        name: 'Mousse de chocolate',
        description: 'Chocolate oscuro 70% con coulis de frambuesa',
        price: 1800,
        currency: 'ARS',
        tags: ['vegetariano'],
        position: 1,
        is_available: true,
      },
      {
        id: 'item-helado',
        category_id: 'cat-postres',
        name: 'Helado artesanal (2 bochas)',
        description: 'Dulce de leche, chocolate, crema americana o frutilla',
        price: 1400,
        currency: 'ARS',
        tags: ['vegetariano', 'sin-tacc'],
        position: 2,
        is_available: true,
      },
    ],
  },
];
