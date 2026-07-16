-- Phase 2: versioned workflow templates, immutable case snapshots, auditable
-- transitions, assignments, and historical responsibility intervals.

create table public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[a-z][a-z0-9_]*$'),
  version integer not null check (version > 0),
  name_en text not null check (btrim(name_en) <> ''),
  name_th text not null check (btrim(name_th) <> ''),
  description_en text,
  description_th text,
  procurement_type_id uuid not null references public.procurement_types(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  archived_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code, version),
  check (status <> 'published' or published_at is not null),
  check (status <> 'archived' or archived_at is not null)
);

create unique index workflow_templates_one_published_type_idx
  on public.workflow_templates(procurement_type_id) where status = 'published';
create index workflow_templates_type_status_idx
  on public.workflow_templates(procurement_type_id, status);

create table public.workflow_template_steps (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workflow_templates(id) on delete cascade,
  step_key text not null check (step_key ~ '^[a-z][a-z0-9_]*$'),
  name_en text not null check (btrim(name_en) <> ''),
  name_th text not null check (btrim(name_th) <> ''),
  description_en text,
  description_th text,
  sequence integer not null check (sequence > 0),
  default_responsible_role_id uuid references public.roles(id) on delete restrict,
  default_responsible_department_id uuid references public.departments(id) on delete restrict,
  target_days integer not null default 7 check (target_days >= 0),
  required_document_behavior text not null default 'none'
    check (required_document_behavior in ('none', 'warn', 'block')),
  can_skip boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, step_key),
  unique (template_id, sequence),
  check (num_nonnulls(default_responsible_role_id, default_responsible_department_id) <= 1)
);

create index workflow_template_steps_template_idx
  on public.workflow_template_steps(template_id, sequence);

create table public.case_workflows (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.procurement_cases(id) on delete restrict,
  template_id uuid not null references public.workflow_templates(id) on delete restrict,
  template_code text not null,
  template_version integer not null,
  template_name_en text not null,
  template_name_th text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  started_by uuid not null references public.profiles(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'completed' or completed_at is not null),
  check (status <> 'cancelled' or cancelled_at is not null)
);

create index case_workflows_template_idx on public.case_workflows(template_id);
create index case_workflows_status_idx on public.case_workflows(status);

create table public.case_stage_instances (
  id uuid primary key default gen_random_uuid(),
  case_workflow_id uuid not null references public.case_workflows(id) on delete restrict,
  case_id uuid not null references public.procurement_cases(id) on delete restrict,
  template_step_id uuid references public.workflow_template_steps(id) on delete restrict,
  step_key text not null,
  name_en text not null,
  name_th text not null,
  description_en text,
  description_th text,
  sequence integer not null check (sequence > 0),
  iteration integer not null default 1 check (iteration > 0),
  default_responsible_role_id uuid references public.roles(id) on delete restrict,
  default_responsible_department_id uuid references public.departments(id) on delete restrict,
  responsible_user_id uuid references public.profiles(id) on delete restrict,
  responsible_department_id uuid references public.departments(id) on delete restrict,
  target_days integer not null check (target_days >= 0),
  required_document_behavior text not null default 'none'
    check (required_document_behavior in ('none', 'warn', 'block')),
  can_skip boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'completed', 'returned', 'skipped', 'cancelled')),
  entered_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_workflow_id, sequence, iteration),
  check (num_nonnulls(responsible_user_id, responsible_department_id) <= 1),
  check (status <> 'active' or (entered_at is not null and due_at is not null)),
  check (status not in ('completed', 'returned', 'skipped', 'cancelled') or completed_at is not null)
);

create unique index case_stage_instances_one_active_case_idx
  on public.case_stage_instances(case_id) where status = 'active';
create index case_stage_instances_workflow_sequence_idx
  on public.case_stage_instances(case_workflow_id, sequence, iteration);
create index case_stage_instances_case_status_idx
  on public.case_stage_instances(case_id, status);
create index case_stage_instances_due_idx
  on public.case_stage_instances(due_at) where status = 'active';

alter table public.procurement_cases
  add column current_stage_instance_id uuid
  references public.case_stage_instances(id) on delete restrict;
create index procurement_cases_current_stage_idx
  on public.procurement_cases(current_stage_instance_id)
  where current_stage_instance_id is not null;

create table public.workflow_transition_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.procurement_cases(id) on delete restrict,
  case_workflow_id uuid not null references public.case_workflows(id) on delete restrict,
  from_stage_instance_id uuid references public.case_stage_instances(id) on delete restrict,
  to_stage_instance_id uuid references public.case_stage_instances(id) on delete restrict,
  action text not null check (
    action in ('start', 'complete', 'return', 'reassign', 'hold', 'resume', 'skip', 'cancel', 'complete_case')
  ),
  reason text,
  performed_by uuid not null references public.profiles(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (action not in ('return', 'hold', 'skip', 'cancel') or nullif(btrim(reason), '') is not null)
);

create index workflow_transition_events_case_created_idx
  on public.workflow_transition_events(case_id, created_at desc);
create index workflow_transition_events_workflow_idx
  on public.workflow_transition_events(case_workflow_id, created_at);

create table public.case_assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.procurement_cases(id) on delete restrict,
  stage_instance_id uuid not null references public.case_stage_instances(id) on delete restrict,
  assigned_user_id uuid references public.profiles(id) on delete restrict,
  assigned_department_id uuid references public.departments(id) on delete restrict,
  assignment_kind text not null default 'direct'
    check (assignment_kind in ('default', 'direct', 'delegated', 'returned', 'reassigned')),
  reason text,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(assigned_user_id, assigned_department_id) = 1),
  check (unassigned_at is null or unassigned_at >= assigned_at)
);

create unique index case_assignments_one_open_stage_idx
  on public.case_assignments(stage_instance_id) where unassigned_at is null;
create index case_assignments_case_idx on public.case_assignments(case_id, assigned_at);
create index case_assignments_user_idx on public.case_assignments(assigned_user_id, assigned_at)
  where assigned_user_id is not null;
create index case_assignments_department_idx on public.case_assignments(assigned_department_id, assigned_at)
  where assigned_department_id is not null;

create table public.case_responsibility_intervals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.procurement_cases(id) on delete restrict,
  stage_instance_id uuid not null references public.case_stage_instances(id) on delete restrict,
  responsible_user_id uuid references public.profiles(id) on delete restrict,
  responsible_department_id uuid references public.departments(id) on delete restrict,
  started_at timestamptz not null,
  ended_at timestamptz,
  assignment_source text not null
    check (assignment_source in ('default', 'direct', 'delegated', 'returned', 'reassigned')),
  assignment_reason text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (num_nonnulls(responsible_user_id, responsible_department_id) = 1),
  check (ended_at is null or ended_at >= started_at)
);

create unique index case_responsibility_intervals_one_open_stage_idx
  on public.case_responsibility_intervals(stage_instance_id) where ended_at is null;
create index case_responsibility_intervals_case_idx
  on public.case_responsibility_intervals(case_id, started_at);
create index case_responsibility_intervals_user_idx
  on public.case_responsibility_intervals(responsible_user_id, started_at, ended_at)
  where responsible_user_id is not null;
create index case_responsibility_intervals_department_idx
  on public.case_responsibility_intervals(responsible_department_id, started_at, ended_at)
  where responsible_department_id is not null;

create table public.case_activity_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.procurement_cases(id) on delete restrict,
  event_type text not null,
  summary_key text not null,
  actor_id uuid references public.profiles(id) on delete restrict,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index case_activity_events_case_time_idx
  on public.case_activity_events(case_id, occurred_at desc);

create trigger workflow_templates_set_updated_at before update on public.workflow_templates
for each row execute function public.set_updated_at();
create trigger workflow_template_steps_set_updated_at before update on public.workflow_template_steps
for each row execute function public.set_updated_at();
create trigger case_workflows_set_updated_at before update on public.case_workflows
for each row execute function public.set_updated_at();
create trigger case_stage_instances_set_updated_at before update on public.case_stage_instances
for each row execute function public.set_updated_at();

create or replace function public.protect_workflow_template_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'Published workflow versions are immutable' using errcode = '23514';
    end if;
    return old;
  end if;

  if old.status = 'archived' then
    raise exception 'Archived workflow versions are immutable' using errcode = '23514';
  end if;

  if old.status = 'published' then
    if new.status <> 'archived'
      or (to_jsonb(new) - array['status', 'archived_at', 'updated_at'])
        is distinct from
        (to_jsonb(old) - array['status', 'archived_at', 'updated_at']) then
      raise exception 'Published workflow versions are immutable' using errcode = '23514';
    end if;
  end if;

  if old.status = 'draft' and new.status = 'published' then
    if not exists (
      select 1 from public.workflow_template_steps
      where template_id = old.id and is_active
    ) then
      raise exception 'A workflow requires at least one active step' using errcode = '23514';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;

  if new.status = 'archived' then
    new.archived_at := coalesce(new.archived_at, now());
  end if;
  return new;
end;
$$;

create or replace function public.protect_workflow_template_step()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_status text;
  parent_id uuid := coalesce(new.template_id, old.template_id);
begin
  select status into parent_status
  from public.workflow_templates where id = parent_id;
  if parent_status is distinct from 'draft' then
    raise exception 'Only draft workflow steps may be changed' using errcode = '23514';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.protect_case_stage_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Case stage history cannot be deleted' using errcode = '23514';
  end if;
  if old.status in ('completed', 'returned', 'skipped', 'cancelled') then
    raise exception 'Completed case stage history is immutable' using errcode = '23514';
  end if;
  if new.case_workflow_id is distinct from old.case_workflow_id
    or new.case_id is distinct from old.case_id
    or new.template_step_id is distinct from old.template_step_id
    or new.step_key is distinct from old.step_key
    or new.name_en is distinct from old.name_en
    or new.name_th is distinct from old.name_th
    or new.sequence is distinct from old.sequence
    or new.iteration is distinct from old.iteration
    or new.target_days is distinct from old.target_days
    or new.can_skip is distinct from old.can_skip
    or new.created_at is distinct from old.created_at then
    raise exception 'Case stage snapshot fields are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_audit_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit events are immutable' using errcode = '23514';
end;
$$;

create or replace function public.protect_responsibility_interval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' or old.ended_at is not null then
    raise exception 'Responsibility history is immutable' using errcode = '23514';
  end if;
  if new.case_id is distinct from old.case_id
    or new.stage_instance_id is distinct from old.stage_instance_id
    or new.responsible_user_id is distinct from old.responsible_user_id
    or new.responsible_department_id is distinct from old.responsible_department_id
    or new.started_at is distinct from old.started_at
    or new.assignment_source is distinct from old.assignment_source
    or new.created_by is distinct from old.created_by then
    raise exception 'Responsibility attribution fields are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger workflow_templates_protect_version
before update or delete on public.workflow_templates
for each row execute function public.protect_workflow_template_version();
create trigger workflow_template_steps_protect
before insert or update or delete on public.workflow_template_steps
for each row execute function public.protect_workflow_template_step();
create trigger case_stage_instances_protect_history
before update or delete on public.case_stage_instances
for each row execute function public.protect_case_stage_history();
create trigger workflow_transition_events_immutable
before update or delete on public.workflow_transition_events
for each row execute function public.prevent_audit_event_mutation();
create trigger case_activity_events_immutable
before update or delete on public.case_activity_events
for each row execute function public.prevent_audit_event_mutation();
create trigger responsibility_intervals_protect
before update or delete on public.case_responsibility_intervals
for each row execute function public.protect_responsibility_interval();

create or replace function public.close_stage_responsibility(
  target_stage_id uuid,
  closed_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.case_responsibility_intervals
  set ended_at = closed_at
  where stage_instance_id = target_stage_id and ended_at is null;

  update public.case_assignments
  set unassigned_at = closed_at
  where stage_instance_id = target_stage_id and unassigned_at is null;
end;
$$;

create or replace function public.activate_case_stage(
  target_workflow_id uuid,
  target_case_id uuid,
  target_sequence integer,
  source_kind text,
  source_reason text,
  actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_stage public.case_stage_instances%rowtype;
  new_stage_id uuid;
  owner_id uuid;
  user_id uuid;
  department_id uuid;
  now_at timestamptz := now();
begin
  select * into target_stage
  from public.case_stage_instances
  where case_workflow_id = target_workflow_id
    and sequence = target_sequence
    and status = 'pending'
  order by iteration
  limit 1
  for update;

  if target_stage.id is null then
    select * into target_stage
    from public.case_stage_instances
    where case_workflow_id = target_workflow_id and sequence = target_sequence
    order by iteration desc
    limit 1;

    if target_stage.id is null then
      raise exception 'Workflow stage sequence does not exist' using errcode = 'P0002';
    end if;

    insert into public.case_stage_instances (
      case_workflow_id, case_id, template_step_id, step_key, name_en, name_th,
      description_en, description_th, sequence, iteration,
      default_responsible_role_id, default_responsible_department_id,
      target_days, required_document_behavior, can_skip, status
    )
    values (
      target_stage.case_workflow_id, target_stage.case_id, target_stage.template_step_id,
      target_stage.step_key, target_stage.name_en, target_stage.name_th,
      target_stage.description_en, target_stage.description_th, target_stage.sequence,
      target_stage.iteration + 1, target_stage.default_responsible_role_id,
      target_stage.default_responsible_department_id, target_stage.target_days,
      target_stage.required_document_behavior, target_stage.can_skip, 'pending'
    )
    returning id into new_stage_id;
  else
    new_stage_id := target_stage.id;
  end if;

  select case_owner_id into owner_id
  from public.procurement_cases where id = target_case_id;
  department_id := target_stage.default_responsible_department_id;
  user_id := case when department_id is null then owner_id else null end;

  update public.case_stage_instances
  set status = 'active',
      entered_at = now_at,
      due_at = now_at + make_interval(days => target_days),
      responsible_user_id = user_id,
      responsible_department_id = department_id
  where id = new_stage_id;

  update public.procurement_cases
  set current_stage_instance_id = new_stage_id,
      current_responsible_user_id = user_id,
      current_responsible_department_id = department_id
  where id = target_case_id;

  insert into public.case_assignments (
    case_id, stage_instance_id, assigned_user_id, assigned_department_id,
    assignment_kind, reason, assigned_by, assigned_at
  ) values (
    target_case_id, new_stage_id, user_id, department_id,
    source_kind, source_reason, actor_id, now_at
  );

  insert into public.case_responsibility_intervals (
    case_id, stage_instance_id, responsible_user_id, responsible_department_id,
    started_at, assignment_source, assignment_reason, created_by
  ) values (
    target_case_id, new_stage_id, user_id, department_id,
    now_at, source_kind, source_reason, actor_id
  );

  return new_stage_id;
end;
$$;

create or replace function public.start_case_workflow(
  target_case_id uuid,
  selected_template_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  case_record public.procurement_cases%rowtype;
  template_record public.workflow_templates%rowtype;
  workflow_id uuid;
  first_stage_id uuid;
  actor_id uuid := (select auth.uid());
  now_at timestamptz := now();
begin
  if actor_id is null or not public.can_edit_procurement_case(target_case_id) then
    raise exception 'Workflow start is not authorized' using errcode = '42501';
  end if;

  select * into case_record from public.procurement_cases
  where id = target_case_id for update;
  if case_record.status <> 'draft' or case_record.current_stage_instance_id is not null then
    raise exception 'Only a draft case without a workflow may be started' using errcode = '23514';
  end if;

  select * into template_record from public.workflow_templates
  where id = selected_template_id and status = 'published';
  if template_record.id is null or template_record.procurement_type_id <> case_record.procurement_type_id then
    raise exception 'Published workflow does not match procurement type' using errcode = '23514';
  end if;

  insert into public.case_workflows (
    case_id, template_id, template_code, template_version,
    template_name_en, template_name_th, status, started_by, started_at
  ) values (
    target_case_id, template_record.id, template_record.code, template_record.version,
    template_record.name_en, template_record.name_th, 'active', actor_id, now_at
  ) returning id into workflow_id;

  insert into public.case_stage_instances (
    case_workflow_id, case_id, template_step_id, step_key, name_en, name_th,
    description_en, description_th, sequence, iteration,
    default_responsible_role_id, default_responsible_department_id,
    target_days, required_document_behavior, can_skip, status
  )
  select
    workflow_id, target_case_id, id, step_key, name_en, name_th,
    description_en, description_th, sequence, 1,
    default_responsible_role_id, default_responsible_department_id,
    target_days, required_document_behavior, can_skip, 'pending'
  from public.workflow_template_steps
  where template_id = selected_template_id and is_active
  order by sequence;

  first_stage_id := public.activate_case_stage(
    workflow_id, target_case_id, 1, 'default', null, actor_id
  );

  update public.procurement_cases
  set status = 'active', hold_reason = null
  where id = target_case_id;

  insert into public.workflow_transition_events (
    case_id, case_workflow_id, to_stage_instance_id, action, performed_by, created_at
  ) values (
    target_case_id, workflow_id, first_stage_id, 'start', actor_id, now_at
  );
  insert into public.case_activity_events (
    case_id, event_type, summary_key, actor_id, details, occurred_at
  ) values (
    target_case_id, 'workflow_transition', 'workflow.start', actor_id,
    jsonb_build_object('stage_id', first_stage_id), now_at
  );
  return workflow_id;
end;
$$;

create or replace function public.transition_case_workflow(
  target_case_id uuid,
  transition_action text,
  transition_reason text default null,
  target_user_id uuid default null,
  target_department_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  case_record public.procurement_cases%rowtype;
  workflow_record public.case_workflows%rowtype;
  stage_record public.case_stage_instances%rowtype;
  next_stage_id uuid;
  event_id uuid;
  max_sequence integer;
  now_at timestamptz := now();
begin
  if actor_id is null or not public.can_edit_procurement_case(target_case_id) then
    raise exception 'Workflow transition is not authorized' using errcode = '42501';
  end if;
  if transition_action not in ('complete', 'return', 'reassign', 'hold', 'resume', 'skip', 'cancel', 'complete_case') then
    raise exception 'Unsupported workflow transition' using errcode = '23514';
  end if;
  if transition_action in ('return', 'hold', 'skip', 'cancel')
    and nullif(btrim(transition_reason), '') is null then
    raise exception 'This workflow action requires a reason' using errcode = '23514';
  end if;

  select * into case_record from public.procurement_cases
  where id = target_case_id for update;
  select * into workflow_record from public.case_workflows
  where case_id = target_case_id and status = 'active' for update;
  select * into stage_record from public.case_stage_instances
  where case_id = target_case_id and status = 'active' for update;
  if workflow_record.id is null or stage_record.id is null then
    raise exception 'Active workflow stage was not found' using errcode = 'P0002';
  end if;

  if transition_action = 'hold' then
    if case_record.status <> 'active' then
      raise exception 'Only an active case may be put on hold' using errcode = '23514';
    end if;
    update public.procurement_cases
    set status = 'on_hold', hold_reason = transition_reason
    where id = target_case_id;
    next_stage_id := stage_record.id;
  elsif transition_action = 'resume' then
    if case_record.status <> 'on_hold' then
      raise exception 'Only an on-hold case may be resumed' using errcode = '23514';
    end if;
    update public.procurement_cases
    set status = 'active', hold_reason = null
    where id = target_case_id;
    next_stage_id := stage_record.id;
  elsif transition_action = 'reassign' then
    if num_nonnulls(target_user_id, target_department_id) <> 1 then
      raise exception 'Reassignment requires exactly one responsible party' using errcode = '23514';
    end if;
    perform public.close_stage_responsibility(stage_record.id, now_at);
    update public.case_stage_instances
    set responsible_user_id = target_user_id,
        responsible_department_id = target_department_id
    where id = stage_record.id;
    update public.procurement_cases
    set current_responsible_user_id = target_user_id,
        current_responsible_department_id = target_department_id
    where id = target_case_id;
    insert into public.case_assignments (
      case_id, stage_instance_id, assigned_user_id, assigned_department_id,
      assignment_kind, reason, assigned_by, assigned_at
    ) values (
      target_case_id, stage_record.id, target_user_id, target_department_id,
      'reassigned', transition_reason, actor_id, now_at
    );
    insert into public.case_responsibility_intervals (
      case_id, stage_instance_id, responsible_user_id, responsible_department_id,
      started_at, assignment_source, assignment_reason, created_by
    ) values (
      target_case_id, stage_record.id, target_user_id, target_department_id,
      now_at, 'reassigned', transition_reason, actor_id
    );
    next_stage_id := stage_record.id;
  else
    if case_record.status = 'on_hold' then
      raise exception 'Resume the case before changing its stage' using errcode = '23514';
    end if;
    if transition_action = 'skip' and not stage_record.can_skip then
      raise exception 'This stage cannot be skipped' using errcode = '23514';
    end if;
    if transition_action = 'return' and stage_record.sequence = 1 then
      raise exception 'The first stage cannot be returned' using errcode = '23514';
    end if;

    perform public.close_stage_responsibility(stage_record.id, now_at);
    update public.case_stage_instances
    set status = case
          when transition_action = 'return' then 'returned'
          when transition_action = 'skip' then 'skipped'
          when transition_action = 'cancel' then 'cancelled'
          else 'completed'
        end,
        completed_at = now_at,
        completed_by = actor_id
    where id = stage_record.id;

    select max(sequence) into max_sequence
    from public.case_stage_instances where case_workflow_id = workflow_record.id;

    if transition_action = 'cancel' then
      update public.case_stage_instances
      set status = 'cancelled', completed_at = now_at, completed_by = actor_id
      where case_workflow_id = workflow_record.id and status = 'pending';
      update public.case_workflows
      set status = 'cancelled', cancelled_at = now_at
      where id = workflow_record.id;
      update public.procurement_cases
      set status = 'cancelled', cancellation_reason = transition_reason,
          current_stage_instance_id = null,
          current_responsible_user_id = null,
          current_responsible_department_id = null
      where id = target_case_id;
      next_stage_id := null;
    elsif transition_action = 'return' then
      next_stage_id := public.activate_case_stage(
        workflow_record.id, target_case_id, stage_record.sequence - 1,
        'returned', transition_reason, actor_id
      );
    elsif transition_action = 'complete_case' then
      if stage_record.sequence <> max_sequence then
        raise exception 'Complete case is allowed only at the final stage' using errcode = '23514';
      end if;
      update public.case_workflows
      set status = 'completed', completed_at = now_at where id = workflow_record.id;
      update public.procurement_cases
      set status = 'completed', completed_at = now_at,
          current_stage_instance_id = null,
          current_responsible_user_id = null,
          current_responsible_department_id = null
      where id = target_case_id;
      next_stage_id := null;
    elsif stage_record.sequence = max_sequence then
      update public.case_workflows
      set status = 'completed', completed_at = now_at where id = workflow_record.id;
      update public.procurement_cases
      set status = 'completed', completed_at = now_at,
          current_stage_instance_id = null,
          current_responsible_user_id = null,
          current_responsible_department_id = null
      where id = target_case_id;
      next_stage_id := null;
    else
      next_stage_id := public.activate_case_stage(
        workflow_record.id, target_case_id, stage_record.sequence + 1,
        'default', transition_reason, actor_id
      );
    end if;
  end if;

  insert into public.workflow_transition_events (
    case_id, case_workflow_id, from_stage_instance_id, to_stage_instance_id,
    action, reason, performed_by, created_at
  ) values (
    target_case_id, workflow_record.id, stage_record.id, next_stage_id,
    transition_action, nullif(btrim(transition_reason), ''), actor_id, now_at
  ) returning id into event_id;
  insert into public.case_activity_events (
    case_id, event_type, summary_key, actor_id, details, occurred_at
  ) values (
    target_case_id, 'workflow_transition', 'workflow.' || transition_action,
    actor_id, jsonb_build_object(
      'event_id', event_id,
      'from_stage_id', stage_record.id,
      'to_stage_id', next_stage_id
    ), now_at
  );
  return event_id;
end;
$$;

create or replace function public.duplicate_workflow_template(source_template_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  source public.workflow_templates%rowtype;
  new_id uuid;
  new_version integer;
  actor_id uuid := (select auth.uid());
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
  return new_id;
end;
$$;

create or replace function public.reorder_workflow_steps(
  target_template_id uuid,
  ordered_step_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  expected_count integer;
begin
  if actor_id is null or not public.has_any_role(array['super_admin']) then
    raise exception 'Workflow administration is not authorized' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.workflow_templates
    where id = target_template_id and status = 'draft'
    for update
  ) then
    raise exception 'Only draft workflow steps may be reordered' using errcode = '23514';
  end if;
  select count(*) into expected_count
  from public.workflow_template_steps where template_id = target_template_id;
  if cardinality(ordered_step_ids) <> expected_count
    or (
      select count(distinct value) from unnest(ordered_step_ids) value
    ) <> expected_count
    or exists (
      select 1 from unnest(ordered_step_ids) value
      where not exists (
        select 1 from public.workflow_template_steps
        where id = value and template_id = target_template_id
      )
    ) then
    raise exception 'Step order must include every template step exactly once' using errcode = '23514';
  end if;

  update public.workflow_template_steps
  set sequence = sequence + 1000000
  where template_id = target_template_id;

  update public.workflow_template_steps step
  set sequence = ordered.position
  from unnest(ordered_step_ids) with ordinality ordered(id, position)
  where step.id = ordered.id and step.template_id = target_template_id;
end;
$$;

revoke all on function public.protect_workflow_template_version() from public;
revoke all on function public.protect_workflow_template_step() from public;
revoke all on function public.protect_case_stage_history() from public;
revoke all on function public.prevent_audit_event_mutation() from public;
revoke all on function public.protect_responsibility_interval() from public;
revoke all on function public.close_stage_responsibility(uuid, timestamptz) from public;
revoke all on function public.activate_case_stage(uuid, uuid, integer, text, text, uuid) from public;
revoke all on function public.start_case_workflow(uuid, uuid) from public;
revoke all on function public.transition_case_workflow(uuid, text, text, uuid, uuid) from public;
revoke all on function public.duplicate_workflow_template(uuid) from public;
revoke all on function public.reorder_workflow_steps(uuid, uuid[]) from public;
grant execute on function public.start_case_workflow(uuid, uuid) to authenticated;
grant execute on function public.transition_case_workflow(uuid, text, text, uuid, uuid) to authenticated;
grant execute on function public.duplicate_workflow_template(uuid) to authenticated;
grant execute on function public.reorder_workflow_steps(uuid, uuid[]) to authenticated;

alter table public.workflow_templates enable row level security;
alter table public.workflow_template_steps enable row level security;
alter table public.case_workflows enable row level security;
alter table public.case_stage_instances enable row level security;
alter table public.workflow_transition_events enable row level security;
alter table public.case_assignments enable row level security;
alter table public.case_responsibility_intervals enable row level security;
alter table public.case_activity_events enable row level security;

revoke all on table public.workflow_templates, public.workflow_template_steps,
  public.case_workflows, public.case_stage_instances, public.workflow_transition_events,
  public.case_assignments, public.case_responsibility_intervals,
  public.case_activity_events from anon;
grant select on table public.workflow_templates, public.workflow_template_steps,
  public.case_workflows, public.case_stage_instances, public.workflow_transition_events,
  public.case_assignments, public.case_responsibility_intervals,
  public.case_activity_events to authenticated;
grant insert, update, delete on table public.workflow_templates,
  public.workflow_template_steps to authenticated;

create policy workflow_templates_read on public.workflow_templates for select to authenticated
using (
  public.is_active_user()
  and (status in ('published', 'archived') or public.has_any_role(array['super_admin']))
);
create policy workflow_templates_admin_write on public.workflow_templates for all to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));
create policy workflow_template_steps_read on public.workflow_template_steps for select to authenticated
using (
  public.is_active_user()
  and exists (
    select 1 from public.workflow_templates wt
    where wt.id = template_id
      and (wt.status in ('published', 'archived') or public.has_any_role(array['super_admin']))
  )
);
create policy workflow_template_steps_admin_write on public.workflow_template_steps for all to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));

create policy case_workflows_read on public.case_workflows for select to authenticated
using (public.can_view_procurement_case(case_id));
create policy case_stage_instances_read on public.case_stage_instances for select to authenticated
using (public.can_view_procurement_case(case_id));
create policy workflow_transition_events_read on public.workflow_transition_events for select to authenticated
using (public.can_view_procurement_case(case_id));
create policy case_assignments_read on public.case_assignments for select to authenticated
using (public.can_view_procurement_case(case_id));
create policy case_responsibility_intervals_read on public.case_responsibility_intervals for select to authenticated
using (public.can_view_procurement_case(case_id));
create policy case_activity_events_read on public.case_activity_events for select to authenticated
using (public.can_view_procurement_case(case_id));

comment on table public.case_stage_instances is
  'Immutable case-specific stage snapshots. Returns create a new iteration instead of reopening history.';
comment on table public.case_responsibility_intervals is
  'Continuous historical responsibility periods used for auditable personnel KPI attribution.';
comment on function public.transition_case_workflow(uuid, text, text, uuid, uuid) is
  'Transactional workflow transition entry point; validates state, reasons, history, responsibility, and audit events.';
