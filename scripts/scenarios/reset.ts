/**
 * Scenario: Reset — wipe all seed data
 * Deletes ONLY the venue created by the seed scripts (identified by SEED_SLUG).
 *
 * Usage: yarn workspace tablia seed:reset
 */
import { db, SEED_SLUG, log } from '../seed.config.ts';

export async function seedReset() {
  log.title('🗑  Reset: eliminando datos de seed');
  log.info(`Buscando venue con slug: "${SEED_SLUG}"`);

  const { data: venue, error } = await db
    .from('venues')
    .select('id, slug, name')
    .eq('slug', SEED_SLUG)
    .maybeSingle();

  if (error) {
    log.error(`Error buscando venue: ${error.message}`);
    return;
  }

  if (!venue) {
    log.warn(`No se encontró venue con slug "${SEED_SLUG}"`);
    log.info('Tip: Corré seed:restaurant primero para crear datos de prueba');
    return;
  }

  log.info(`Encontrado: "${venue.name}" (${venue.id})`);

  const { data: menus } = await db
    .from('menus')
    .select('id')
    .eq('venue_id', venue.id);

  for (const menu of menus || []) {
    await db.from('chat_sessions').delete().eq('menu_id', menu.id);
    await db.from('menu_items').delete().eq('menu_id', menu.id);
    await db.from('menu_categories').delete().eq('menu_id', menu.id);
    await db.from('menus').delete().eq('id', menu.id);
    log.ok(`Menú eliminado: ${menu.id}`);
  }

  await db.from('venues').delete().eq('id', venue.id);
  log.ok(`Venue eliminado: "${venue.name}"`);

  console.log('\n' + '─'.repeat(50));
  log.ok('Reset completado ✓');
  console.log('─'.repeat(50) + '\n');
}
