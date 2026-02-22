# Tablia — Agent Context

## Product

**Tablia** (tablia.io) — AI-powered QR menu adapter for restaurants & bars.

- Absorbs existing menus (URL, PDF, image, text) via AI parsing
- Enhances with conversational AI assistant for comensales
- Provides analytics and CRM to restauranteros

## Architecture

- **Framework:** Vite + React + TypeScript
- **Styling:** Vanilla CSS with design tokens (index.css)
- **Auth:** Supabase Auth (email + Google)
- **DB:** Supabase Postgres (tables prefixed with `tablia_`)
- **AI:** Gemini API (@google/generative-ai) — menu parsing + chat
- **Icons:** Lucide React

## Key Routes

- `/` — Landing page (public)
- `/login` — Auth page (Supabase Auth UI)
- `/m/:slug` — Public menu view for comensales (scan QR → see menu + chat)
- `/dashboard` — Protected restaurantero panel

## Conventions

- CSS uses BEM-like naming: `.component__element--modifier`
- Design tokens in `src/index.css` (--accent, --bg-_, --text-_, etc.)
- All Supabase tables prefixed `tablia_`
- Services in `src/services/`, lib in `src/lib/`
- Types in `src/types.ts`
- Dev server on port **5174** (Tellee uses default 5173)

## Monorepo Context

Part of `entity-builders` monorepo. Run with `yarn start:tablia` from root.
