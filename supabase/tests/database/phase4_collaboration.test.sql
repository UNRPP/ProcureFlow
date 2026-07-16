begin;

select plan(12);

set local role anon;
select throws_ok(
  $$ select count(*) from public.case_documents $$,
  '42501',
  'permission denied for table case_documents',
  'anonymous users cannot read case document metadata'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
select throws_ok(
  $$ select public.add_case_comment(
    '20000000-0000-0000-0000-000000000001', 'Auditors stay read-only'
  ) $$,
  '42501',
  'Comment creation is not authorized',
  'viewer auditors cannot add comments'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
select lives_ok(
  $$ select public.add_case_comment(
    '20000000-0000-0000-0000-000000000001', 'Phase 4 pgTAP comment'
  ) $$,
  'authorized officer can add a case comment'
);
select ok(
  exists (
    select 1 from public.case_activity_events
    where case_id = '20000000-0000-0000-0000-000000000001'
      and summary_key = 'comments.added'
  ),
  'comment creation adds immutable case activity'
);
select is(
  (select count(*)::integer from public.notifications
   where recipient_user_id <> '10000000-0000-0000-0000-000000000003'),
  0,
  'notification RLS hides other users notifications'
);
select lives_ok(
  $$ update public.notifications set read_at = now() where read_at is null $$,
  'users can mark their own notifications as read'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
select throws_ok(
  $$ update public.workflow_step_document_requirements
     set blocks_completion = not blocks_completion
     where id = (select id from public.workflow_step_document_requirements limit 1) $$,
  '23514',
  'Only draft workflow document requirements may be changed',
  'published workflow requirements are immutable'
);

reset role;
select throws_ok(
  $$ update public.case_stage_instances set status = 'completed'
     where id = (
       select stage.id
       from public.case_stage_instances stage
       join public.case_stage_document_requirements requirement
         on requirement.stage_instance_id = stage.id
       where stage.status = 'active' and requirement.blocks_completion
       limit 1
     ) $$,
  '23514',
  'Required stage documents are missing',
  'blocking checklist prevents stage completion without a file version'
);
select is(
  (select count(*)::integer from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname like 'case_documents_storage_%'),
  3,
  'three explicit Storage policies protect the private document bucket'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.generate_procurement_notifications(timestamptz)',
    'EXECUTE'
  ),
  'service role can execute scheduled notification generation'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.generate_procurement_notifications(timestamptz)',
    'EXECUTE'
  ),
  'normal authenticated users cannot execute scheduled notification generation'
);
select is(
  (select count(*)::integer from public.case_document_versions),
  0,
  'seed does not fabricate Storage-backed document metadata'
);

select * from finish();
rollback;
