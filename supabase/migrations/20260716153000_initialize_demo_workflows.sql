-- Upgrade legacy DEMO cases to real workflow snapshots. It is safe to rerun:
-- cases that already have a workflow are never changed.
create or replace function public.initialize_demo_workflows()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  template_id uuid;
  demo_case_id uuid;
  demo_case_number text;
  initialized_count integer := 0;
  index_number integer;
begin
  if actor_id is null or not public.has_any_role(array['super_admin']) then
    raise exception 'Demo data administration is not authorized' using errcode = '42501';
  end if;
  select id into template_id from public.workflow_templates
  where code = 'demo_standard' and version = 1 and status = 'published';
  if template_id is null then
    raise exception 'Demo workflow template is unavailable' using errcode = 'P0002';
  end if;

  foreach demo_case_number in array array[
    'DEMO-2026-0001', 'DEMO-2026-0002', 'DEMO-2026-0004',
    'DEMO-2026-0005', 'DEMO-2026-0006', 'DEMO-2026-0007', 'DEMO-2026-0008'
  ] loop
    select id into demo_case_id from public.procurement_cases where procurement_cases.case_number = demo_case_number;
    if demo_case_id is null or exists (select 1 from public.case_workflows where case_workflows.case_id = demo_case_id) then
      continue;
    end if;
    update public.procurement_cases
    set status = 'draft', current_responsible_user_id = null, current_responsible_department_id = null,
        hold_reason = null, cancellation_reason = null, completed_at = null
    where id = demo_case_id;
    perform public.start_case_workflow(demo_case_id, template_id);
    initialized_count := initialized_count + 1;

    if demo_case_number = 'DEMO-2026-0002' then
      perform public.transition_case_workflow(demo_case_id, 'complete');
    elsif demo_case_number = 'DEMO-2026-0004' then
      perform public.transition_case_workflow(demo_case_id, 'hold', 'Awaiting revised technical specification.');
    elsif demo_case_number = 'DEMO-2026-0005' then
      for index_number in 1..3 loop
        perform public.transition_case_workflow(demo_case_id, 'complete');
      end loop;
    elsif demo_case_number = 'DEMO-2026-0006' then
      perform public.transition_case_workflow(demo_case_id, 'cancel', 'Budget reallocated to an urgent requirement.');
    elsif demo_case_number = 'DEMO-2026-0007' then
      for index_number in 1..2 loop
        perform public.transition_case_workflow(demo_case_id, 'complete');
      end loop;
    end if;
  end loop;
  return initialized_count;
end;
$$;

revoke all on function public.initialize_demo_workflows() from public;
grant execute on function public.initialize_demo_workflows() to authenticated;
comment on function public.initialize_demo_workflows() is 'Initializes real workflow stages for legacy DEMO cases that do not yet have a workflow.';
