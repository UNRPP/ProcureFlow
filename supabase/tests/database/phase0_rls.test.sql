begin;

select plan(7);

set local role anon;
select throws_ok(
  $$ select count(*) from public.work_categories $$,
  '42501',
  'permission denied for table work_categories',
  'anonymous users cannot read master data'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}', true);

select is(
  (select count(*)::integer from public.work_categories),
  3,
  'active authenticated users can read seeded work categories'
);
select is(
  (select count(*)::integer from public.profiles),
  4,
  'Phase 1 allows procurement officers to read profile names for case displays'
);
select is(
  (select count(*)::integer from public.user_roles),
  1,
  'procurement officers can read only their own role membership'
);
select throws_ok(
  $$ insert into public.budget_sources (code, name_en, name_th) values ('forbidden', 'Forbidden', 'ไม่อนุญาต') $$,
  '42501',
  null,
  'procurement officers cannot manage master data'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  (select count(*)::integer from public.profiles),
  4,
  'super administrators can read all seeded profiles'
);
select lives_ok(
  $$ insert into public.budget_sources (code, name_en, name_th) values ('phase0_test', 'Phase 0 test', 'ทดสอบระยะที่ 0') $$,
  'super administrators can manage master data'
);

select * from finish();
rollback;
