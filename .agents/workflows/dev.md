---
description: How to start the Tablia development server
---

## Start Tablia Dev Server

// turbo-all

1. Make sure the local Supabase instance is running:

```bash
cd /Users/juano/projects/entity-builders/eb-infra && docker-compose up -d
```

2. Start Tablia dev server from monorepo root:

```bash
cd /Users/juano/projects/entity-builders && yarn start:tablia
```

3. Open in browser: http://localhost:5174

## Notes

- Port: 5174 (Tellee uses 5173)
- Env: `.env.local` points to local eb-infra Supabase
- Hot reload enabled via Vite
