-- Phase 4: immutable document versions, collaboration, notifications, and reminders.

create table public.document_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_]{1,49}$'),
  name_en text not null check (char_length(btrim(name_en)) between 2 and 120),
  name_th text not null check (char_length(btrim(name_th)) between 2 and 120),
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_active and archived_at is null) or (not is_active and archived_at is not null))
);

create table public.workflow_step_document_requirements (
  id uuid primary key default gen_random_uuid(),
  template_step_id uuid not null references public.workflow_template_steps(id) on delete cascade,
  document_type_id uuid not null references public.document_types(id) on delete restrict,
  is_required boolean not null default true,
  blocks_completion boolean not null default false,
  description_en text,
  description_th text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_step_id, document_type_id),
  check (not blocks_completion or is_required)
);

-- Requirements are copied with each stage snapshot so active cases never rely on template state.
create table public.case_stage_document_requirements (
  id uuid primary key default gen_random_uuid(),
  stage_instance_id uuid not null references public.case_stage_instances(id) on delete restrict,
  case_id uuid not null references public.procurement_cases(id) on delete restrict,
  document_type_id uuid not null references public.document_types(id) on delete restrict,
  document_type_code text not null,
  document_type_name_en text not null,
  document_type_name_th text not null,
  is_required boolean not null,
  blocks_completion boolean not null,
  description_en text,
  description_th text,
  created_at timestamptz not null default now(),
  unique (stage_instance_id, document_type_id),
  check (not blocks_completion or is_required)
);

create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.procurement_cases(id) on delete restrict,
  stage_instance_id uuid references public.case_stage_instances(id) on delete restrict,
  document_type_id uuid not null references public.document_types(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 2 and 200),
  description text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.case_documents(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  original_filename text not null check (
    char_length(btrim(original_filename)) between 1 and 255
    and original_filename !~ '[/\\]'
  ),
  storage_bucket text not null default 'case-documents' check (storage_bucket = 'case-documents'),
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 26214400),
  replaces_version_id uuid references public.case_document_versions(id) on delete restrict,
  version_description text,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create table public.case_comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.procurement_cases(id) on delete restrict,
  stage_instance_id uuid references public.case_stage_instances(id) on delete restrict,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  author_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete restrict,
  case_id uuid references public.procurement_cases(id) on delete restrict,
  notification_type text not null check (notification_type in (
    'assignment', 'responsibility_change', 'returned_case', 'due_soon',
    'overdue', 'hold', 'service_contract_renewal'
  )),
  title_key text not null,
  body_data jsonb not null default '{}'::jsonb,
  source_key text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (recipient_user_id, source_key)
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  assignment_enabled boolean not null default true,
  workflow_enabled boolean not null default true,
  due_soon_enabled boolean not null default true,
  overdue_enabled boolean not null default true,
  renewal_enabled boolean not null default true,
  due_soon_days integer not null default 7 check (due_soon_days between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger document_types_set_updated_at before update on public.document_types
for each row execute function public.set_updated_at();
create trigger workflow_document_requirements_set_updated_at
before update on public.workflow_step_document_requirements
for each row execute function public.set_updated_at();
create trigger case_documents_set_updated_at before update on public.case_documents
for each row execute function public.set_updated_at();
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

create index workflow_document_requirements_step_idx
  on public.workflow_step_document_requirements(template_step_id);
create index case_stage_document_requirements_case_stage_idx
  on public.case_stage_document_requirements(case_id, stage_instance_id);
create index case_documents_case_stage_idx on public.case_documents(case_id, stage_instance_id);
create index case_document_versions_document_version_idx
  on public.case_document_versions(document_id, version_number desc);
create index case_comments_case_time_idx on public.case_comments(case_id, created_at desc);
create index notifications_recipient_unread_idx
  on public.notifications(recipient_user_id, created_at desc) where read_at is null;
create index service_contract_renewal_idx
  on public.service_contract_case_details(renewal_notification_date, contract_end_date)
  where renewal_notification_date is not null;

create or replace function public.protect_document_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Document versions and case comments are immutable' using errcode = '23514';
end;
$$;

create trigger case_document_versions_immutable
before update or delete on public.case_document_versions
for each row execute function public.protect_document_history();
create trigger case_comments_immutable
before update or delete on public.case_comments
for each row execute function public.protect_document_history();
create trigger case_stage_document_requirements_immutable
before update or delete on public.case_stage_document_requirements
for each row execute function public.protect_document_history();

create or replace function public.protect_workflow_document_requirement()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_status text;
  step_id uuid := coalesce(new.template_step_id, old.template_step_id);
begin
  select template.status into parent_status
  from public.workflow_template_steps step
  join public.workflow_templates template on template.id = step.template_id
  where step.id = step_id;
  if parent_status is distinct from 'draft'
    and not (
      current_user in ('postgres', 'supabase_admin')
      and current_setting('procureflow.seed_mode', true) = 'on'
    ) then
    raise exception 'Only draft workflow document requirements may be changed' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger workflow_document_requirements_draft_only
before insert or update or delete on public.workflow_step_document_requirements
for each row execute function public.protect_workflow_document_requirement();

create or replace function public.duplicate_workflow_template(source_template_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  source public.workflow_templates%rowtype;
  new_id uuid;
  new_version integer;
begin
  if actor_id is null or not public.has_any_role(array['super_admin']) then
    raise exception 'Workflow administration is not authorized' using errcode = '42501';
  end if;
  select * into source from public.workflow_templates where id = source_template_id;
  if source.id is null then
    raise exception 'Workflow template not found' using errcode = 'P0002';
  end if;
  select coalesce(max(version), 0) + 1 into new_version
  from public.workflow_templates where code = source.code;
  insert into public.workflow_templates (
    code, version, name_en, name_th, description_en, description_th,
    procurement_type_id, status, created_by
  ) values (
    source.code, new_version, source.name_en, source.name_th,
    source.description_en, source.description_th,
    source.procurement_type_id, 'draft', actor_id
  ) returning id into new_id;
  insert into public.workflow_template_steps (
    template_id, step_key, name_en, name_th, description_en, description_th,
    sequence, default_responsible_role_id, default_responsible_department_id,
    target_days, required_document_behavior, can_skip, is_active
  )
  select
    new_id, step_key, name_en, name_th, description_en, description_th,
    sequence, default_responsible_role_id, default_responsible_department_id,
    target_days, required_document_behavior, can_skip, is_active
  from public.workflow_template_steps where template_id = source.id
  order by sequence;
  insert into public.workflow_step_document_requirements (
    template_step_id, document_type_id, is_required, blocks_completion,
    description_en, description_th
  )
  select
    new_step.id, requirement.document_type_id, requirement.is_required,
    requirement.blocks_completion, requirement.description_en, requirement.description_th
  from public.workflow_step_document_requirements requirement
  join public.workflow_template_steps source_step on source_step.id = requirement.template_step_id
  join public.workflow_template_steps new_step
    on new_step.template_id = new_id and new_step.step_key = source_step.step_key
  where source_step.template_id = source.id;
  return new_id;
end;
$$;

create or replace function public.snapshot_stage_document_requirements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.case_stage_document_requirements (
    stage_instance_id, case_id, document_type_id, document_type_code,
    document_type_name_en, document_type_name_th, is_required,
    blocks_completion, description_en, description_th
  )
  select
    new.id, new.case_id, requirement.document_type_id, document_type.code,
    document_type.name_en, document_type.name_th, requirement.is_required,
    requirement.blocks_completion, requirement.description_en, requirement.description_th
  from public.workflow_step_document_requirements requirement
  join public.document_types document_type on document_type.id = requirement.document_type_id
  where requirement.template_step_id = new.template_step_id;
  return new;
end;
$$;

create trigger case_stage_document_requirements_snapshot
after insert on public.case_stage_instances
for each row execute function public.snapshot_stage_document_requirements();

create or replace function public.enforce_required_stage_documents()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'active' and new.status = 'completed' and exists (
    select 1
    from public.case_stage_document_requirements requirement
    where requirement.stage_instance_id = old.id
      and requirement.blocks_completion
      and not exists (
        select 1
        from public.case_documents document
        join public.case_document_versions version on version.document_id = document.id
        where document.case_id = old.case_id
          and document.stage_instance_id = old.id
          and document.document_type_id = requirement.document_type_id
      )
  ) then
    raise exception 'Required stage documents are missing' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger case_stage_required_documents_guard
before update on public.case_stage_instances
for each row execute function public.enforce_required_stage_documents();

create or replace function public.register_case_document_version(
  target_case_id uuid,
  target_stage_instance_id uuid,
  target_document_id uuid,
  target_version_id uuid,
  target_document_type_id uuid,
  target_title text,
  target_description text,
  target_original_filename text,
  target_storage_path text,
  target_mime_type text,
  target_size_bytes bigint,
  target_version_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  document_record public.case_documents%rowtype;
  next_version integer;
  previous_version_id uuid;
begin
  if actor_id is null
    or not public.can_edit_procurement_case(target_case_id)
    or not public.has_any_role(array['super_admin', 'procurement_manager', 'procurement_officer']) then
    raise exception 'Document upload is not authorized' using errcode = '42501';
  end if;
  if target_stage_instance_id is not null and not exists (
    select 1 from public.case_stage_instances
    where id = target_stage_instance_id and case_id = target_case_id
  ) then
    raise exception 'Document stage does not belong to this case' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.document_types where id = target_document_type_id and is_active
  ) then
    raise exception 'Document type is unavailable' using errcode = '23514';
  end if;
  if target_storage_path <> concat(
    target_case_id::text, '/', target_document_id::text, '/', target_version_id::text, '/',
    target_original_filename
  ) then
    raise exception 'Document storage path is invalid' using errcode = '23514';
  end if;

  select * into document_record from public.case_documents
  where id = target_document_id for update;
  if document_record.id is null then
    insert into public.case_documents (
      id, case_id, stage_instance_id, document_type_id, title, description, created_by
    ) values (
      target_document_id, target_case_id, target_stage_instance_id,
      target_document_type_id, btrim(target_title), nullif(btrim(target_description), ''), actor_id
    ) returning * into document_record;
  elsif document_record.case_id <> target_case_id
    or document_record.document_type_id <> target_document_type_id then
    raise exception 'Document metadata does not match the existing document' using errcode = '23514';
  end if;

  select version_number, id into next_version, previous_version_id
  from public.case_document_versions
  where document_id = target_document_id
  order by version_number desc limit 1;
  next_version := coalesce(next_version, 0) + 1;

  insert into public.case_document_versions (
    id, document_id, version_number, original_filename, storage_path,
    mime_type, size_bytes, replaces_version_id, version_description, uploaded_by
  ) values (
    target_version_id, target_document_id, next_version, target_original_filename,
    target_storage_path, target_mime_type, target_size_bytes, previous_version_id,
    nullif(btrim(target_version_description), ''), actor_id
  );
  update public.case_documents set updated_at = now() where id = target_document_id;
  insert into public.case_activity_events (
    case_id, event_type, summary_key, actor_id, details, occurred_at
  ) values (
    target_case_id, 'document', 'documents.uploaded', actor_id,
    jsonb_build_object('document_id', target_document_id, 'version_id', target_version_id,
      'version_number', next_version, 'filename', target_original_filename), now()
  );
  return target_version_id;
end;
$$;

create or replace function public.add_case_comment(target_case_id uuid, comment_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  comment_id uuid;
  stage_id uuid;
begin
  if actor_id is null
    or not public.can_view_procurement_case(target_case_id)
    or not public.has_any_role(array['super_admin', 'procurement_manager', 'procurement_officer']) then
    raise exception 'Comment creation is not authorized' using errcode = '42501';
  end if;
  if char_length(btrim(comment_body)) not between 1 and 4000 then
    raise exception 'Comment must contain 1 to 4,000 characters' using errcode = '23514';
  end if;
  select current_stage_instance_id into stage_id from public.procurement_cases
  where id = target_case_id;
  insert into public.case_comments (case_id, stage_instance_id, body, author_id)
  values (target_case_id, stage_id, btrim(comment_body), actor_id)
  returning id into comment_id;
  insert into public.case_activity_events (
    case_id, event_type, summary_key, actor_id, details, occurred_at
  ) values (
    target_case_id, 'comment', 'comments.added', actor_id,
    jsonb_build_object('comment_id', comment_id), now()
  );
  return comment_id;
end;
$$;

create or replace function public.notification_type_enabled(target_user_id uuid, target_type text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when target_type = 'assignment' then assignment_enabled
      when target_type in ('responsibility_change', 'returned_case', 'hold') then workflow_enabled
      when target_type = 'due_soon' then due_soon_enabled
      when target_type = 'overdue' then overdue_enabled
      when target_type = 'service_contract_renewal' then renewal_enabled
      else true
    end
    from public.notification_preferences where user_id = target_user_id
  ), true);
$$;

create or replace function public.create_case_notification(
  target_user_id uuid,
  target_case_id uuid,
  target_type text,
  target_source_key text,
  target_body_data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_id uuid;
begin
  if target_user_id is null or not public.notification_type_enabled(target_user_id, target_type) then
    return null;
  end if;
  insert into public.notifications (
    recipient_user_id, case_id, notification_type, title_key, body_data, source_key
  ) values (
    target_user_id, target_case_id, target_type, 'notifications.' || target_type,
    coalesce(target_body_data, '{}'::jsonb), target_source_key
  ) on conflict (recipient_user_id, source_key) do nothing
  returning id into notification_id;
  return notification_id;
end;
$$;

create or replace function public.notify_workflow_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient_id uuid;
  notification_kind text;
  case_number_value text;
begin
  if new.action not in ('start', 'reassign', 'return', 'hold') then
    return new;
  end if;
  select current_responsible_user_id, case_number
  into recipient_id, case_number_value
  from public.procurement_cases where id = new.case_id;
  notification_kind := case new.action
    when 'start' then 'assignment'
    when 'reassign' then 'responsibility_change'
    when 'return' then 'returned_case'
    when 'hold' then 'hold'
  end;
  perform public.create_case_notification(
    recipient_id, new.case_id, notification_kind,
    concat('workflow:', new.id::text, ':', notification_kind),
    jsonb_build_object('case_number', case_number_value, 'reason', new.reason)
  );
  return new;
end;
$$;

create trigger workflow_transition_notifications
after insert on public.workflow_transition_events
for each row execute function public.notify_workflow_transition();

create or replace function public.generate_procurement_notifications(reference_time timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer := 0;
  before_count bigint;
begin
  select count(*) into before_count from public.notifications;
  perform public.create_case_notification(
    case_record.current_responsible_user_id,
    case_record.id,
    case when stage.due_at < reference_time then 'overdue' else 'due_soon' end,
    concat(
      case when stage.due_at < reference_time then 'overdue:' else 'due-soon:' end,
      case_record.id::text, ':', stage.id::text
    ),
    jsonb_build_object('case_number', case_record.case_number, 'due_at', stage.due_at)
  )
  from public.procurement_cases case_record
  join public.case_stage_instances stage on stage.id = case_record.current_stage_instance_id
  where case_record.status in ('active', 'on_hold')
    and case_record.current_responsible_user_id is not null
    and stage.due_at <= reference_time + interval '7 days';

  perform public.create_case_notification(
    recipient.user_id,
    case_record.id,
    'service_contract_renewal',
    concat('renewal:', case_record.id::text, ':', detail.renewal_notification_date::text),
    jsonb_build_object(
      'case_number', case_record.case_number,
      'renewal_notification_date', detail.renewal_notification_date,
      'contract_end_date', detail.contract_end_date
    )
  )
  from public.service_contract_case_details detail
  join public.procurement_cases case_record on case_record.id = detail.case_id
  cross join lateral (
    select case_record.case_owner_id user_id
    union
    select case_record.current_responsible_user_id where case_record.current_responsible_user_id is not null
  ) recipient
  where case_record.status in ('active', 'on_hold')
    and detail.renewal_notification_date is not null
    and detail.renewal_notification_date <= reference_time::date
    and detail.contract_end_date >= reference_time::date;

  select count(*) - before_count into inserted_count from public.notifications;
  return inserted_count;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-documents', 'case-documents', false, 26214400,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg', 'image/png'
  ]
) on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy case_documents_storage_read on storage.objects for select to authenticated
using (
  bucket_id = 'case-documents'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then public.can_view_procurement_case(((storage.foldername(name))[1])::uuid)
    else false
  end
);
create policy case_documents_storage_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'case-documents'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then public.can_edit_procurement_case(((storage.foldername(name))[1])::uuid)
    else false
  end
);
create policy case_documents_storage_orphan_cleanup on storage.objects for delete to authenticated
using (
  bucket_id = 'case-documents'
  and not exists (select 1 from public.case_document_versions where storage_path = name)
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then public.can_edit_procurement_case(((storage.foldername(name))[1])::uuid)
    else false
  end
);

revoke all on function public.protect_document_history() from public;
revoke all on function public.protect_workflow_document_requirement() from public;
revoke all on function public.snapshot_stage_document_requirements() from public;
revoke all on function public.enforce_required_stage_documents() from public;
revoke all on function public.register_case_document_version(uuid, uuid, uuid, uuid, uuid, text, text, text, text, text, bigint, text) from public;
revoke all on function public.add_case_comment(uuid, text) from public;
revoke all on function public.notification_type_enabled(uuid, text) from public;
revoke all on function public.create_case_notification(uuid, uuid, text, text, jsonb) from public;
revoke all on function public.notify_workflow_transition() from public;
revoke all on function public.generate_procurement_notifications(timestamptz) from public;
grant execute on function public.register_case_document_version(uuid, uuid, uuid, uuid, uuid, text, text, text, text, text, bigint, text) to authenticated;
grant execute on function public.add_case_comment(uuid, text) to authenticated;
grant execute on function public.generate_procurement_notifications(timestamptz) to service_role;

alter table public.document_types enable row level security;
alter table public.workflow_step_document_requirements enable row level security;
alter table public.case_stage_document_requirements enable row level security;
alter table public.case_documents enable row level security;
alter table public.case_document_versions enable row level security;
alter table public.case_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

revoke all on table public.document_types, public.workflow_step_document_requirements,
  public.case_stage_document_requirements, public.case_documents,
  public.case_document_versions, public.case_comments, public.notifications,
  public.notification_preferences from anon;
grant select on table public.document_types, public.workflow_step_document_requirements,
  public.case_stage_document_requirements, public.case_documents,
  public.case_document_versions, public.case_comments, public.notifications,
  public.notification_preferences to authenticated;
grant insert, update, delete on table public.document_types,
  public.workflow_step_document_requirements to authenticated;
grant insert, update on table public.notification_preferences to authenticated;
grant update (read_at) on table public.notifications to authenticated;

create policy document_types_read on public.document_types for select to authenticated
using (public.is_active_user() and (is_active or public.has_any_role(array['super_admin'])));
create policy document_types_admin_write on public.document_types for all to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));
create policy workflow_step_document_requirements_read
  on public.workflow_step_document_requirements for select to authenticated
using (
  public.is_active_user() and exists (
    select 1 from public.workflow_template_steps step
    join public.workflow_templates template on template.id = step.template_id
    where step.id = template_step_id
      and (template.status in ('published', 'archived') or public.has_any_role(array['super_admin']))
  )
);
create policy workflow_step_document_requirements_admin_write
  on public.workflow_step_document_requirements for all to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));
create policy case_stage_document_requirements_read
  on public.case_stage_document_requirements for select to authenticated
using (public.can_view_procurement_case(case_id));
create policy case_documents_read on public.case_documents for select to authenticated
using (public.can_view_procurement_case(case_id));
create policy case_document_versions_read
  on public.case_document_versions for select to authenticated
using (exists (
  select 1 from public.case_documents document
  where document.id = document_id and public.can_view_procurement_case(document.case_id)
));
create policy case_comments_read on public.case_comments for select to authenticated
using (public.can_view_procurement_case(case_id));
create policy notifications_own_read on public.notifications for select to authenticated
using (recipient_user_id = (select auth.uid()));
create policy notifications_own_update on public.notifications for update to authenticated
using (recipient_user_id = (select auth.uid()))
with check (recipient_user_id = (select auth.uid()));
create policy notification_preferences_own on public.notification_preferences for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

comment on table public.case_document_versions is
  'Immutable metadata for every uploaded file version. Storage objects are never overwritten in place.';
comment on table public.case_stage_document_requirements is
  'Case-specific immutable checklist copied from the published workflow requirement configuration.';
comment on function public.generate_procurement_notifications(timestamptz) is
  'Idempotently generates due-soon, overdue, and service-contract renewal notifications for a scheduled server-only job.';
