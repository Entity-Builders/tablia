/**
 * Scenario: Analytics-ready venue
 * Creates a venue + published menu with a known slug, then prints instructions
 * for querying PostHog with that slug.
 *
 * Usage: yarn workspace tablia seed:analytics
 */
import { db, SEED_USER_ID, SEED_SLUG, log } from '../seed.config';
import { seedRestaurantFull } from './restaurant-full';

const POSTHOG_HOST =
  process.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const POSTHOG_PROJECT = process.env.VITE_POSTHOG_PROJECT_ID || '';
const BASE_URL = process.env.VITE_PUBLIC_URL || 'http://localhost:5174';

export async function seedAnalyticsReady() {
  log.title('🌱 Seed: Venue listo para analytics');

  // Base: full restaurant
  await seedRestaurantFull();

  // Print PostHog instructions
  console.log('─'.repeat(50));
  log.info('Para ver analytics en el Dashboard:');
  console.log('');
  log.info(`  1. Abrí el menú y navegá algunas categorías`);
  log.info(`  2. Enviá algunos mensajes en el chat`);
  log.info(`  3. Volvé al Dashboard → los eventos aparecen en PostHog`);
  console.log('');
  log.info(`Slug del venue: \x1b[1m${SEED_SLUG}\x1b[0m`);
  log.url('Menú público', `${BASE_URL}/m/${SEED_SLUG}`);

  if (POSTHOG_PROJECT) {
    log.url(
      'PostHog events',
      `${POSTHOG_HOST}/project/${POSTHOG_PROJECT}/events?properties=%5B%7B%22key%22%3A%22slug%22%2C%22value%22%3A%22${SEED_SLUG}%22%7D%5D`,
    );
  }
  console.log('─'.repeat(50) + '\n');
}
