/**
 * Scenario: Reset — wipe all seed data
 * Deletes everything created by the seed scripts.
 *
 * Usage: yarn workspace tablia seed:reset
 */
import { db, SEED_SLUG, log } from '../seed.config.ts';

export async function seedReset() {
  log.title('🗑  Reset: eliminando datos de seed');

  const { data: venue } = await db
    .from('tablia_venues')
    .select('id')
    .eq('slug', SEED_SLUG)
    .single();

  if (!venue) {
    log.warn('No se encontraron datos de seed para eliminar');
    return;
  }

  const { data: menus } = await db
    .from('tablia_menus')
    .select('id')
    .eq('venue_id', venue.id);

  for (const menu of menus || []) {
    await db.from('tablia_menu_items').delete().eq('menu_id', menu.id);
    log.ok(`Items eliminados (menu: ${menu.id})`);
    await db.from('tablia_menu_categories').delete().eq('menu_id', menu.id);
    log.ok(`Categorías eliminadas (menu: ${menu.id})`);
    await db.from('tablia_menus').delete().eq('id', menu.id);
    log.ok(`Menú eliminado: ${menu.id}`);
  }

  await db.from('tablia_venues').delete().eq('id', venue.id);
  log.ok(`Venue eliminado: ${venue.id}`);

  console.log('\n' + '─'.repeat(50));
  log.ok('Reset completado ✓');
  console.log('─'.repeat(50) + '\n');
}
