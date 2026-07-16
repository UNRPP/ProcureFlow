begin;

select plan(7);

set local role anon;
select throws_ok(
  $$ select count(*) from public.procurement_cases $$,
  '42501',
  'permission denied for table procurement_cases',
  'anonymous users cannot read procurement cases'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is(
  (select count(*)::integer from public.procurement_cases),
  9,
  'auditors can read all seeded cases'
);
select throws_ok(
  $$ update public.procurement_cases set title = 'Forbidden' where id = '20000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'auditors cannot edit cases'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select is(
  (select count(*)::integer from public.profiles),
  4,
  'officers can read profile names for case displays'
);
select lives_ok(
  $$ update public.procurement_cases set description = 'RLS officer edit test' where id = '20000000-0000-0000-0000-000000000001' $$,
  'officers can edit open cases they own'
);
select throws_ok(
  $$ update public.procurement_cases set description = 'Forbidden closed edit' where id = '20000000-0000-0000-0000-000000000008' $$,
  '42501',
  null,
  'officers cannot edit cancelled cases'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select lives_ok(
  $$ update public.procurement_cases set description = 'Manager edit test' where id = '20000000-0000-0000-0000-000000000005' $$,
  'managers can edit completed case metadata'
);

select * from finish();
rollback;
