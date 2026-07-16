# PHASED IMPLEMENTATION PROMPTS

Execute one phase at a time. Do not begin the next phase until the current acceptance criteria pass.

---

# Phase 0 — Foundation

## Goal

Create a secure and maintainable base. Do not build the complete case workflow yet.

## Tasks

1. Create a Next.js App Router project with TypeScript strict mode.
2. Configure Tailwind CSS, shadcn/ui, ESLint, Prettier, and environment validation.
3. Configure Supabase browser and server clients.
4. Implement sign-in, sign-out, protected routes, profile loading, and authentication errors.
5. Create initial tables:
   - profiles
   - roles
   - user_roles
   - departments
   - work_categories
   - budget_categories
   - budget_sources
   - procurement_types
   - fiscal_years
6. Seed the three work categories and useful demo master data.
7. Enable RLS on every table and add initial policies.
8. Create the responsive application shell:
   - sidebar
   - top header
   - search placeholder
   - notification placeholder
   - theme toggle
   - user menu
   - mobile navigation
9. Add routes:
   - `/dashboard`
   - `/my-work`
   - `/cases`
   - `/calendar`
   - `/reports`
   - `/settings`
10. Build shared light/dark design tokens for page, cards, text, borders, tables, forms, and statuses.
11. Add internationalization foundation:

- locale-aware architecture
- English and Thai locale dictionaries
- language switcher
- persisted locale preference
- locale-aware date, number, and currency utilities
- translated navigation, authentication, common buttons, validation shell, and empty states

12. Ensure database master-data design can expose English and Thai display names without changing stable IDs.

## Acceptance criteria

- User can sign in and sign out.
- Unauthenticated users cannot access protected pages.
- Dark/light mode works across the complete shell.
- English/Thai language switching works across the shell and persists.
- No user-facing shell string is hardcoded in a component.
- Dates, numbers, and currencies use locale-aware utilities.
- Master data loads from Supabase.
- RLS is enabled and verified.
- Seed process is documented.
- No service-role key appears in client code.
- Lint, typecheck, and tests pass.

---

# Phase 1 — Core Case Management

## Goal

Allow authorized users to create, edit, view, search, filter, and export procurement cases.

## Database

Create:

- procurement_cases
- medical_device_case_details
- medical_equipment_case_details
- service_contract_case_details

Add indexes for case number, status, category, procurement type, fiscal year, owner, current responsible party, and creation date.

Generate unique case numbers server-side, such as `PRC-2026-000123`.

## Features

1. Quick actions for each of the three case categories.
2. Shared base form plus category-specific sections.
3. React Hook Form and Zod validation.
4. Edit cases according to role and status.
5. All Cases table with:
   - search
   - filters
   - sorting
   - pagination
   - responsive view
   - CSV export
   - Excel `.xlsx` case-status export foundation
6. Case details showing:
   - summary
   - budget data
   - category details
   - owner
   - current responsible party
   - target date
   - status
   - placeholder workflow, timeline, and documents sections
7. Settings management for departments, budget data, procurement types, and fiscal years.
8. Archive and reactivate referenced master data rather than deleting it.
9. Add English and Thai display values for administrator-managed master data where appropriate.
10. Make forms, validation messages, table headings, filters, statuses, and export headings bilingual.

## Permissions

- super_admin: all access
- procurement_manager: view and edit all cases
- procurement_officer: create and edit owned or assigned cases
- viewer_auditor: read-only

Enforce with RLS and server-side authorization.

## Acceptance criteria

- Each category saves to the correct detail table.
- Validation blocks incomplete or invalid submissions.
- Unauthorized users cannot edit cases.
- Search, filters, pagination, CSV export, and `.xlsx` export work.
- Export language can be English or Thai.
- Master-data labels display in the selected language with a documented fallback.
- Archived master data is unavailable for new cases but remains visible in history.
- Lint, typecheck, and tests pass.

---

# Phase 2 — Configurable Workflow Engine

## Goal

Implement configurable procurement workflows with immutable case snapshots and auditable transitions.

## Database

Create:

- workflow_templates
- workflow_template_steps
- case_workflows
- case_stage_instances
- workflow_transition_events
- case_assignments
- case_responsibility_intervals
- case_activity_events

Workflow templates should support draft, published, and archived states and explicit versions.

Case stage statuses:

- pending
- active
- completed
- returned
- skipped
- cancelled

## Features

1. Workflow configuration screen.
2. Create draft templates.
3. Add, edit, reorder, and remove draft steps.
4. Publish immutable template versions.
5. Duplicate a template to create a new version.
6. Archive old versions.
7. When a case activates:
   - select the published workflow for its procurement type
   - copy all steps into case stage instances
   - activate the first stage
   - calculate due date
   - assign default responsibility
   - create an audit event
8. Implement transitions:
   - complete current stage
   - return to previous stage
   - reassign
   - hold
   - resume
   - skip with reason
   - cancel
   - complete case
9. Make transitions transactional.
10. On every stage activation or reassignment, create or close immutable responsibility intervals.
11. Preserve separate intervals when multiple personnel are responsible during the same stage.
12. Store timestamps precisely enough to calculate decimal calendar days for KPI reports.
13. Build case workflow stepper, current-stage card, action dialogs, and activity timeline.

## Rules

- Only one stage may be active.
- Completed stage records are immutable.
- Active cases are unaffected by template changes.
- Required reasons are enforced.
- Every transition creates an audit event.
- Every responsibility change closes the previous interval and opens a new interval.
- Historical assignment intervals cannot be overwritten.
- RLS and server checks prevent unauthorized actions.

## Acceptance criteria

- Workflow snapshots are created correctly.
- Published templates cannot be edited in place.
- Invalid transitions fail safely.
- Only one active stage exists per case.
- Return, hold, skip, cancel, and override reasons are required.
- Timeline and audit history reflect every action.
- Responsibility interval history accurately reflects reassignment within the same stage.
- Test fixtures verify KPI attribution across multiple assignees and returned stages.
- Lint, typecheck, RLS tests, and transition tests pass.

---

# Phase 3 — Dashboard, Workload, Aging, and Reports

## Goal

Build the approved management dashboard using real Supabase data.

## Dashboard KPIs

- active cases
- overdue cases
- due within seven days
- unassigned cases
- completed this month
- total active estimated value

## Charts

- cases by work category
- cases by procurement type
- cases by current stage
- cases by budget category
- cases created versus completed over time
- top bottleneck stages

## Tables

### Overdue cases

- case number
- title
- category
- current stage
- responsible party
- days in stage
- overdue days

### Workload by officer

- officer
- owned active cases
- action required
- overdue
- due soon

## My Work

Group into:

- overdue
- due soon
- waiting for my action
- recently assigned
- waiting on another department
- on hold

## Reports

### Personnel workload and KPI report

For each personnel show:

- active cases owned
- cases currently requiring action
- unique cases handled in the selected period
- completed cases handled in the selected period
- overdue cases currently assigned
- responsibility interval count

For every personnel and workflow stage calculate:

- unique case count
- interval count
- minimum calendar days
- maximum calendar days
- average calendar days
- median calendar days where practical
- total calendar days

The calculations must use `case_responsibility_intervals`, including reassignments within a stage. Do not attribute the entire stage to the final assignee.

Allow drilldown from personnel to stage and case-level intervals.

### Work status report

Show:

- total cases
- completed cases
- active/remaining cases
- on-hold cases
- cancelled cases
- completion percentage
- overdue remaining cases

Allow grouping and sorting by:

- work category
- procurement type
- budget source
- budget category
- current workflow stage
- responsible department
- case owner
- fiscal year

### Additional reports

- stage aging
- bottlenecks
- responsibility by department
- budget category
- procurement type

Common filters:

- fiscal year
- reporting date range
- category
- procurement type
- budget source
- budget category
- current stage
- department
- officer
- status
- priority
- export language

### Excel exports

Generate genuine `.xlsx` workbooks.

Personnel workload workbook:

- Summary
- Personnel KPI
- Stage Statistics
- Case Detail

Work status workbook:

- Summary
- Grouped Status
- Case Detail

Include filter criteria, report period, export timestamp, and English or Thai headings. Numeric values must be numeric cells and dates must be actual date cells. Group totals must reconcile with filtered totals.

Use server-side aggregation, SQL views, materialized views only when justified, or RPC functions where appropriate. Do not load every case into the browser for calculation.

## Acceptance criteria

- All dashboard values come from Supabase.
- Filters update KPIs, charts, and tables consistently.
- Workload separates ownership from current action responsibility.
- Overdue calculations match stage due dates.
- Reports export current filtered results to valid `.xlsx` workbooks.
- Personnel min/max/average/median/total stage duration matches responsibility interval test data.
- Work-status totals reconcile across all groupings.
- Exports support English and Thai headings.
- Dashboard is responsive and includes meaningful empty states.
- Query performance is acceptable.
- Lint, typecheck, and tests pass.

---

# Phase 4 — Documents, Checklists, Comments, and Notifications

## Goal

Add operational collaboration and document tracking.

## Database and storage

Create:

- document_types
- workflow_step_document_requirements
- case_documents
- case_document_versions
- case_comments
- notifications
- notification_preferences

Use Supabase Storage for files and Postgres for metadata.

Track document case, stage, type, filename, storage path, uploader, timestamp, version, replacement relation, and description.

Never overwrite a document version in place.

## Features

1. Required-document checklist per workflow step.
2. Uploaded, missing, and complete states.
3. Optional prevention of stage completion when required documents are missing.
4. Secure upload, download, and file-version history.
5. Simple timestamped case comments.
6. In-app notifications for:
   - assignment
   - responsibility change
   - returned case
   - due soon
   - overdue
   - hold
   - service-contract renewal
7. Mark notifications as read.
8. Service contract expiration and renewal views.
9. Scheduled job for reminder generation.

## Acceptance criteria

- Authorized users can access permitted files.
- Unauthorized users cannot access Storage objects.
- Required-document status is correct.
- File versions are preserved.
- Comments appear in the activity timeline.
- Notifications can be marked read.
- Contract renewal reminders work.
- RLS and Storage policies are tested.
- Lint, typecheck, and tests pass.

---

# Phase 5 — Hardening and Deployment

## Goal

Prepare the application for production use.

## Security

- Verify RLS on every business table.
- Verify role behavior.
- Verify Storage policies.
- Confirm service-role credentials are server-only.
- Confirm audit records are immutable to normal users.
- Confirm completed stage history cannot be edited.

## Testing

Add unit, integration, RLS, workflow, validation, localization, Excel export, reconciliation, Storage, and smoke tests.

Add end-to-end tests for:

- sign in
- create case
- activate workflow
- complete stage
- return stage
- upload document
- view dashboard
- export personnel KPI workbook
- export grouped work-status workbook
- switch English/Thai language and verify persisted locale

## Performance

- inspect query plans
- add missing indexes
- remove N+1 queries
- paginate large lists
- reduce client bundle size
- lazy-load heavy charts where appropriate

## Accessibility

Review keyboard navigation, focus, contrast, labels, validation errors, dialogs, tables, and screen-reader status labels.

## Reliability and operations

Add:

- error boundaries
- route error states
- application logging
- monitoring
- backup guide
- restore guide
- migration guide
- rollback or recovery plan

## Deployment

Prepare Vercel, production Supabase, environment variables, migration deployment, production seed data, domain, and HTTPS.

## Documentation

Create:

- README
- local setup guide
- environment-variable guide
- migration guide
- deployment guide
- role/permission matrix
- workflow administration guide
- user acceptance test checklist

## Acceptance criteria

- Production build succeeds.
- All tests pass.
- No known critical RLS bypass exists.
- No critical accessibility failure remains.
- Migrations deploy cleanly.
- Backup and recovery are documented.
- Major workflows pass user acceptance testing.
- Thai and English UI smoke tests pass.
- Generated Excel files open correctly and contain reconciled totals and expected personnel-stage statistics.
