---
name: 'Tablia'
tagline: 'AI-powered QR menu adapter for restaurants and bars'
platform: 'Web'
status: 'active'
category: 'b2b'
icon: '🍽️'
features:
  - 'AI menu import from PDF, image, or text'
  - 'Public QR landing page'
  - 'Conversational menu assistant'
  - 'Restaurant analytics dashboard'
downloadUrl: ''
visible: true
---

# Tablia

Tablia is an AI-powered QR menu adapter for restaurants and bars. It absorbs an
existing menu from text, PDF, or image, turns it into structured data, publishes a
mobile-friendly QR page, and adds a chat assistant plus analytics for the venue
owner.

## Architecture

- Framework: Vite + React + TypeScript
- Styling: vanilla CSS with design tokens in `src/index.css`
- Auth/DB: Supabase Auth + Postgres via shared `eb-core`
- Database: canonical schema is `tablia`, with unprefixed tables such as
  `venues`, `menus`, `menu_categories`, `menu_items`, and `chat_sessions`
- AI: Gemini for menu parsing, contact enrichment, and menu chat
- Analytics: shared `@eb-packages/analytics` PostHog wrapper
- Hosting target: Cloudflare via `wrangler`

## Local Development

```bash
# Start shared infra first
cd ../../eb-infra && yarn start

# Then run Tablia from the monorepo root
yarn start:tablia
```

Open: `http://tablia.local`

## Useful Commands

```bash
yarn workspace tablia test
yarn workspace tablia build
yarn workspace tablia seed:restaurant
yarn workspace tablia seed:reset
```

## Database Notes

Runtime code uses `createClient(..., { db: { schema: 'tablia' } })`, so app
queries call `.from('venues')`, `.from('menus')`, etc. Old `public.tablia_*`
migrations are legacy and are converged by `eb-infra` migrations.
