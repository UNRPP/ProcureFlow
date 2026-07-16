-- Phase 5 hardening: targeted indexes and safer schema defaults.

-- Open-work screens sort/filter by target date and current assignment.
create index procurement_cases_open_target_idx
  on public.procurement_cases(target_completion_date, priority)
  where status in ('draft', 'active', 'on_hold');
create index procurement_cases_completed_at_idx
  on public.procurement_cases(completed_at desc)
  where status = 'completed';
create index case_assignments_open_case_idx
  on public.case_assignments(case_id, assigned_at desc)
  where unassigned_at is null;
create index case_assignments_open_user_idx
  on public.case_assignments(assigned_user_id, assigned_at desc)
  where unassigned_at is null and assigned_user_id is not null;

-- Reporting filters responsibility intervals by period and stage key.
create index case_responsibility_intervals_period_idx
  on public.case_responsibility_intervals(started_at, ended_at);
create index case_stage_instances_step_entered_idx
  on public.case_stage_instances(step_key, entered_at)
  where entered_at is not null;

-- Stage-completion checks match a document to a snapshotted requirement.
create index case_documents_requirement_lookup_idx
  on public.case_documents(case_id, stage_instance_id, document_type_id);

-- Prevent future migrations from accidentally exposing function execution or
-- allowing application roles to create objects in the API schema. Every new
-- callable function must receive an explicit grant in its own migration.
revoke create on schema public from public;
revoke all on schema public from anon;
grant usage on schema public to anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

comment on index public.case_responsibility_intervals_period_idx is
  'Supports personnel KPI period overlap filtering; validate with EXPLAIN ANALYZE against production-like volumes.';
comment on index public.case_documents_requirement_lookup_idx is
  'Supports required-document checks during stage completion.';
