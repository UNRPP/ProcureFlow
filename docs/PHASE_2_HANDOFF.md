# Phase 2 handoff — Configurable workflow engine

Implemented on 2026-07-15. Live database acceptance is intentionally deferred
until Supabase is connected, as approved by the project owner.

## Completed features

- Draft, published, and archived workflow template versions.
- Draft step creation, editing, ordering, removal, publication, duplication, and archival.
- Immutable published versions and immutable case-specific snapshots.
- Transactional start, complete, return, reassign, hold, resume, skip, cancel, and complete-case functions.
- Required transition reasons enforced in application validation and Postgres.
- New stage iterations on return; completed stage records are never reopened.
- Only one active stage per case through a partial unique index.
- Historical assignment and responsibility intervals with exact timestamps.
- Responsibility intervals close and reopen on reassignment.
- Immutable transition and activity event history.
- Case workflow stepper, current-stage aging, responsibility, actions, and activity timeline.
- Four seeded published workflows and workflow histories for seeded non-draft cases.
- English and Thai workflow administration and case-operation labels.

## Migration

- supabase/migrations/20260715120000_phase2_workflows.sql
- Adds all eight Phase 2 workflow, stage, event, assignment, and interval tables.
- Adds current_stage_instance_id to procurement_cases.
- Adds indexes for active-stage uniqueness, due dates, event history, and KPI attribution.
- Adds narrowly granted database functions for all workflow mutations.

## Routes and components

- /settings/workflows
- /settings/workflows/[id]
- Workflow administration components under src/components/workflows.
- Workflow query and action modules under src/server.
- Case workflow UI is integrated into /cases/[id].

## Tests

- 75 Vitest tests pass across 11 files.
- Added workflow rule and Phase 2 migration tests.
- Added supabase/tests/database/phase2_workflows.test.sql for snapshot,
  immutability, reason, one-active-stage, transition, and interval behavior.
- ESLint, TypeScript, and the production build pass.

## RLS and security

- Anonymous grants are revoked from every workflow table.
- Authenticated users receive read access only to case workflow history allowed by the parent case.
- Direct workflow-history writes are not granted.
- Workflow mutations execute through security-definer functions that repeat case authorization.
- Only super administrators can mutate draft templates.
- Normal users cannot edit audit events or closed responsibility intervals.

## Deferred database acceptance

The migration, pgTAP tests, functions, constraints, triggers, RLS policies, and
seed statements are committed but have not been executed against Postgres in
this environment. After connecting Supabase, run:

1. npm run db:reset
2. npm run db:lint
3. npm run test:db
4. Exercise start, return, reassignment, hold/resume, skip, cancel, and final completion with each role.

Any SQL or generated-type issue discovered by those checks must be resolved
before production deployment.

## Recommended next action

Proceed to Phase 3 implementation with database execution still explicitly
deferred.
