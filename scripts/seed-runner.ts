/**
 * seed-runner.ts — CLI entry point for all seed scenarios
 *
 * Usage:
 *   yarn workspace tablia seed:restaurant   → full published restaurant
 *   yarn workspace tablia seed:analytics    → restaurant + analytics instructions
 *   yarn workspace tablia seed:reset        → wipe all seed data
 */
import 'dotenv/config';
// Load .env.seed on top of .env.local
import { config } from 'dotenv';
config({
  path: new URL('../.env.seed', import.meta.url).pathname,
  override: false,
});
config({
  path: new URL('../.env.local', import.meta.url).pathname,
  override: false,
});

const scenario = (() => {
  const idx = process.argv.indexOf('--scenario');
  return idx !== -1
    ? process.argv[idx + 1]
    : (process.argv[2] ?? 'restaurant-full');
})();

const isReset = process.argv.includes('--reset') || scenario === 'reset';

async function main() {
  console.log('\n\x1b[1m\x1b[35m  🌱 Tablia Seed Runner\x1b[0m');
  console.log(`  Scenario: \x1b[1m${isReset ? 'reset' : scenario}\x1b[0m\n`);

  try {
    if (isReset) {
      const { seedReset } = await import('./scenarios/reset.ts');
      await seedReset();
    } else if (scenario === 'restaurant-full') {
      const { seedRestaurantFull } =
        await import('./scenarios/restaurant-full.ts');
      await seedRestaurantFull();
    } else if (scenario === 'analytics-ready') {
      const { seedAnalyticsReady } =
        await import('./scenarios/analytics-ready.ts');
      await seedAnalyticsReady();
    } else {
      console.error(`\x1b[31m  Scenario desconocido: "${scenario}"\x1b[0m`);
      console.log('  Opciones: restaurant-full | analytics-ready | reset\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n\x1b[31m  ✗ Error durante el seed:\x1b[0m', err);
    process.exit(1);
  }

  process.exit(0);
}

main();
