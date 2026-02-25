/**
 * Scenario: Full published restaurant
 * Creates a complete venue + menu + categories + items + chat sessions
 * ready to view at /m/:slug
 *
 * Usage: yarn workspace tablia seed:restaurant
 */
import {
  db,
  SEED_USER_ID,
  SEED_SLUG,
  log,
  ensureSeedUser,
} from '../seed.config';
import {
  CONVERSATION_CURIOUS,
  CONVERSATION_VEGGIE,
  CONVERSATION_ALLERGY,
  CONVERSATION_PRICES,
  CONVERSATION_DELIVERY,
  CONVERSATION_WINE,
  CONVERSATION_KIDS,
  CONVERSATION_ENGAGED,
  CONVERSATION_CUTS,
  CONVERSATION_PORTIONS,
  CONVERSATION_COOKING,
  CONVERSATION_DESSERT,
  CONVERSATION_CHIMICHURRI,
  CONVERSATION_MOLLEJA,
} from '../fixtures/chat.fixtures';

const VENUE_NAME = 'La Parrilla del Centro 🔥';
const BASE_URL = process.env.VITE_PUBLIC_URL || 'http://localhost:5174';

const CATEGORIES = [
  {
    name: 'Entradas',
    icon: '🥗',
    sort_order: 0,
    items: [
      {
        name: 'Empanadas x6',
        description:
          'Rellenas de carne cortada a cuchillo, jugosas y doradas al horno de barro',
        price: 2400,
        currency: 'ARS',
        tags: ['popular'],
      },
      {
        name: 'Provoleta',
        description:
          'Queso provolone a la parrilla con orégano fresco y tomate cherry',
        price: 1800,
        currency: 'ARS',
        tags: ['vegetariano'],
      },
      {
        name: 'Tabla de fiambres',
        description:
          'Jamón crudo, salame, quesos estacionados y pickles artesanales',
        price: 3200,
        currency: 'ARS',
        tags: ['para compartir'],
      },
      {
        name: 'Chorizo criollo',
        description:
          'Chorizo artesanal a la parrilla servido con chimichurri de la casa',
        price: 1500,
        currency: 'ARS',
        tags: ['popular'],
      },
      {
        name: 'Morcilla con pimientos',
        description:
          'Morcilla criolla asada, acompañada de pimientos asados al oliva',
        price: 1400,
        currency: 'ARS',
        tags: [],
      },
      {
        name: 'Ensalada mixta',
        description:
          'Lechuga, tomate, cebolla morada, zanahoria rallada y oliva extra virgen',
        price: 1200,
        currency: 'ARS',
        tags: ['vegetariano', 'sin TACC'],
      },
    ],
  },
  {
    name: 'Parrilla',
    icon: '🥩',
    sort_order: 1,
    items: [
      {
        name: 'Bife de Chorizo 400g',
        description:
          'Punto a elección, servido con chimichurri de la casa y papas fritas rústicas',
        price: 8500,
        currency: 'ARS',
        tags: ['popular', 'sin TACC'],
      },
      {
        name: 'Vacío a la parrilla',
        description:
          'Cocción lenta de 40 minutos, tierno y jugoso. Viene con ensalada',
        price: 7200,
        currency: 'ARS',
        tags: ['sin TACC'],
      },
      {
        name: 'Costillar de cerdo',
        description:
          'Media plancha al carbón con glaseado de miel y mostaza antigua',
        price: 9800,
        currency: 'ARS',
        tags: ['chef recomienda', 'para compartir'],
      },
      {
        name: 'Entraña fina 350g',
        description:
          'Corte especial, muy tierno. Solo punto jugoso o a punto. Sin acompañamiento extra',
        price: 9200,
        currency: 'ARS',
        tags: ['chef recomienda', 'sin TACC'],
      },
      {
        name: 'Tira de asado x kg',
        description:
          'El clásico. Precio por kilogramo, consultar disponibilidad del día',
        price: 12000,
        currency: 'ARS',
        tags: ['sin TACC'],
      },
      {
        name: 'Pollo a la parrilla',
        description: 'Medio pollo marinado en limón y hierbas, cocción lenta',
        price: 5800,
        currency: 'ARS',
        tags: ['sin TACC'],
      },
      {
        name: 'Molleja a la parrilla',
        description:
          'Mollejas tiernas al carbón, crocantes por fuera. Acompañan bien al bife',
        price: 4500,
        currency: 'ARS',
        tags: [],
      },
    ],
  },
  {
    name: 'Acompañamientos',
    icon: '🥔',
    sort_order: 2,
    items: [
      {
        name: 'Papas fritas rústicas',
        description:
          'Con cáscara, al horno. Crujientes por fuera y suaves por dentro',
        price: 1400,
        currency: 'ARS',
        tags: ['vegetariano', 'sin TACC'],
      },
      {
        name: 'Puré de papas',
        description: 'Casero, con manteca y nuez moscada',
        price: 1200,
        currency: 'ARS',
        tags: ['vegetariano'],
      },
      {
        name: 'Ensalada de rúcula y parmesano',
        description:
          'Rúcula fresca, virutas de parmesano, nueces y vinagreta de miel',
        price: 1600,
        currency: 'ARS',
        tags: ['vegetariano', 'sin TACC'],
      },
      {
        name: 'Vegetales grillados',
        description:
          'Zucchini, berenjena, morrones y cebollas a la parrilla con oliva y sal gruesa',
        price: 1800,
        currency: 'ARS',
        tags: ['vegetariano', 'sin TACC'],
      },
    ],
  },
  {
    name: 'Postres',
    icon: '🍮',
    sort_order: 3,
    items: [
      {
        name: 'Flan casero con dulce de leche',
        description: 'Elaboración propia, con crema y dulce de leche repostero',
        price: 1500,
        currency: 'ARS',
        tags: ['popular'],
      },
      {
        name: 'Mousse de chocolate',
        description: 'Oscuro y cremoso, servido frío con coulis de frambuesa',
        price: 1600,
        currency: 'ARS',
        tags: ['vegetariano'],
      },
      {
        name: 'Tabla de quesos',
        description:
          'Brie, reggianito y gruyère con membrillo artesanal y nueces',
        price: 2800,
        currency: 'ARS',
        tags: ['para compartir'],
      },
      {
        name: 'Helado artesanal',
        description:
          'Dos bochas a elección: dulce de leche, chocolate, crema o frutilla',
        price: 1200,
        currency: 'ARS',
        tags: ['vegetariano', 'sin TACC'],
      },
    ],
  },
  {
    name: 'Bebidas',
    icon: '🍷',
    sort_order: 4,
    items: [
      {
        name: 'Vino tinto Malbec (copa)',
        description: 'Mendoza, cosecha 2022 — ideal con carnes rojas',
        price: 1200,
        currency: 'ARS',
        tags: [],
      },
      {
        name: 'Vino tinto Malbec (botella)',
        description: 'Botella entera, misma etiqueta',
        price: 5800,
        currency: 'ARS',
        tags: ['para compartir'],
      },
      {
        name: 'Torrontés (copa)',
        description: 'Blanco seco de Salta, perfecto para entradas y provoleta',
        price: 1100,
        currency: 'ARS',
        tags: [],
      },
      {
        name: 'Agua mineral 500ml',
        description: 'Con o sin gas',
        price: 600,
        currency: 'ARS',
        tags: ['sin TACC'],
      },
      {
        name: 'Agua mineral 1L',
        description: 'Con o sin gas',
        price: 950,
        currency: 'ARS',
        tags: ['sin TACC'],
      },
      {
        name: 'Gaseosa',
        description: 'Coca Cola, Sprite o Fanta — lata 354ml',
        price: 800,
        currency: 'ARS',
        tags: [],
      },
      {
        name: 'Limonada natural',
        description:
          'Preparada al momento con limón exprimido, azúcar y jengibre. Sin gas',
        price: 1100,
        currency: 'ARS',
        tags: ['vegetariano', 'sin TACC'],
      },
      {
        name: 'Sangría de la casa (jarra)',
        description:
          'Malbec, naranja, manzana, canela y un toque de brandy. Para 3-4 personas',
        price: 4200,
        currency: 'ARS',
        tags: ['para compartir'],
      },
      {
        name: 'Cerveza artesanal rubia',
        description:
          'Pinta 500ml. Elaboración local, sabor suave y refrescante',
        price: 1800,
        currency: 'ARS',
        tags: [],
      },
    ],
  },
];

export async function seedRestaurantFull() {
  log.title('🌱 Seed: Restaurante completo publicado');

  // 1. Ensure seed user exists in auth.users
  await ensureSeedUser();

  // 2. Clean up previous seed (idempotent)
  log.info('Limpiando seed anterior...');
  const { data: existingVenue } = await db
    .from('tablia_venues')
    .select('id')
    .eq('slug', SEED_SLUG)
    .maybeSingle();

  if (existingVenue) {
    const { data: existingMenu } = await db
      .from('tablia_menus')
      .select('id')
      .eq('venue_id', existingVenue.id)
      .maybeSingle();

    if (existingMenu) {
      await db
        .from('tablia_chat_sessions')
        .delete()
        .eq('menu_id', existingMenu.id);
      await db
        .from('tablia_menu_items')
        .delete()
        .eq('menu_id', existingMenu.id);
      await db
        .from('tablia_menu_categories')
        .delete()
        .eq('menu_id', existingMenu.id);
      await db.from('tablia_menus').delete().eq('id', existingMenu.id);
    }
    await db.from('tablia_venues').delete().eq('id', existingVenue.id);
  }

  // 3. Create venue
  log.info(`Creando venue: ${VENUE_NAME}`);
  const { data: venue, error: venueError } = await db
    .from('tablia_venues')
    .insert({
      owner_id: SEED_USER_ID,
      name: VENUE_NAME,
      slug: SEED_SLUG,
      description: 'La mejor parrilla argentina del microcentro. Desde 1985.',
      cuisine_type: 'Parrilla',
    })
    .select()
    .single();

  if (venueError) throw new Error(`Error creando venue: ${venueError.message}`);
  log.ok(`Venue creado: ${venue.id}`);

  // 4. Create menu
  log.info('Creando menú...');
  const { data: menu, error: menuError } = await db
    .from('tablia_menus')
    .insert({
      venue_id: venue.id,
      name: 'Menú Principal',
      source_type: 'text',
      source_content: 'Seed generado por script de desarrollo',
      status: 'published',
    })
    .select()
    .single();

  if (menuError) throw new Error(`Error creando menú: ${menuError.message}`);
  log.ok(`Menú creado: ${menu.id}`);

  // 5. Create categories and items
  let totalItems = 0;
  for (const cat of CATEGORIES) {
    log.info(`  Categoría: ${cat.icon} ${cat.name}`);

    const { data: category, error: catError } = await db
      .from('tablia_menu_categories')
      .insert({
        menu_id: menu.id,
        name: cat.name,
        icon: cat.icon,
        sort_order: cat.sort_order,
        is_visible: true,
      })
      .select()
      .single();

    if (catError)
      throw new Error(`Error en categoría ${cat.name}: ${catError.message}`);

    const items = cat.items.map((item, idx) => ({
      category_id: category.id,
      menu_id: menu.id,
      name: item.name,
      description: item.description || null,
      price: item.price,
      currency: item.currency,
      tags: item.tags,
      is_available: true,
      sort_order: idx,
    }));

    const { error: itemsError } = await db
      .from('tablia_menu_items')
      .insert(items);
    if (itemsError)
      throw new Error(`Error en ítems de ${cat.name}: ${itemsError.message}`);

    totalItems += items.length;
  }

  log.ok(`${CATEGORIES.length} categorías y ${totalItems} ítems creados`);

  // 6. Seed chat conversations
  log.info('Creando conversaciones de chat...');
  const chatSessions = [
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_CURIOUS,
      customer_email: 'grupo@example.com',
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_VEGGIE,
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_ALLERGY,
      customer_email: 'celiac@example.com',
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_PRICES,
      customer_email: 'presupuesto@example.com',
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_DELIVERY,
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_WINE,
      customer_email: 'sommelier@example.com',
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_KIDS,
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_ENGAGED,
      customer_email: 'firsttime@example.com',
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_CUTS,
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_PORTIONS,
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_COOKING,
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_DESSERT,
      customer_email: 'flan@example.com',
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_CHIMICHURRI,
    },
    {
      menu_id: menu.id,
      venue_id: venue.id,
      messages: CONVERSATION_MOLLEJA,
    },
  ];

  const { error: chatError } = await db
    .from('tablia_chat_sessions')
    .insert(chatSessions);

  if (chatError) {
    log.warn(`Chat sessions no insertadas: ${chatError.message}`);
    log.warn(
      'Tip: Aplicá la migración con: cd eb-infra && npx supabase migration up',
    );
  } else {
    log.ok(`${chatSessions.length} conversaciones de chat creadas`);
  }

  // 7. Print result
  const menuUrl = `${BASE_URL}/m/${SEED_SLUG}`;
  console.log('\n' + '─'.repeat(50));
  log.ok('¡Seed completado! 🎉');
  log.url('Menú público', menuUrl);
  log.url('Dashboard local', `http://localhost:54323`);
  console.log('─'.repeat(50) + '\n');

  return { venue, menu };
}
