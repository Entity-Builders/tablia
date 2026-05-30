# Tablia Supabase Folder

This folder is legacy context from the earlier standalone Tablia project shape.

While Tablia lives in the shared `eb-core` Supabase project, the source of truth
for database migrations is:

```text
eb-infra/supabase/migrations/
```

Runtime code uses the `tablia` schema and unprefixed table names:

```ts
supabase.from('venues')
supabase.from('menus')
supabase.from('menu_items')
```

Do not run `supabase db push` from this app folder unless Tablia graduates to
its own Supabase project again and these migrations are rebuilt for that target.
