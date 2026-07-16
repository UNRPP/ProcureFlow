# Migration and recovery workflow

All schema, constraints, functions, RLS policies, Storage policies, and indexes live under `supabase/migrations`. Do not make production-only schema changes in the dashboard.

## Create and verify a migration

```bash
nvm use
npx supabase migration new <short_name>
npm run db:reset
npm run db:lint
npm run test:db
npm run check
```

Review generated SQL for explicit privileges, RLS on every new business table, stable `search_path` settings, indexes for foreign keys and expected filters, and a safe upgrade path for existing rows. Add static Vitest coverage and behavioral pgTAP coverage in the same change.

## Deploy migrations

1. Back up the target environment and record the current migration list.
2. Apply to a disposable or staging project first with `npx supabase db push`.
3. Run pgTAP, Playwright, workbook reconciliation, and Storage authorization checks against staging.
4. Schedule production migration during the approved hospital change window.
5. Run `npx supabase db push` from the reviewed Git commit.
6. Verify the migration list, `/api/health`, sign-in, RLS smoke tests, reminder generation, and critical case workflows.

`supabase/production_seed.sql` contains only baseline roles, work categories, and document types. It contains no users, credentials, cases, or hospital-specific finance data. Apply it as controlled data initialization after migrations; do not apply `supabase/seed.sql` to production.

## Rollback policy

Prefer a forward corrective migration. Never edit a migration already applied to a shared environment. For an incompatible or destructive release:

1. stop application writes or place the deployment in maintenance mode;
2. capture database and `case-documents` Storage backups;
3. restore to a new Supabase project or perform the reviewed point-in-time recovery;
4. deploy the last known-good application against the recovered project;
5. reconcile audit events and documents created near the recovery boundary;
6. document the incident and add a regression test.

An application rollback alone is safe only when the previous release is compatible with the new schema. Never reverse workflow or audit history with ad-hoc SQL.
