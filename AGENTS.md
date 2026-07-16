# AGENTS.md

## Mission

Build and maintain a simple, secure, auditable procurement work management platform for a hospital procurement department.

The application supports medical devices, medical equipment, and contracts for services. Supabase is the backend and source of truth.

## Required stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui
- Supabase Auth, Postgres, Storage, and Row Level Security
- React Hook Form + Zod
- TanStack Table
- Recharts
- date-fns
- Lucide icons
- Vercel

## Non-negotiable architecture rules

1. Use a modular monolith.
2. Do not introduce microservices.
3. Keep business rules outside visual components.
4. Prefer server-side fetching for read-heavy screens.
5. Use Client Components only for necessary interaction.
6. Validate with Zod and enforce invariants with database constraints.
7. Enable Supabase RLS on every business table.
8. Keep SQL migrations in version control.
9. Never depend on manual production-only schema changes.
10. Never expose the service-role key to browser code.
11. Preserve historical workflow records.
12. Archive referenced master data instead of deleting it.
13. Keep components small and reusable.
14. Avoid duplicated business logic and giant files.
15. Avoid `any` unless narrowly justified.
16. Implement loading, empty, success, and failure states.
17. Do not treat hidden UI controls as authorization.
18. Implement only the requested phase.

## Product constants

Work categories:

- medical_device
- medical_equipment
- service_contract

Case statuses:

- draft
- active
- on_hold
- completed
- cancelled

Priorities:

- normal
- urgent
- critical

Roles:

- super_admin
- procurement_manager
- procurement_officer
- viewer_auditor

## Ownership

A case has both:

- `case_owner_id`: officer accountable for the overall case
- current responsible user or department: party expected to act now
- historical responsibility intervals: exact periods during which a user or department was responsible within a stage

Never merge these concepts.

## Workflow snapshots

When a case starts, copy the selected published workflow template into case-specific workflow and stage records.

Never make an active case depend directly on mutable template steps.

Published workflow versions are immutable. Create a new version for changes.

## Workflow transitions

Supported actions:

- complete
- return
- reassign
- hold
- resume
- skip
- cancel
- complete case

Require a reason for return, hold, skip, cancel, procurement-type change, and manager override.

Every meaningful action must create an immutable audit event.

Only one case stage may be active at a time.

Completed stage history must not be mutated.

## Stage aging

Use calendar days in the MVP.

Track:

- entered_at
- due_at
- completed_at
- target_days
- overdue_days
- responsible user
- responsible department

## Deletion

Permanently delete only unused records. Archive referenced records.

## Security

- Test RLS behavior, not only application behavior.
- Use server-only environment variables for privileged operations.
- Apply Supabase Storage policies to case documents.
- Normal users must not edit audit events.
- Use server-side authorization checks in addition to RLS where needed.

## Internationalization rules

The codebase must be ready for English and Thai from the beginning.

- Never hardcode user-facing strings in components, server actions, validation errors, notifications, or export builders.
- Keep locale dictionaries under a clear structure such as `messages/en.json` and `messages/th.json`.
- Use stable English machine identifiers in the database and translate display labels separately.
- Use locale-aware date, time, number, and currency formatting.
- Persist user locale preference in the profile, with a pre-authentication fallback.
- All new features must add both English and Thai message keys. Temporary Thai values may be marked for review, but keys must exist.
- Ensure layouts work with longer Thai labels.
- Exports must support English or Thai headings.
- Do not auto-translate user-authored case titles, notes, or comments.

## Reporting and Excel rules

Personnel KPI calculations must use historical responsibility intervals, not only current assignment.

When a user is reassigned during a stage:

1. close the existing responsibility interval
2. preserve its start and end timestamps
3. create a new interval for the new responsible party
4. never overwrite historical attribution

Required personnel-stage metrics:

- unique cases
- interval count
- minimum days
- maximum days
- average days
- median days where practical
- total days

Use decimal calendar days derived from timestamps and preserve raw timestamps. Document rounding.

Required work-status metrics:

- total
- completed
- active/remaining
- on hold
- cancelled
- completion percentage
- overdue remaining

Support grouping by work category, procurement type, budget source, budget category, current stage, department, owner, and fiscal year.

Excel exports must be genuine `.xlsx` workbooks, not CSV files renamed to `.xlsx`. Use a maintained workbook library and generate predictable sheets, types, headers, filters, dates, and numeric cells. Include applied filters and export time. Test that grouped totals reconcile with overall totals.

## UI rules

Use a modern blue-and-white dashboard:

- deep blue sidebar
- white or pale blue-gray content background
- rounded cards
- subtle borders
- minimal shadows
- compact tables
- responsive layout
- full dark/light mode

Navigation:

- Dashboard
- My Work
- All Cases
- Calendar
- Reports
- Settings

Status must always use text or icons in addition to color.

All colors must use shared design tokens. Dark mode must adapt page backgrounds, cards, forms, tables, charts, borders, and text.

## Suggested source layout

```text
src/
  app/
    (auth)/
    (dashboard)/
  components/
    ui/
    layout/
    dashboard/
    cases/
    workflows/
    reports/
    i18n/
  features/
    auth/
    cases/
    workflows/
    documents/
    notifications/
    reports/
    i18n/
  lib/
    supabase/
    validation/
    permissions/
    dates/
    exports/
    i18n/
  server/
    actions/
    queries/
    services/
  types/
supabase/
  migrations/
  seed.sql
tests/
```

Respect an established repository structure if one already exists. Do not reorganize working code unnecessarily.

## Database conventions

- Prefer UUID primary keys.
- Add created and updated timestamps.
- Add created-by fields where accountability matters.
- Use explicit foreign keys.
- Add indexes for common filters and joins.
- Use constrained text or lookup tables for controlled values.
- Do not put the workflow engine into one JSON field.
- JSONB is acceptable only for secondary metadata or justified immutable snapshots.
- Comment complex SQL functions and RLS policies.

## Coding workflow

For every task:

1. Read this file.
2. Inspect the relevant implementation.
3. State important assumptions.
4. Create or update a checklist.
5. Make the smallest coherent change.
6. Add or update tests.
7. Run lint, typecheck, unit tests, and relevant integration tests.
8. Fix failures before reporting completion.
9. Update documentation.
10. Summarize changed files, migrations, security rules, tests, and limitations.

## Required testing areas

- authentication and role permissions
- RLS policies
- case creation validation
- category-detail persistence
- workflow snapshot creation
- transition rules
- only-one-active-stage constraint
- stage aging and overdue calculations
- case owner versus current responsibility
- archive behavior
- CSV export
- Excel workbook export and reconciliation
- locale switching and translated labels
- personnel responsibility interval statistics
- Supabase Storage access

## Forbidden shortcuts

Do not:

- disable RLS to simplify development
- expose service-role credentials to the client
- store all workflow state in one JSON field
- allow arbitrary stage selection
- mutate historical stage records
- hard-delete referenced records
- put all logic in page components
- silently swallow errors
- skip validation
- use fake dashboard numbers after real queries exist
- hardcode English labels directly in components
- calculate historical personnel KPI from only the current assignee
- create fake `.xlsx` files by renaming CSV output
- build inventory, accounting, vendor portal, or PO modules during the MVP

## Phase control

Implement only the phase explicitly requested by the user.

At the end of each phase, report:

- completed features
- migrations
- routes
- components
- tests
- RLS and policies
- known limitations
- recommended next action
