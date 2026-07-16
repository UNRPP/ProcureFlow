begin;
select plan(10);

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
  not has_function_privilege('anon', 'public.activate_case_stage(uuid,uuid,integer,text,text,uuid)', 'EXECUTE'),
  'anon cannot invoke internal workflow activation'
);

select ok(
  not has_function_privilege('authenticated', 'public.activate_case_stage(uuid,uuid,integer,text,text,uuid)', 'EXECUTE'),
  'authenticated users cannot invoke internal workflow activation directly'
);

select ok(
  has_function_privilege('authenticated', 'public.start_case_workflow(uuid,uuid)', 'EXECUTE'),
  'authenticated users can invoke the authorized workflow start RPC'
);

select ok(
  has_function_privilege('service_role', 'public.generate_procurement_notifications(timestamptz)', 'EXECUTE'),
  'service role can invoke scheduled notification generation'
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
