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
        description: 'Rellenas de carne cortada a cuchillo, jugosas',
        price: 2400,
        currency: 'ARS',
        tags: ['popular'],
      },
      {
        name: 'Provoleta',
        description: 'Con orégano y tomate cherry',
        price: 1800,
        currency: 'ARS',
        tags: ['vegetariano'],
      },
      {
        name: 'Tabla de fiambres',
        description: 'Jamón crudo, salame, quesos y pickles',
        price: 3200,
        currency: 'ARS',
        tags: ['para compartir'],
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
        description: 'Punto a elección, con chimichurri de la casa',
        price: 8500,
        currency: 'ARS',
        tags: ['popular'],
      },
      {
        name: 'Vacío a la parrilla',
        description: 'Cocción lenta, tierno y jugoso',
        price: 7200,
        currency: 'ARS',
        tags: [],
      },
      {
        name: 'Costillar de cerdo',
        description: 'Con glaseado de miel y mostaza',
        price: 9800,
        currency: 'ARS',
        tags: ['chef recomienda'],
      },
    ],
  },
  {
    name: 'Bebidas',
    icon: '🍷',
    sort_order: 2,
    items: [
      {
        name: 'Vino tinto Malbec (copa)',
        description: 'Mendoza, cosecha 2022',
        price: 1200,
        currency: 'ARS',
        tags: [],
      },
      {
        name: 'Agua mineral 500ml',
        price: 600,
        currency: 'ARS',
        tags: [],
      },
      {
        name: 'Gaseosa',
        description: 'Coca Cola, Sprite o Fanta',
        price: 800,
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
