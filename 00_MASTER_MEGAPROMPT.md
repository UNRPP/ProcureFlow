# MASTER MEGAPROMPT — PROCUREMENT WORK MANAGEMENT PLATFORM

You are the lead software architect and implementation agent for a hospital procurement work management platform.

Build a simple, reliable, auditable, modern web application using Supabase as the backend. The system tracks procurement cases from intake to completion and must remain practical for daily use by procurement officers and managers.

## Product objectives

The application must answer:

1. How many procurement cases are active?
2. Which budget category and source does each case use?
3. Which procurement method is used for each case?
4. Which workflow stage is each case in?
5. Who or which department is currently responsible?
6. How many days has each case stayed in its current stage?
7. Which cases are overdue or due soon?
8. What is the workload of each procurement officer?
9. Which stages and departments are bottlenecks?
10. What is the estimated and final value of active and completed work?
11. For each personnel, how many cases are they accountable for or actively responsible for?
12. For each personnel and workflow stage, what are the minimum, maximum, average, and total days spent?
13. How many cases are completed, active, on hold, cancelled, and remaining, grouped by work category, procurement type, budget source, budget category, and workflow stage?

## Work categories

Support three categories using one shared case system:

- Medical devices
- Medical equipment
- Contracts for services

Do not create three separate applications.

## Required stack

- Next.js with App Router
- TypeScript with strict mode
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Row Level Security
- React Hook Form
- Zod
- TanStack Table
- Recharts
- date-fns
- Lucide icons
- Vercel

Use Supabase migrations committed to the repository. Never rely on manual production-only schema changes.

## Internationalization and language readiness

The application will initially support English, but its architecture must be ready for Thai from Phase 0.

Requirements:

- Use locale-aware routing or an equivalent centralized internationalization architecture.
- Supported locale codes must begin with `en` and `th`, even if Thai translation coverage is incomplete at first.
- Never hardcode user-facing labels, menu text, button text, status text, validation messages, notifications, report headings, or export column headings inside components.
- Store UI messages in locale dictionaries such as `messages/en.json` and `messages/th.json`, organized by feature namespace.
- Provide a language switcher in the application header or user menu.
- Persist the selected locale in the user profile when signed in, with cookie or local fallback before authentication.
- Use locale-aware date, time, number, and currency formatting through `Intl` or a well-maintained i18n library.
- Thai dates must display correctly; do not manually translate month names throughout the codebase.
- Keep database identifiers and stable machine values in English. Translate only display labels.
- Master data that administrators create may require both `name_en` and `name_th`, or a translation table when the data is shown to end users.
- Case titles, notes, comments, and uploaded filenames remain user-entered content and must not be automatically translated.
- CSV and Excel exports must allow English or Thai column headings based on the selected export language.
- Design layouts must tolerate Thai text expansion without truncation or broken controls.
- Language selection and theme selection are independent settings.

## UI direction

Create a modern blue-and-white SaaS dashboard inspired by the approved design:

- Deep blue left sidebar
- White or pale blue-gray content background
- Rounded cards
- Subtle borders and minimal shadows
- Clear KPI cards
- Compact readable tables
- Modern charts
- Responsive desktop and mobile layout
- Dark/light mode toggle
- All text, backgrounds, cards, tables, forms, charts, borders, hover states, and disabled states must adapt to theme
- Never rely on color alone to communicate status; pair colors with text or icons
- Avoid decorative clutter and excessive animation

Main navigation:

- Dashboard
- My Work
- All Cases
- Calendar
- Reports
- Settings

Quick actions:

- New Medical Device Case
- New Medical Equipment Case
- New Service Contract Case

## Core case model

Every procurement case should contain:

- case number
- title
- description
- work category
- requesting department
- fiscal year
- budget category
- budget source
- estimated value
- final value
- procurement type
- priority
- case owner
- current responsible user
- current responsible department
- target completion date
- current stage instance
- status
- hold reason
- cancellation reason
- completed timestamp
- created by
- created and updated timestamps

Statuses:

- draft
- active
- on_hold
- completed
- cancelled

Priorities:

- normal
- urgent
- critical

## Category-specific data

Use one-to-one detail tables.

### Medical devices

- item name
- quantity
- unit
- estimated unit price
- intended use
- device classification
- reusable or consumable

### Medical equipment

- equipment name
- quantity
- new purchase or replacement
- installation location
- replaced asset reference
- expected installation date
- warranty requirement
- maintenance requirement

### Service contracts

- scope of service
- contract start date
- contract end date
- recurring or one-time
- existing contract number
- current provider
- renewal notification date

## Ownership rule

Keep these separate:

- Case owner: procurement officer accountable for the entire case
- Current responsible party: user or department expected to act now

Do not merge these concepts.

## Configurable workflow rules

Administrators can create, edit drafts, duplicate, version, publish, archive, and reorder procurement workflow templates.

Each procurement type has a workflow template. Each step includes:

- step name
- description
- sequence
- default responsible role or department
- target duration in calendar days
- required-document behavior
- whether skipping is allowed
- active status

When a case starts, copy the published workflow template and its steps into immutable case-specific workflow and stage records.

Changes to a workflow template affect only future cases. Existing cases preserve the original snapshot.

Supported actions:

- start workflow
- complete current stage
- return to previous stage
- reassign
- put on hold
- resume
- skip with reason
- cancel case
- complete case

Require a reason for return, hold, skip, cancel, procurement type change, and administrative override.

Every meaningful action creates an immutable audit event.

Only one stage may be active at a time. Users must not freely select any stage from a dropdown.

## Responsibility history and KPI attribution

Current responsibility alone is insufficient for KPI reporting. Preserve responsibility history for every stage interval.

Each continuous period of responsibility should record:

- case ID
- stage instance ID
- responsible user, when applicable
- responsible department, when applicable
- responsibility start timestamp
- responsibility end timestamp
- elapsed calendar days or hours derived from timestamps
- assignment reason or transition source
- whether responsibility was direct, delegated, returned, or reassigned

When responsibility changes inside the same stage, close the previous responsibility interval and create a new interval. Never overwrite the previous assignee.

KPI reports must distinguish:

- cases owned by personnel
- cases currently requiring their action
- unique cases they handled during the selected period
- completed cases they handled
- overdue cases currently assigned
- time spent per stage while they were responsible

For each personnel and stage, calculate:

- number of stage intervals
- number of unique cases
- minimum days
- maximum days
- average days
- median days when practical
- total days

Define and document whether elapsed time uses inclusive/exclusive boundaries and how partial days are rounded. For the MVP, preserve timestamps and report decimal calendar days to two decimal places; optionally show rounded whole days in the UI.

## Stage aging

Track:

- entered timestamp
- due timestamp
- completed timestamp
- elapsed calendar days
- target days
- overdue days
- responsible user
- responsible department

Use calendar days in the MVP. Do not add holiday calendars yet.

## Master-data deletion

Permanently delete a record only when it has never been referenced. Otherwise archive or deactivate it while preserving historical display.

## Roles

- super_admin
- procurement_manager
- procurement_officer
- viewer_auditor

### super_admin

Manage users, departments, master data, workflows, settings, and all cases.

### procurement_manager

View all cases, create and edit cases, reassign work, perform documented overrides, view reports, and export data.

### procurement_officer

Create cases, manage cases they own or are assigned to, perform permitted transitions, upload documents, and comment.

### viewer_auditor

Read-only access to cases, history, reports, and permitted exports.

Implement authorization using Supabase Row Level Security. Hidden buttons are not security.

## Required screens

### Dashboard

Show:

- active cases
- overdue cases
- due within seven days
- unassigned cases
- completed this month
- active estimated value
- cases by work category
- cases by procurement type
- cases by current stage
- overdue case table
- workload by officer
- created-versus-completed trend
- bottleneck stages
- cases by budget category
- completed versus remaining cases
- completion status grouped by budget source and procurement type

### My Work

Group cases into:

- overdue
- due soon
- waiting for my action
- recently assigned
- waiting on another department
- on hold

Sort by overdue, critical, urgent, due soon, then oldest stage.

### All Cases

Provide search, filters, sorting, pagination, row navigation, CSV export, and Excel `.xlsx` export.

Filters:

- status
- work category
- budget category
- procurement type
- stage
- officer
- responsible department
- fiscal year
- priority
- overdue
- date range
- export language

### Case details

Show:

- summary
- category-specific information
- workflow stepper
- current stage and aging
- current responsibility
- action buttons
- required document checklist
- attachments
- comments
- activity timeline
- audit trail

### Reports and exports

Provide two primary report families.

#### Personnel workload and KPI report

Answer, for each personnel:

- active cases owned
- cases currently requiring action
- unique cases handled in the period
- completed cases handled in the period
- overdue cases currently assigned
- count of responsibility intervals
- time spent in each workflow stage
- minimum, maximum, average, median where practical, and total days per stage

Support drilldown from personnel to stage and from stage to individual cases.

Filters:

- reporting date range
- fiscal year
- personnel
- department
- work category
- procurement type
- budget source
- budget category
- stage
- case status

Export to Excel `.xlsx` with:

- a Summary sheet
- a Personnel KPI sheet
- a Stage Statistics sheet
- an optional Case Detail sheet
- filter criteria and export timestamp
- English or Thai headings
- stable machine-readable raw values where useful

#### Work status report

Answer:

- total cases
- completed cases
- active or remaining cases
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
- owner
- fiscal year

Export to Excel `.xlsx` with Summary, Grouped Status, and Case Detail sheets. Totals in grouped sections must reconcile with the filtered overall total.

CSV may remain available for simple flat exports, but KPI and grouped status reports must support real Excel workbooks.

### Settings

Manage:

- departments
- users and roles
- budget categories
- budget sources
- fiscal years
- procurement types
- workflow templates
- workflow steps
- document types

## Architecture rules

- Use a modular monolith
- Do not introduce microservices
- Prefer Server Components for read-heavy screens
- Use Client Components only where interaction is necessary
- Keep business logic outside presentational components
- Use Zod validation and database constraints
- Enable RLS on every business table
- Do not expose the Supabase service role key to the browser
- Use explicit types; avoid `any`
- Avoid giant page components
- Avoid duplicated business logic
- Do not scatter direct database calls throughout UI components
- Use consistent server actions, query modules, or service modules
- Add indexes for frequent filters and joins
- Use relational tables for core data, not one large JSON field
- Add loading, empty, error, and success states
- Preserve historical and audit data
- Centralize all user-facing text for English/Thai localization
- Generate `.xlsx` files server-side or in a controlled export module; do not fake Excel by renaming CSV files
- Make reporting formulas deterministic, documented, and covered by tests

## Features intentionally excluded from MVP

Do not build these unless explicitly requested later:

- vendor portal
- inventory integration
- accounting integration
- PR or PO generation
- electronic signatures
- complex parallel BPMN workflows
- supplier quotation portal
- native mobile app
- AI recommendations
- automatic translation of free-text case content

## Delivery process

Read `AGENTS.md` before every implementation task. Use `PHASES.md` and implement only the currently requested phase.

Before coding:

1. Inspect the repository.
2. Summarize current architecture.
3. Identify files and migrations that will change.
4. Create a checklist.
5. Make the smallest coherent implementation.
6. Run lint, typecheck, and relevant tests.
7. Fix failures before proceeding.
8. Update documentation.
9. Commit with a clear message.

Do not rewrite the whole project to solve a local problem. Do not delete working code without justification. Do not introduce a major dependency without explaining why.

## Definition of done

A phase is complete only when:

- acceptance criteria pass
- migrations are committed
- RLS policies are tested
- sample data exists
- lint passes
- typecheck passes
- tests pass
- navigation works
- loading and error states exist
- responsive behavior is acceptable
- documentation is updated

At the end of each phase report:

- completed features
- schema changes
- routes created
- components created
- RLS and security rules
- tests added
- known limitations
- recommended next step

Begin with Phase 0 only.
