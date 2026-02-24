/**
 * seed.config.ts
 * Shared Supabase client for seed scripts using service_role (bypasses RLS).
 * Only for local dev — NEVER use service_role in production.
 */
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';

// Generate a service_role JWT using the known local Supabase JWT secret.
// This matches the GOTRUE_JWT_SECRET in eb-infra.
function makeServiceRoleJWT(secret: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      iss: 'supabase',
      role: 'service_role',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year
    }),
  ).toString('base64url');

  const sig = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${sig}`;
}

// The JWT secret used by eb-infra (from GOTRUE_JWT_SECRET in docker)
const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || makeServiceRoleJWT(JWT_SECRET);

export const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// The user that will "own" seeded venues.
// Set SEED_USER_ID in .env.seed — get your UUID from Supabase dashboard → Auth.
// Defaults to a fixed UUID that will be created in auth.users automatically.
export const SEED_USER_ID =
  process.env.SEED_USER_ID || '11111111-1111-1111-1111-111111111111';

export const SEED_SLUG = 'seed-parrilla-dev';

// Colors for terminal output
export const log = {
  info: (msg: string) => console.log(`\x1b[36m  ℹ  ${msg}\x1b[0m`),
  ok: (msg: string) => console.log(`\x1b[32m  ✓  ${msg}\x1b[0m`),
  warn: (msg: string) => console.log(`\x1b[33m  ⚠  ${msg}\x1b[0m`),
  error: (msg: string) => console.log(`\x1b[31m  ✗  ${msg}\x1b[0m`),
  title: (msg: string) => console.log(`\n\x1b[1m\x1b[35m  ${msg}\x1b[0m\n`),
  url: (label: string, url: string) =>
    console.log(`\x1b[1m  →  ${label}:\x1b[0m \x1b[4m\x1b[34m${url}\x1b[0m\n`),
};

/**
 * Ensures the seed user exists in auth.users.
 * Uses the admin API (requires service_role).
 */
export async function ensureSeedUser() {
  const adminUrl = `${supabaseUrl}/auth/v1/admin/users`;
  const res = await fetch(adminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      id: SEED_USER_ID,
      email: 'seed@tablia.dev',
      password: 'seed-password-dev',
      email_confirm: true,
    }),
  });

  // 422 = user already exists, that's fine
  if (!res.ok && res.status !== 422) {
    const body = await res.text();
    // If it's a conflict (already exists), continue silently
    if (!body.includes('already') && !body.includes('exist')) {
      log.warn(`No se pudo crear usuario seed: ${body}`);
    }
  } else {
    log.ok(`Usuario seed: seed@tablia.dev (${SEED_USER_ID})`);
  }
}
