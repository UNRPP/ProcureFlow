begin;

select plan(7);

select ok(
  not has_function_privilege('anon', 'public.dashboard_report()', 'EXECUTE'),
  'anonymous users cannot execute dashboard reports'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.personnel_stage_kpi_report(timestamptz,timestamptz,uuid,text)',
    'EXECUTE'
  ),
  'anonymous users cannot execute personnel reports'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.work_status_report(text,timestamptz,timestamptz)',
    'EXECUTE'
  ),
  'anonymous users cannot execute work-status reports'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$ select public.dashboard_report() $$,
  'manager can execute dashboard report'
);
select ok(
  jsonb_typeof(public.dashboard_report() -> 'summary') = 'object',
  'dashboard summary is a structured object'
);
select is(
  (
    select coalesce(sum(total), 0)::integer
    from public.work_status_report('work_category', null, null)
  ),
  (select count(*)::integer from public.procurement_cases),
  'grouped work-status totals reconcile to visible cases'
);
select ok(
  exists (
    select 1
    from public.personnel_stage_kpi_report(null, null, null, null)
    where interval_count > 0
      and total_days >= 0
      and median_days >= minimum_days
      and median_days <= maximum_days
  ),
  'personnel KPI is derived from seeded responsibility intervals'
);

select * from finish();
rollback;
