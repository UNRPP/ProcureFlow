-- Phase 3: read-only management aggregates and auditable personnel KPI metrics.

create or replace function public.dashboard_report()
returns jsonb
language sql
stable
set search_path = ''
as $$
with visible_cases as (
  select
    pc.*,
    wc.code category_code, wc.name_en category_name_en, wc.name_th category_name_th,
    pt.code procurement_code, pt.name_en procurement_name_en, pt.name_th procurement_name_th,
    bc.code budget_code, bc.name_en budget_name_en, bc.name_th budget_name_th,
    stage.step_key stage_code, stage.name_en stage_name_en, stage.name_th stage_name_th,
    stage.entered_at stage_entered_at, stage.due_at stage_due_at
  from public.procurement_cases pc
  join public.work_categories wc on wc.id = pc.work_category_id
  join public.procurement_types pt on pt.id = pc.procurement_type_id
  join public.budget_categories bc on bc.id = pc.budget_category_id
  left join public.case_stage_instances stage on stage.id = pc.current_stage_instance_id
),
summary as (
  select jsonb_build_object(
    'active_cases', count(*) filter (where status = 'active'),
    'overdue_cases', count(*) filter (
      where status in ('active', 'on_hold')
        and coalesce(stage_due_at, target_completion_date::timestamptz) < now()
    ),
    'due_soon', count(*) filter (
      where status in ('active', 'on_hold')
        and coalesce(stage_due_at, target_completion_date::timestamptz)
          between now() and now() + interval '7 days'
    ),
    'unassigned_cases', count(*) filter (
      where status in ('active', 'on_hold')
        and current_responsible_user_id is null
        and current_responsible_department_id is null
    ),
    'completed_this_month', count(*) filter (
      where status = 'completed'
        and completed_at >= date_trunc('month', now())
    ),
    'active_estimated_value', coalesce(sum(estimated_value) filter (where status = 'active'), 0)
  ) value
  from visible_cases
),
category_breakdown as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', category_code, 'name_en', category_name_en, 'name_th', category_name_th,
    'total', total
  ) order by total desc), '[]'::jsonb) value
  from (
    select category_code, category_name_en, category_name_th, count(*) total
    from visible_cases
    group by category_code, category_name_en, category_name_th
  ) grouped
),
procurement_breakdown as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', procurement_code, 'name_en', procurement_name_en, 'name_th', procurement_name_th,
    'total', total
  ) order by total desc), '[]'::jsonb) value
  from (
    select procurement_code, procurement_name_en, procurement_name_th, count(*) total
    from visible_cases
    group by procurement_code, procurement_name_en, procurement_name_th
  ) grouped
),
stage_breakdown as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', stage_code, 'name_en', stage_name_en, 'name_th', stage_name_th,
    'total', total
  ) order by sequence), '[]'::jsonb) value
  from (
    select
      coalesce(stage_code, 'no_active_stage') stage_code,
      coalesce(stage_name_en, 'No active stage') stage_name_en,
      coalesce(stage_name_th, 'ไม่มีขั้นตอนปัจจุบัน') stage_name_th,
      min(coalesce((select sequence from public.case_stage_instances s
        where s.id = visible_cases.current_stage_instance_id), 999)) sequence,
      count(*) total
    from visible_cases
    group by coalesce(stage_code, 'no_active_stage'),
      coalesce(stage_name_en, 'No active stage'),
      coalesce(stage_name_th, 'ไม่มีขั้นตอนปัจจุบัน')
  ) grouped
),
budget_breakdown as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', budget_code, 'name_en', budget_name_en, 'name_th', budget_name_th,
    'total', total
  ) order by total desc), '[]'::jsonb) value
  from (
    select budget_code, budget_name_en, budget_name_th, count(*) total
    from visible_cases
    group by budget_code, budget_name_en, budget_name_th
  ) grouped
),
months as (
  select generate_series(
    date_trunc('month', now()) - interval '5 months',
    date_trunc('month', now()),
    interval '1 month'
  ) month_start
),
trend as (
  select jsonb_agg(jsonb_build_object(
    'month', to_char(month_start, 'YYYY-MM'),
    'created', (select count(*) from visible_cases
      where created_at >= month_start and created_at < month_start + interval '1 month'),
    'completed', (select count(*) from visible_cases
      where completed_at >= month_start and completed_at < month_start + interval '1 month')
  ) order by month_start) value
  from months
),
bottlenecks as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', step_key, 'name_en', name_en, 'name_th', name_th,
    'active_cases', active_cases, 'average_days', average_days,
    'overdue_cases', overdue_cases
  ) order by active_cases desc, average_days desc), '[]'::jsonb) value
  from (
    select
      stage.step_key, stage.name_en, stage.name_th,
      count(*) active_cases,
      round(avg(extract(epoch from (now() - stage.entered_at)) / 86400.0)::numeric, 2) average_days,
      count(*) filter (where stage.due_at < now()) overdue_cases
    from public.case_stage_instances stage
    where stage.status = 'active'
    group by stage.step_key, stage.name_en, stage.name_th
    order by count(*) desc
    limit 5
  ) grouped
),
overdue_list as (
  select coalesce(jsonb_agg(row_data order by overdue_days desc), '[]'::jsonb) value
  from (
    select jsonb_build_object(
      'id', id, 'case_number', case_number, 'title', title,
      'stage_name_en', coalesce(stage_name_en, 'No active stage'),
      'stage_name_th', coalesce(stage_name_th, 'ไม่มีขั้นตอนปัจจุบัน'),
      'overdue_days', greatest(
        floor(extract(epoch from (now() - coalesce(stage_due_at, target_completion_date::timestamptz))) / 86400),
        0
      )
    ) row_data,
    greatest(
      floor(extract(epoch from (now() - coalesce(stage_due_at, target_completion_date::timestamptz))) / 86400),
      0
    ) overdue_days
    from visible_cases
    where status in ('active', 'on_hold')
      and coalesce(stage_due_at, target_completion_date::timestamptz) < now()
    order by overdue_days desc
    limit 5
  ) items
),
workload as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', p.id, 'full_name', p.full_name,
    'owned_cases', (select count(*) from visible_cases where case_owner_id = p.id and status in ('active', 'on_hold')),
    'action_required', (select count(*) from visible_cases where current_responsible_user_id = p.id and status in ('active', 'on_hold')),
    'overdue', (select count(*) from visible_cases where current_responsible_user_id = p.id
      and status in ('active', 'on_hold')
      and coalesce(stage_due_at, target_completion_date::timestamptz) < now()),
    'due_soon', (select count(*) from visible_cases where current_responsible_user_id = p.id
      and status in ('active', 'on_hold')
      and coalesce(stage_due_at, target_completion_date::timestamptz)
        between now() and now() + interval '7 days')
  ) order by p.full_name), '[]'::jsonb) value
  from public.profiles p
  where p.is_active and exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p.id and r.code = 'procurement_officer'
  )
)
select jsonb_build_object(
  'summary', summary.value,
  'categories', category_breakdown.value,
  'procurement_types', procurement_breakdown.value,
  'stages', stage_breakdown.value,
  'budget_categories', budget_breakdown.value,
  'trend', trend.value,
  'bottlenecks', bottlenecks.value,
  'overdue_cases', overdue_list.value,
  'workload', workload.value,
  'generated_at', now()
)
from summary, category_breakdown, procurement_breakdown, stage_breakdown,
  budget_breakdown, trend, bottlenecks, overdue_list, workload;
$$;

create or replace function public.personnel_stage_kpi_report(
  period_start timestamptz default null,
  period_end timestamptz default null,
  selected_user_id uuid default null,
  selected_step_key text default null
)
returns table (
  user_id uuid,
  full_name text,
  step_key text,
  stage_name_en text,
  stage_name_th text,
  unique_cases bigint,
  interval_count bigint,
  minimum_days numeric,
  maximum_days numeric,
  average_days numeric,
  median_days numeric,
  total_days numeric,
  completed_cases bigint
)
language sql
stable
set search_path = ''
as $$
with bounded as (
  select
    interval.responsible_user_id user_id,
    p.full_name,
    stage.step_key,
    stage.name_en stage_name_en,
    stage.name_th stage_name_th,
    interval.case_id,
    pc.status case_status,
    extract(epoch from (
      least(coalesce(interval.ended_at, now()), coalesce(period_end, now()))
      - greatest(interval.started_at, coalesce(period_start, interval.started_at))
    )) / 86400.0 days
  from public.case_responsibility_intervals interval
  join public.profiles p on p.id = interval.responsible_user_id
  join public.case_stage_instances stage on stage.id = interval.stage_instance_id
  join public.procurement_cases pc on pc.id = interval.case_id
  where interval.responsible_user_id is not null
    and interval.started_at < coalesce(period_end, now())
    and coalesce(interval.ended_at, now()) > coalesce(period_start, '-infinity'::timestamptz)
    and (selected_user_id is null or interval.responsible_user_id = selected_user_id)
    and (selected_step_key is null or stage.step_key = selected_step_key)
)
select
  user_id, full_name, step_key, stage_name_en, stage_name_th,
  count(distinct case_id) unique_cases,
  count(*) interval_count,
  round(min(days)::numeric, 4) minimum_days,
  round(max(days)::numeric, 4) maximum_days,
  round(avg(days)::numeric, 4) average_days,
  round(percentile_cont(0.5) within group (order by days)::numeric, 4) median_days,
  round(sum(days)::numeric, 4) total_days,
  count(distinct case_id) filter (where case_status = 'completed') completed_cases
from bounded
where days >= 0
group by user_id, full_name, step_key, stage_name_en, stage_name_th
order by full_name, step_key;
$$;

create or replace function public.work_status_report(
  group_dimension text,
  period_start timestamptz default null,
  period_end timestamptz default null
)
returns table (
  group_key text,
  group_name_en text,
  group_name_th text,
  total bigint,
  completed bigint,
  active_remaining bigint,
  on_hold bigint,
  cancelled bigint,
  completion_percentage numeric,
  overdue_remaining bigint
)
language sql
stable
set search_path = ''
as $$
with source as (
  select
    pc.*,
    wc.code work_category_code, wc.name_en work_category_en, wc.name_th work_category_th,
    pt.code procurement_type_code, pt.name_en procurement_type_en, pt.name_th procurement_type_th,
    bs.code budget_source_code, bs.name_en budget_source_en, bs.name_th budget_source_th,
    bc.code budget_category_code, bc.name_en budget_category_en, bc.name_th budget_category_th,
    dep.code department_code, dep.name_en department_en, dep.name_th department_th,
    fy.code fiscal_year_code, fy.name_en fiscal_year_en, fy.name_th fiscal_year_th,
    owner.full_name owner_name,
    stage.step_key stage_code, stage.name_en stage_en, stage.name_th stage_th,
    stage.due_at stage_due_at
  from public.procurement_cases pc
  join public.work_categories wc on wc.id = pc.work_category_id
  join public.procurement_types pt on pt.id = pc.procurement_type_id
  join public.budget_sources bs on bs.id = pc.budget_source_id
  join public.budget_categories bc on bc.id = pc.budget_category_id
  join public.departments dep on dep.id = pc.requesting_department_id
  join public.fiscal_years fy on fy.id = pc.fiscal_year_id
  join public.profiles owner on owner.id = pc.case_owner_id
  left join public.case_stage_instances stage on stage.id = pc.current_stage_instance_id
  where pc.created_at < coalesce(period_end, 'infinity'::timestamptz)
    and pc.created_at >= coalesce(period_start, '-infinity'::timestamptz)
),
labeled as (
  select *,
    case group_dimension
      when 'work_category' then work_category_code
      when 'procurement_type' then procurement_type_code
      when 'budget_source' then budget_source_code
      when 'budget_category' then budget_category_code
      when 'current_stage' then coalesce(stage_code, 'no_active_stage')
      when 'department' then department_code
      when 'owner' then case_owner_id::text
      when 'fiscal_year' then fiscal_year_code
      else work_category_code
    end dimension_key,
    case group_dimension
      when 'work_category' then work_category_en
      when 'procurement_type' then procurement_type_en
      when 'budget_source' then budget_source_en
      when 'budget_category' then budget_category_en
      when 'current_stage' then coalesce(stage_en, 'No active stage')
      when 'department' then department_en
      when 'owner' then owner_name
      when 'fiscal_year' then fiscal_year_en
      else work_category_en
    end dimension_en,
    case group_dimension
      when 'work_category' then work_category_th
      when 'procurement_type' then procurement_type_th
      when 'budget_source' then budget_source_th
      when 'budget_category' then budget_category_th
      when 'current_stage' then coalesce(stage_th, 'ไม่มีขั้นตอนปัจจุบัน')
      when 'department' then department_th
      when 'owner' then owner_name
      when 'fiscal_year' then fiscal_year_th
      else work_category_th
    end dimension_th
  from source
)
select
  dimension_key, dimension_en, dimension_th,
  count(*) total,
  count(*) filter (where status = 'completed') completed,
  count(*) filter (where status in ('draft', 'active')) active_remaining,
  count(*) filter (where status = 'on_hold') on_hold,
  count(*) filter (where status = 'cancelled') cancelled,
  round(
    case when count(*) = 0 then 0
      else count(*) filter (where status = 'completed')::numeric / count(*) * 100
    end,
    2
  ) completion_percentage,
  count(*) filter (
    where status in ('active', 'on_hold')
      and coalesce(stage_due_at, target_completion_date::timestamptz) < now()
  ) overdue_remaining
from labeled
group by dimension_key, dimension_en, dimension_th
order by count(*) desc, dimension_en;
$$;

revoke all on function public.dashboard_report() from public;
revoke all on function public.personnel_stage_kpi_report(timestamptz, timestamptz, uuid, text) from public;
revoke all on function public.work_status_report(text, timestamptz, timestamptz) from public;
grant execute on function public.dashboard_report() to authenticated;
grant execute on function public.personnel_stage_kpi_report(timestamptz, timestamptz, uuid, text) to authenticated;
grant execute on function public.work_status_report(text, timestamptz, timestamptz) to authenticated;

comment on function public.personnel_stage_kpi_report(timestamptz, timestamptz, uuid, text) is
  'Uses responsibility intervals clamped to the selected period. Decimal days are exact timestamp seconds divided by 86,400; presentation rounding happens separately.';
comment on function public.work_status_report(text, timestamptz, timestamptz) is
  'Returns reconciled case-status metrics grouped by an allowlisted reporting dimension.';
