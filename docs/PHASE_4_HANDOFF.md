# Phase 4 handoff — collaboration and reminders

Phase 4 is complete at the repository level. Applying and behaviorally testing the Supabase migration is intentionally deferred until a local or hosted database is connected.

## Completed features

- Private, versioned case documents with a 25 MB limit and an allowlist for PDF, DOCX, XLSX, JPEG, and PNG files.
- Configurable document types and draft workflow-step document requirements.
- Immutable case-stage requirement snapshots and blocking checks before a stage can be completed.
- Immutable case comments included in the combined case activity timeline.
- In-app notifications for workflow assignment, return, hold, due-soon, overdue, and service-contract renewal events.
- Per-user notification preferences and read/read-all actions.
- Service-contract renewal items in the calendar.
- Daily Vercel cron configuration for generating time-based notifications.
- Bilingual English/Thai labels, validation messages, empty states, and status text for all Phase 4 UI.

## Migration and seed data

- `supabase/migrations/20260715170000_phase4_collaboration.sql`
  - Adds document types, workflow and case-stage requirements, case documents and immutable versions, comments, notifications, and preferences.
  - Creates the private `case-documents` Storage bucket and object policies.
  - Adds requirement snapshotting, required-document enforcement, document registration, comment creation, notification generation, and notification trigger functions.
- `supabase/seed.sql`
  - Adds six document types, workflow requirements, stage requirement snapshots, notification preferences, comments, audit events, and reminder fixtures.
  - Deliberately does not fabricate Storage objects or document metadata; upload fixtures must be created through the application after Supabase is running.

## Routes

- `/cases/[id]` — documents, versions, comments, and combined activity.
- `/calendar` — case targets, stage due dates, and service-contract renewals.
- `/settings/workflows/[id]` — draft workflow document requirements.
- `/settings/master-data` — document-type archive/reactivate management.
- `/api/documents/[versionId]` — authorized, short-lived signed download.
- `/api/cron/notifications` — server-secret-protected reminder generation.

## Components and services

- `src/components/documents/document-panel.tsx`
- `src/components/comments/case-comments.tsx`
- `src/components/layout/notification-menu.tsx`
- `src/server/actions/collaboration.ts`
- `src/server/queries/collaboration.ts`
- `src/features/documents/validation.ts`
- `src/lib/supabase/admin.ts`

## Security, RLS, and Storage

- RLS is enabled on every Phase 4 business table.
- Case view/edit permissions gate document metadata, comments, and downloads.
- Storage reads and uploads use the case UUID in the first object-path segment and re-check case authorization.
- Object updates are not allowed, preserving every uploaded version. Only unregistered orphan cleanup is allowed.
- Normal users cannot directly create or mutate document-version history, activity events, requirement snapshots, or generated notification history.
- Privileged credentials are read only from the server environment; no service-role value is referenced by Client Components.

## Verification

- ESLint: passed.
- Strict TypeScript: passed.
- Vitest: 113 tests passed across 16 files.
- Phase 4 static migration tests cover RLS declarations, immutable records, document requirement snapshotting, completion blocking, Storage policies, and server-only scheduling.
- `supabase/tests/database/phase4_collaboration.test.sql` covers behavioral permissions and invariants once the database is available.

## Known limitations and deferred acceptance

- The migration, bucket policies, signed downloads, and scheduled function were not executed against Supabase because database connection was explicitly deferred.
- Email and push delivery are out of the MVP; notifications are in-app only.
- Virus/malware scanning and document content inspection require an approved hospital security service before production.
- The Vercel cron calls the route daily; exact notification delivery timing depends on the hosting plan and scheduler.
- Seeded document requirements can be tested after reset, but a real file must be uploaded through the UI before completing a blocking stage.

## Recommended next action

Proceed to Phase 5 hardening and deployment readiness, then run the consolidated deferred database acceptance checklist against a local Supabase stack and a non-production hosted project.
