# Phase 1 handoff — Core case management

Completed on 2026-07-15.

## Completed features

- Shared procurement case record with separate case owner and current responsible party.
- Server-generated case numbers in PRC-YYYY-000123 format.
- One-to-one medical device, medical equipment, and service contract details.
- Atomic case/detail create and update database functions.
- Bilingual React Hook Form and Zod case forms with category-specific validation.
- Role- and status-aware create/edit controls with matching server checks and RLS.
- Responsive All Cases view using TanStack Table, search, filters, sorting, and pagination.
- Bilingual CSV export and genuine Excel .xlsx export with typed numbers/dates, frozen headers, filters, and export metadata.
- Case detail summary, budget, ownership/responsibility, category details, and marked workflow/timeline/document placeholders.
- Deep-blue desktop/mobile quick actions for all three categories.
- Super-administrator master-data create, archive, and reactivate controls.
- Nine deterministic seed cases covering all categories and statuses.

## Migration

- supabase/migrations/20260715100000_phase1_cases.sql
  - Adds procurement_cases and the three category-detail tables.
  - Adds filter, responsibility, owner, creation-date, and full-text search indexes.
  - Adds category-integrity and active-master-data triggers.
  - Adds atomic create/update RPC functions.
  - Enables RLS and case/detail policies.
  - Expands authenticated profile-name visibility for case ownership displays.

No production-only schema changes are required.

## Routes

- /cases
- /cases/new?category=medical_device
- /cases/new?category=medical_equipment
- /cases/new?category=service_contract
- /cases/[id]
- /cases/[id]/edit
- /api/exports/cases.csv
- /api/exports/cases.xlsx
- /settings

## Main components and services

- src/components/cases/case-form.tsx
- src/components/cases/case-table.tsx
- src/components/cases/case-filters.tsx
- src/components/cases/case-status-badge.tsx
- src/server/actions/cases.ts
- src/server/queries/cases.ts
- src/lib/exports/case-status.ts
- src/server/actions/master-data.ts

## Security and RLS

- Anonymous users receive no case or detail table grants.
- All four application roles may read cases.
- Super administrators may edit all cases.
- Managers may view and edit all case metadata.
- Officers may create cases owned by themselves and edit only open cases they own or are directly responsible for.
- Auditors are read-only.
- Detail-table policies call the parent-case authorization helpers.
- New or changed case references must use active master data.
- Archived master data remains readable for historical cases.
- Case number, work category, creator, and creation timestamp are immutable.
- Category detail tables enforce that their parent has the matching work-category code.

## Tests and verification

- 50 Vitest tests pass across 9 test files.
- Added case validation, permissions, migration, CSV, and Excel tests.
- Added supabase/tests/database/phase1_rls.test.sql.
- Excel tests reopen the generated workbook and verify the XLSX signature, bilingual headings, numeric and date cells, frozen header, and auto-filter.
- A representative workbook was imported, inspected, and rendered with the bundled spreadsheet artifact runtime. Its error scan returned zero matches.
- ESLint, TypeScript, Next.js production build, Prettier, and npm audit pass.

## Known limitations and manual work

1. Docker Desktop is not installed/running in this environment, so the Supabase local stack and pgTAP RLS tests could not be executed here.
2. Run npm run supabase:start and npm run db:reset after Docker is available. This applies both migrations and loads all demo accounts/cases.
3. Run npm run test:db and npm run db:lint against the local stack.
4. Hosted Supabase linking, production secrets, and a Git remote still require the project-owner values listed in docs/MANUAL_SETUP.md.
5. Phase 1 creates draft cases. Starting a case and generating workflow stages belongs to Phase 2.
6. Phase 1 exports are capped at 5,000 cases. Phase 3 adds management report workbooks and larger server-side reporting aggregates.

## Recommended next action

Start Phase 2 only after the migration and pgTAP suite pass against a running local Supabase instance. Phase 2 adds versioned workflow templates, immutable case snapshots, transactional transitions, responsibility intervals, and audit history.
