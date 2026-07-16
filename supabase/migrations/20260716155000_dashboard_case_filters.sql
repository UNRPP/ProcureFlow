-- Returns cases behind each dashboard KPI using the same rules as dashboard_report().
create or replace function public.dashboard_case_ids(filter_key text)
returns table (case_id uuid)
language sql
stable
set search_path = ''
as $$
  select pc.id
  from public.procurement_cases pc
  left join public.case_stage_instances stage on stage.id = pc.current_stage_instance_id
  where case filter_key
    when 'active' then pc.status = 'active'
    when 'overdue' then pc.status in ('active', 'on_hold')
      and coalesce(stage.due_at, pc.target_completion_date::timestamptz) < now()
    when 'due_soon' then pc.status in ('active', 'on_hold')
      and coalesce(stage.due_at, pc.target_completion_date::timestamptz)
        between now() and now() + interval '7 days'
    when 'unassigned' then pc.status in ('active', 'on_hold')
      and pc.current_responsible_user_id is null
      and pc.current_responsible_department_id is null
    when 'completed_month' then pc.status = 'completed'
      and pc.completed_at >= date_trunc('month', now())
    when 'active_value' then pc.status = 'active'
    else false
  end;
$$;

revoke all on function public.dashboard_case_ids(text) from public;
grant execute on function public.dashboard_case_ids(text) to authenticated;
comment on function public.dashboard_case_ids(text) is
  'Returns the RLS-visible case IDs represented by a dashboard KPI.';
