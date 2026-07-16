begin;

select plan(11);

set local role anon;
select throws_ok(
  $$ select count(*) from public.case_stage_instances $$,
  '42501',
  'permission denied for table case_stage_instances',
  'anonymous users cannot read workflow snapshots'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(
  (select count(*)::integer from public.workflow_templates where status = 'published'),
  4,
  'seed provides one published workflow per procurement type'
);
select throws_ok(
  $$ update public.workflow_template_steps set target_days = 99 where template_id = '30000000-0000-0000-0000-000000000001' $$,
  '23514',
  'Only draft workflow steps may be changed',
  'published template steps are immutable'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select lives_ok(
  $$ select public.start_case_workflow(
    '20000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000002'
  ) $$,
  'officer can start a workflow for an owned draft case'
);
select is(
  (select count(*)::integer from public.case_stage_instances
   where case_id = '20000000-0000-0000-0000-000000000003'),
  7,
  'starting a workflow snapshots all seven steps'
);
select is(
  (select count(*)::integer from public.case_stage_instances
   where case_id = '20000000-0000-0000-0000-000000000003' and status = 'active'),
  1,
  'only one stage is active after start'
);
select throws_ok(
  $$ select public.transition_case_workflow(
    '20000000-0000-0000-0000-000000000003', 'hold', null, null, null
  ) $$,
  '23514',
  'This workflow action requires a reason',
  'hold requires a reason'
);
select lives_ok(
  $$ select public.transition_case_workflow(
    '20000000-0000-0000-0000-000000000003', 'reassign', 'Coverage', 
    '10000000-0000-0000-0000-000000000002', null
  ) $$,
  'reassignment succeeds transactionally'
);
select is(
  (select count(*)::integer from public.case_responsibility_intervals
   where case_id = '20000000-0000-0000-0000-000000000003'),
  2,
  'reassignment preserves the closed interval and opens another'
);
select is(
  (select count(*)::integer from public.case_responsibility_intervals
   where case_id = '20000000-0000-0000-0000-000000000003' and ended_at is null),
  1,
  'only one responsibility interval remains open'
);
select lives_ok(
  $$ select public.transition_case_workflow(
    '20000000-0000-0000-0000-000000000003', 'complete', null, null, null
  ) $$,
  'completing a stage activates the next stage'
);

select * from finish();
rollback;
