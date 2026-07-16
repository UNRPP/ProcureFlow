# Phase 3 handoff — Dashboard, workload, aging, and reports

Implemented on 2026-07-15. Live database acceptance remains intentionally
deferred until Supabase is connected, as approved by the project owner.

## Completed features

- Live, RLS-scoped dashboard with six procurement KPIs.
- Work-category and budget-category doughnuts, procurement-type and current-stage bars, and a six-month created/completed trend.
- Bottleneck, overdue-case, and officer-workload tables.
- My Work groupings for current action, overdue, due soon, owned, and owned-but-unassigned cases.
- Calendar agendas using current workflow due dates before case target dates.
- Personnel-stage KPI reporting from immutable responsibility intervals.
- Minimum, maximum, average, median, and total decimal-day metrics with unique-case and interval counts.
- Work-status reporting grouped by category, procurement type, budget source, budget category, stage, department, owner, or fiscal year.
- English and Thai report filters, labels, tables, filenames, and workbook headings.
- Genuine `.xlsx` personnel and work-status workbooks with typed dates/numbers, filters, frozen headings, criteria, timestamps, raw detail, and formula-based reconciliation.
- Visual workbook verification across all seven generated sheets; no formula errors or clipping defects remained after the formatting pass.

## Migration

- `supabase/migrations/20260715140000_phase3_reporting.sql`
- Adds no new source-of-truth tables.
- Adds a dashboard aggregate, a personnel responsibility-interval KPI function, and a grouped work-status function.
- Reporting functions run with caller privileges so underlying table RLS continues to scope results.
- Decimal days are elapsed timestamp seconds divided by 86,400; SQL metrics round to four decimal places for transport and workbook display.

## Routes and components

- `/dashboard`
- `/my-work`
- `/calendar`
- `/reports`
- `/api/exports/reports/personnel.xlsx`
- `/api/exports/reports/work-status.xlsx`
- Dashboard chart components under `src/components/dashboard`.
- Report filters under `src/components/reports`.
- Report filtering, metric, query, and workbook modules under `src/features/reports`, `src/server/queries`, and `src/lib/exports`.

## Tests

- 90 Vitest tests pass across 14 files.
- Phase 3 migration tests verify function access, interval attribution, median calculation, every grouping dimension, and caller-RLS execution.
- Metric tests verify medians, unique-case attribution, inclusive date filters, allowlists, and reconciliation.
- Workbook tests reopen both export types and verify sheet names, formulas, typed numbers, typed dates, filters, frozen panes, reconciliation, and Thai localization.
- `supabase/tests/database/phase3_reporting.test.sql` verifies anonymous denial, authenticated execution, seeded interval metrics, and grouped-total reconciliation.
- ESLint, strict TypeScript, Vitest, and the production build pass.

## RLS and security

- Anonymous execution is revoked from all reporting functions.
- Only authenticated users can execute reports.
- Functions are not `security definer`; case, stage, profile, and history policies remain authoritative.
- Server export routes require an authenticated profile and never use a service-role key.
- Group dimensions are allowlisted, UUID/date inputs are validated, and stage filters are sanitized before RPC calls.

## Known limitations and deferred acceptance

- The migration and pgTAP suite have not yet run against Postgres in this environment.
- Dashboard, calendar, and report UI states are production-built but cannot be exercised with a signed-in browser until Supabase is connected.
- Result visibility intentionally differs by role because reports inherit RLS. Management-wide reports therefore require a manager, super-administrator, or auditor role.
- Case-detail exports retain the Phase 1 safety limit of 5,000 visible cases; pagination or asynchronous export should be considered if expected volumes exceed it.
- Real-time notification refresh, secure documents, and renewal reminders belong to Phase 4.

After connecting Supabase, run:

1. `npm run db:reset`
2. `npm run db:lint`
3. `npm run test:db`
4. Compare dashboard and grouped report totals for each role.
5. Export English and Thai workbooks from a signed-in browser and reconcile them to the visible case list.

## Recommended next action

Proceed to Phase 4 documents, comments, notifications, renewal reminders, and
Supabase Storage policies while keeping live database execution deferred.
