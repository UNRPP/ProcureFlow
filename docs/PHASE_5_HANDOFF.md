# Phase 5 handoff — hardening and deployment readiness

Phase 5 is complete at the repository level. Live migration, RLS, Storage, query-plan, and end-to-end acceptance remains intentionally deferred until Supabase is connected.

## Completed features

- Browser security headers, build-time Supabase Content Security Policy, hidden framework header, and production HSTS configuration.
- Local demo credentials are excluded from production rendering.
- Local redirect validation, server-only privileged credentials, bounded 27 MB Server Action requests, and a 25 MB document validation/bucket limit.
- Localized global and dashboard error states, localized not-found state, dashboard loading state, and `/api/health` configuration liveness route.
- Structured server logging that omits database messages and user-authored procurement content.
- Keyboard skip navigation, associated form errors, table captions, chart text alternatives, status text/icons, reduced-motion behavior, and lazy-loaded Recharts bundle.
- Current case-list pagination and bounded export sizes retained; dashboard/report work remains server fetched.
- CI for formatting, lint, strict TypeScript, unit/static tests, and production build.
- Environment-gated Playwright/axe acceptance tests for sign-in, locale persistence, accessibility, case/workflow/document flow, dashboard, and both Excel exports.
- Production-safe baseline seed and a versioned first-super-admin bootstrap script.
- Environment, migration, deployment, permissions, workflow, operations, backup/restore, UAT, and deferred database guides.

## Migration

- `supabase/migrations/20260715200000_phase5_hardening.sql`
  - Adds partial open-case/completion/assignment indexes.
  - Adds responsibility-period/stage indexes for reports.
  - Adds the required-document lookup index.
  - Revokes schema creation from application roles and makes future function execution explicit-grant only.
- `supabase/production_seed.sql` contains roles, fixed work categories, and generic document types only; it contains no users, credentials, cases, or hospital-specific finance data.
- `supabase/bootstrap_super_admin.sql` grants the first controlled administrator role through a direct, audited `psql` operation.

## Routes and components

- `/api/health` — configuration liveness with no privileged query or sensitive response.
- `src/app/global-error.tsx` and `src/app/not-found.tsx` — localized application-wide failure states.
- `src/components/dashboard/dashboard-charts-lazy.tsx` — deferred client chart loading.
- `src/lib/observability/server.ts` — structured, low-data server events.
- `src/components/layout/app-shell.tsx` — keyboard skip target.
- Existing case, dashboard, report, workflow, document, and notification UI received accessibility hardening.

## RLS and security

- Static tests enumerate every `public` business table created across all migrations and require RLS to be enabled.
- Phase 5 pgTAP checks schema creation privileges, protected function execution, representative RLS state, and the document lookup index.
- Service-role references are statically prohibited from Client Components.
- Normal users still cannot directly mutate audit events, completed stage history, responsibility intervals, case-stage document snapshots, comments, or document versions.
- `case-documents` remains private; object updates remain disallowed.

## Verification

- ESLint: passed.
- Strict TypeScript: passed.
- Vitest: 121 tests passed across 18 files.
- Playwright: 2 complete acceptance scenarios discovered and correctly skipped without `E2E_BASE_URL`.
- pgTAP command: attempted and failed closed because no local Postgres/Supabase service is running, as expected for the deferred database step.
- Production build: passed with all application/API routes.
- Production server smoke: `/api/health` returned `200`, `Cache-Control: no-store`, and all configured security headers.
- Dependency audit: no vulnerabilities reported after Phase 5 dependencies were installed.
- Phase 3 Excel workbooks were previously imported, formula-inspected, rendered, and visually verified with reconciled totals.

## Known limitations and deferred acceptance

- Migrations and pgTAP were not run against Postgres; Docker/hosted Supabase was deferred by request.
- RLS and Storage policies have static and pgTAP coverage but require live multi-role acceptance.
- Playwright/axe tests require a running application backed by a reset seeded local or staging project.
- Query indexes require `EXPLAIN (ANALYZE, BUFFERS)` validation at production-like volume.
- Malware scanning/content inspection, SSO/MFA, SMTP, retention, monitoring destination, RPO/RTO, domain, and hosting/project plan are hospital decisions.
- The CSP permits inline scripts/styles for current Next.js operation; a nonce-based policy can be evaluated with the production edge/security platform if hospital policy requires it.

## Recommended next action

Follow `docs/DEFERRED_DATABASE_ACCEPTANCE.md` when ready to connect Supabase, then complete `docs/UAT_CHECKLIST.md` and the restore drill in staging before production deployment.
