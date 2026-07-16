begin;
select plan(6);

select ok(
  not has_schema_privilege('anon', 'public', 'CREATE'),
  'anon cannot create objects in public schema'
);

select ok(
  not has_schema_privilege('authenticated', 'public', 'CREATE'),
  'authenticated users cannot create objects in public schema'
);

select ok(
  not has_function_privilege('anon', 'public.dashboard_report()', 'EXECUTE'),
  'anon cannot execute dashboard report'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.generate_procurement_notifications(timestamptz)',
    'EXECUTE'
  ),
  'authenticated users cannot invoke scheduled notification generation'
);

select ok(
  (
    select bool_and(relrowsecurity)
    from pg_class
    where oid = any(array[
      'public.procurement_cases'::regclass,
      'public.case_workflows'::regclass,
      'public.case_stage_instances'::regclass,
      'public.case_responsibility_intervals'::regclass,
      'public.case_documents'::regclass,
      'public.notifications'::regclass
    ])
  ),
  'representative business tables have RLS enabled'
);

select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'case_documents_requirement_lookup_idx'
  ),
  'required-document lookup index exists'
);

select * from finish();
rollback;
