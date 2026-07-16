-- Phase 1: core procurement cases, category details, authorization, and audit-safe invariants.

create sequence public.procurement_case_number_seq;

create table public.procurement_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  title text not null check (btrim(title) <> ''),
  description text,
  work_category_id uuid not null references public.work_categories(id) on delete restrict,
  requesting_department_id uuid not null references public.departments(id) on delete restrict,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete restrict,
  budget_category_id uuid not null references public.budget_categories(id) on delete restrict,
  budget_source_id uuid not null references public.budget_sources(id) on delete restrict,
  estimated_value numeric(16, 2) not null check (estimated_value >= 0),
  final_value numeric(16, 2) check (final_value is null or final_value >= 0),
  procurement_type_id uuid not null references public.procurement_types(id) on delete restrict,
  priority text not null default 'normal' check (priority in ('normal', 'urgent', 'critical')),
  case_owner_id uuid not null references public.profiles(id) on delete restrict,
  current_responsible_user_id uuid references public.profiles(id) on delete restrict,
  current_responsible_department_id uuid references public.departments(id) on delete restrict,
  target_completion_date date,
  status text not null default 'draft' check (status in ('draft', 'active', 'on_hold', 'completed', 'cancelled')),
  hold_reason text,
  cancellation_reason text,
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(current_responsible_user_id, current_responsible_department_id) <= 1),
  check (status <> 'on_hold' or nullif(btrim(hold_reason), '') is not null),
  check (status <> 'cancelled' or nullif(btrim(cancellation_reason), '') is not null),
  check (status <> 'completed' or completed_at is not null)
);

create table public.medical_device_case_details (
  case_id uuid primary key references public.procurement_cases(id) on delete restrict,
  item_name text not null check (btrim(item_name) <> ''),
  quantity integer not null check (quantity > 0),
  unit text not null check (btrim(unit) <> ''),
  estimated_unit_price numeric(16, 2) not null check (estimated_unit_price >= 0),
  intended_use text not null check (btrim(intended_use) <> ''),
  device_classification text not null check (btrim(device_classification) <> ''),
  is_reusable boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medical_equipment_case_details (
  case_id uuid primary key references public.procurement_cases(id) on delete restrict,
  equipment_name text not null check (btrim(equipment_name) <> ''),
  quantity integer not null check (quantity > 0),
  purchase_kind text not null check (purchase_kind in ('new_purchase', 'replacement')),
  installation_location text not null check (btrim(installation_location) <> ''),
  replaced_asset_reference text,
  expected_installation_date date,
  warranty_required boolean not null default true,
  maintenance_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (purchase_kind <> 'replacement' or nullif(btrim(replaced_asset_reference), '') is not null)
);

create table public.service_contract_case_details (
  case_id uuid primary key references public.procurement_cases(id) on delete restrict,
  scope_of_service text not null check (btrim(scope_of_service) <> ''),
  contract_start_date date not null,
  contract_end_date date not null,
  is_recurring boolean not null default false,
  existing_contract_number text,
  current_provider text,
  renewal_notification_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (contract_end_date >= contract_start_date),
  check (renewal_notification_date is null or renewal_notification_date <= contract_end_date)
);

create index procurement_cases_status_idx on public.procurement_cases(status);
create index procurement_cases_work_category_idx on public.procurement_cases(work_category_id);
create index procurement_cases_procurement_type_idx on public.procurement_cases(procurement_type_id);
create index procurement_cases_fiscal_year_idx on public.procurement_cases(fiscal_year_id);
create index procurement_cases_owner_idx on public.procurement_cases(case_owner_id);
create index procurement_cases_responsible_user_idx on public.procurement_cases(current_responsible_user_id)
  where current_responsible_user_id is not null;
create index procurement_cases_responsible_department_idx on public.procurement_cases(current_responsible_department_id)
  where current_responsible_department_id is not null;
create index procurement_cases_created_at_idx on public.procurement_cases(created_at desc);
create index procurement_cases_search_idx on public.procurement_cases using gin (
  to_tsvector('simple', case_number || ' ' || title || ' ' || coalesce(description, ''))
);

create or replace function public.assign_procurement_case_number()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  case_year integer;
begin
  if nullif(btrim(new.case_number), '') is null then
    case_year := extract(year from coalesce(new.created_at, now()))::integer;
    new.case_number := format(
      'PRC-%s-%s',
      case_year,
      lpad(nextval('public.procurement_case_number_seq')::text, 6, '0')
    );
  end if;

  return new;
end;
$$;

create or replace function public.protect_procurement_case_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.case_number is distinct from old.case_number
    or new.work_category_id is distinct from old.work_category_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Case identity and accountability fields are immutable' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_case_detail_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.procurement_cases pc
    join public.work_categories wc on wc.id = pc.work_category_id
    where pc.id = new.case_id and wc.code = tg_argv[0]
  ) then
    raise exception 'Case detail does not match work category' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.validate_active_case_master_data()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.work_category_id is distinct from old.work_category_id)
    and not exists (select 1 from public.work_categories where id = new.work_category_id and is_active) then
    raise exception 'Work category is inactive or unavailable' using errcode = '23514';
  end if;
  if (tg_op = 'INSERT' or new.requesting_department_id is distinct from old.requesting_department_id)
    and not exists (select 1 from public.departments where id = new.requesting_department_id and is_active) then
    raise exception 'Requesting department is inactive or unavailable' using errcode = '23514';
  end if;
  if (tg_op = 'INSERT' or new.fiscal_year_id is distinct from old.fiscal_year_id)
    and not exists (select 1 from public.fiscal_years where id = new.fiscal_year_id and is_active) then
    raise exception 'Fiscal year is inactive or unavailable' using errcode = '23514';
  end if;
  if (tg_op = 'INSERT' or new.budget_category_id is distinct from old.budget_category_id)
    and not exists (select 1 from public.budget_categories where id = new.budget_category_id and is_active) then
    raise exception 'Budget category is inactive or unavailable' using errcode = '23514';
  end if;
  if (tg_op = 'INSERT' or new.budget_source_id is distinct from old.budget_source_id)
    and not exists (select 1 from public.budget_sources where id = new.budget_source_id and is_active) then
    raise exception 'Budget source is inactive or unavailable' using errcode = '23514';
  end if;
  if (tg_op = 'INSERT' or new.procurement_type_id is distinct from old.procurement_type_id)
    and not exists (select 1 from public.procurement_types where id = new.procurement_type_id and is_active) then
    raise exception 'Procurement type is inactive or unavailable' using errcode = '23514';
  end if;
  if (tg_op = 'INSERT' or new.case_owner_id is distinct from old.case_owner_id)
    and not exists (select 1 from public.profiles where id = new.case_owner_id and is_active) then
    raise exception 'Case owner is inactive or unavailable' using errcode = '23514';
  end if;
  if new.current_responsible_user_id is not null
    and (tg_op = 'INSERT' or new.current_responsible_user_id is distinct from old.current_responsible_user_id)
    and not exists (select 1 from public.profiles where id = new.current_responsible_user_id and is_active) then
    raise exception 'Responsible user is inactive or unavailable' using errcode = '23514';
  end if;

  return new;
end;
$$;

-- JSON is used only as an RPC transport. Canonical case and detail data remain in
-- constrained relational columns. The function is security-invoker, so RLS is
-- evaluated for the caller and the case/detail inserts commit atomically.
create or replace function public.create_procurement_case(case_data jsonb, detail_data jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_case_id uuid;
  category_id uuid;
  category_code text := case_data ->> 'work_category';
begin
  select id into category_id
  from public.work_categories
  where code = category_code and is_active;

  if category_id is null then
    raise exception 'Work category is inactive or unavailable' using errcode = '23514';
  end if;

  insert into public.procurement_cases (
    case_number, title, description, work_category_id, requesting_department_id,
    fiscal_year_id, budget_category_id, budget_source_id, estimated_value,
    final_value, procurement_type_id, priority, case_owner_id,
    current_responsible_user_id, current_responsible_department_id,
    target_completion_date, status, created_by
  )
  values (
    '', case_data ->> 'title', nullif(case_data ->> 'description', ''), category_id,
    (case_data ->> 'requesting_department_id')::uuid,
    (case_data ->> 'fiscal_year_id')::uuid,
    (case_data ->> 'budget_category_id')::uuid,
    (case_data ->> 'budget_source_id')::uuid,
    (case_data ->> 'estimated_value')::numeric,
    nullif(case_data ->> 'final_value', '')::numeric,
    (case_data ->> 'procurement_type_id')::uuid,
    case_data ->> 'priority',
    (case_data ->> 'case_owner_id')::uuid,
    nullif(case_data ->> 'current_responsible_user_id', '')::uuid,
    nullif(case_data ->> 'current_responsible_department_id', '')::uuid,
    nullif(case_data ->> 'target_completion_date', '')::date,
    'draft',
    (select auth.uid())
  )
  returning id into new_case_id;

  if category_code = 'medical_device' then
    insert into public.medical_device_case_details (
      case_id, item_name, quantity, unit, estimated_unit_price,
      intended_use, device_classification, is_reusable
    ) values (
      new_case_id, detail_data ->> 'item_name', (detail_data ->> 'quantity')::integer,
      detail_data ->> 'unit', (detail_data ->> 'estimated_unit_price')::numeric,
      detail_data ->> 'intended_use', detail_data ->> 'device_classification',
      (detail_data ->> 'is_reusable')::boolean
    );
  elsif category_code = 'medical_equipment' then
    insert into public.medical_equipment_case_details (
      case_id, equipment_name, quantity, purchase_kind, installation_location,
      replaced_asset_reference, expected_installation_date,
      warranty_required, maintenance_required
    ) values (
      new_case_id, detail_data ->> 'equipment_name', (detail_data ->> 'quantity')::integer,
      detail_data ->> 'purchase_kind', detail_data ->> 'installation_location',
      nullif(detail_data ->> 'replaced_asset_reference', ''),
      nullif(detail_data ->> 'expected_installation_date', '')::date,
      (detail_data ->> 'warranty_required')::boolean,
      (detail_data ->> 'maintenance_required')::boolean
    );
  elsif category_code = 'service_contract' then
    insert into public.service_contract_case_details (
      case_id, scope_of_service, contract_start_date, contract_end_date,
      is_recurring, existing_contract_number, current_provider,
      renewal_notification_date
    ) values (
      new_case_id, detail_data ->> 'scope_of_service',
      (detail_data ->> 'contract_start_date')::date,
      (detail_data ->> 'contract_end_date')::date,
      (detail_data ->> 'is_recurring')::boolean,
      nullif(detail_data ->> 'existing_contract_number', ''),
      nullif(detail_data ->> 'current_provider', ''),
      nullif(detail_data ->> 'renewal_notification_date', '')::date
    );
  else
    raise exception 'Unsupported work category' using errcode = '23514';
  end if;

  return new_case_id;
end;
$$;

create or replace function public.update_procurement_case(
  target_case_id uuid,
  case_data jsonb,
  detail_data jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  category_code text;
begin
  select wc.code into category_code
  from public.procurement_cases pc
  join public.work_categories wc on wc.id = pc.work_category_id
  where pc.id = target_case_id;

  if category_code is null then
    raise exception 'Case not found' using errcode = 'P0002';
  end if;

  update public.procurement_cases
  set title = case_data ->> 'title',
      description = nullif(case_data ->> 'description', ''),
      requesting_department_id = (case_data ->> 'requesting_department_id')::uuid,
      fiscal_year_id = (case_data ->> 'fiscal_year_id')::uuid,
      budget_category_id = (case_data ->> 'budget_category_id')::uuid,
      budget_source_id = (case_data ->> 'budget_source_id')::uuid,
      estimated_value = (case_data ->> 'estimated_value')::numeric,
      final_value = nullif(case_data ->> 'final_value', '')::numeric,
      procurement_type_id = (case_data ->> 'procurement_type_id')::uuid,
      priority = case_data ->> 'priority',
      case_owner_id = (case_data ->> 'case_owner_id')::uuid,
      current_responsible_user_id = nullif(case_data ->> 'current_responsible_user_id', '')::uuid,
      current_responsible_department_id = nullif(case_data ->> 'current_responsible_department_id', '')::uuid,
      target_completion_date = nullif(case_data ->> 'target_completion_date', '')::date
  where id = target_case_id;

  if not found then
    raise exception 'Case update was not authorized' using errcode = '42501';
  end if;

  if category_code = 'medical_device' then
    update public.medical_device_case_details
    set item_name = detail_data ->> 'item_name',
        quantity = (detail_data ->> 'quantity')::integer,
        unit = detail_data ->> 'unit',
        estimated_unit_price = (detail_data ->> 'estimated_unit_price')::numeric,
        intended_use = detail_data ->> 'intended_use',
        device_classification = detail_data ->> 'device_classification',
        is_reusable = (detail_data ->> 'is_reusable')::boolean
    where case_id = target_case_id;
  elsif category_code = 'medical_equipment' then
    update public.medical_equipment_case_details
    set equipment_name = detail_data ->> 'equipment_name',
        quantity = (detail_data ->> 'quantity')::integer,
        purchase_kind = detail_data ->> 'purchase_kind',
        installation_location = detail_data ->> 'installation_location',
        replaced_asset_reference = nullif(detail_data ->> 'replaced_asset_reference', ''),
        expected_installation_date = nullif(detail_data ->> 'expected_installation_date', '')::date,
        warranty_required = (detail_data ->> 'warranty_required')::boolean,
        maintenance_required = (detail_data ->> 'maintenance_required')::boolean
    where case_id = target_case_id;
  elsif category_code = 'service_contract' then
    update public.service_contract_case_details
    set scope_of_service = detail_data ->> 'scope_of_service',
        contract_start_date = (detail_data ->> 'contract_start_date')::date,
        contract_end_date = (detail_data ->> 'contract_end_date')::date,
        is_recurring = (detail_data ->> 'is_recurring')::boolean,
        existing_contract_number = nullif(detail_data ->> 'existing_contract_number', ''),
        current_provider = nullif(detail_data ->> 'current_provider', ''),
        renewal_notification_date = nullif(detail_data ->> 'renewal_notification_date', '')::date
    where case_id = target_case_id;
  end if;

  return target_case_id;
end;
$$;

create trigger procurement_cases_assign_number
before insert on public.procurement_cases
for each row execute function public.assign_procurement_case_number();
create trigger procurement_cases_protect_identity
before update on public.procurement_cases
for each row execute function public.protect_procurement_case_identity();
create trigger procurement_cases_validate_master_data
before insert or update on public.procurement_cases
for each row execute function public.validate_active_case_master_data();
create trigger procurement_cases_set_updated_at
before update on public.procurement_cases
for each row execute function public.set_updated_at();
create trigger medical_device_details_set_updated_at
before update on public.medical_device_case_details
for each row execute function public.set_updated_at();
create trigger medical_equipment_details_set_updated_at
before update on public.medical_equipment_case_details
for each row execute function public.set_updated_at();
create trigger service_contract_details_set_updated_at
before update on public.service_contract_case_details
for each row execute function public.set_updated_at();
create trigger medical_device_details_category
before insert or update on public.medical_device_case_details
for each row execute function public.enforce_case_detail_category('medical_device');
create trigger medical_equipment_details_category
before insert or update on public.medical_equipment_case_details
for each row execute function public.enforce_case_detail_category('medical_equipment');
create trigger service_contract_details_category
before insert or update on public.service_contract_case_details
for each row execute function public.enforce_case_detail_category('service_contract');

-- The helpers are used by both RLS policies and server actions. Officers may edit
-- only cases they own or cases where they are the current responsible user.
create or replace function public.can_view_procurement_case(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_any_role(array[
    'super_admin', 'procurement_manager', 'procurement_officer', 'viewer_auditor'
  ]) and exists (
    select 1 from public.procurement_cases where id = target_case_id
  );
$$;

create or replace function public.can_edit_procurement_case(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.procurement_cases pc
    where pc.id = target_case_id
      and (
        public.has_any_role(array['super_admin'])
        or public.has_any_role(array['procurement_manager'])
        or (
          pc.status not in ('completed', 'cancelled')
          and public.has_any_role(array['procurement_officer'])
          and (pc.case_owner_id = (select auth.uid()) or pc.current_responsible_user_id = (select auth.uid()))
        )
      )
  );
$$;

revoke all on function public.assign_procurement_case_number() from public;
revoke all on function public.protect_procurement_case_identity() from public;
revoke all on function public.enforce_case_detail_category() from public;
revoke all on function public.validate_active_case_master_data() from public;
revoke all on function public.create_procurement_case(jsonb, jsonb) from public;
revoke all on function public.update_procurement_case(uuid, jsonb, jsonb) from public;
revoke all on function public.can_view_procurement_case(uuid) from public;
revoke all on function public.can_edit_procurement_case(uuid) from public;
grant execute on function public.can_view_procurement_case(uuid) to authenticated;
grant execute on function public.can_edit_procurement_case(uuid) to authenticated;
grant execute on function public.create_procurement_case(jsonb, jsonb) to authenticated;
grant execute on function public.update_procurement_case(uuid, jsonb, jsonb) to authenticated;

alter table public.procurement_cases enable row level security;
alter table public.medical_device_case_details enable row level security;
alter table public.medical_equipment_case_details enable row level security;
alter table public.service_contract_case_details enable row level security;

revoke all on table public.procurement_cases, public.medical_device_case_details,
  public.medical_equipment_case_details, public.service_contract_case_details from anon;
grant select, insert, update on table public.procurement_cases,
  public.medical_device_case_details, public.medical_equipment_case_details,
  public.service_contract_case_details to authenticated;
grant usage, select on sequence public.procurement_case_number_seq to authenticated;

create policy procurement_cases_read on public.procurement_cases for select to authenticated
using (public.has_any_role(array['super_admin', 'procurement_manager', 'procurement_officer', 'viewer_auditor']));
create policy procurement_cases_create on public.procurement_cases for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    public.has_any_role(array['super_admin', 'procurement_manager'])
    or (
      public.has_any_role(array['procurement_officer'])
      and case_owner_id = (select auth.uid())
    )
  )
);
create policy procurement_cases_update on public.procurement_cases for update to authenticated
using (public.can_edit_procurement_case(id))
with check (public.can_edit_procurement_case(id));

create policy medical_device_details_read on public.medical_device_case_details for select to authenticated
using (public.can_view_procurement_case(case_id));
create policy medical_device_details_create on public.medical_device_case_details for insert to authenticated
with check (public.can_edit_procurement_case(case_id));
create policy medical_device_details_update on public.medical_device_case_details for update to authenticated
using (public.can_edit_procurement_case(case_id))
with check (public.can_edit_procurement_case(case_id));

create policy medical_equipment_details_read on public.medical_equipment_case_details for select to authenticated
using (public.can_view_procurement_case(case_id));
create policy medical_equipment_details_create on public.medical_equipment_case_details for insert to authenticated
with check (public.can_edit_procurement_case(case_id));
create policy medical_equipment_details_update on public.medical_equipment_case_details for update to authenticated
using (public.can_edit_procurement_case(case_id))
with check (public.can_edit_procurement_case(case_id));

create policy service_contract_details_read on public.service_contract_case_details for select to authenticated
using (public.can_view_procurement_case(case_id));
create policy service_contract_details_create on public.service_contract_case_details for insert to authenticated
with check (public.can_edit_procurement_case(case_id));
create policy service_contract_details_update on public.service_contract_case_details for update to authenticated
using (public.can_edit_procurement_case(case_id))
with check (public.can_edit_procurement_case(case_id));

-- Officers need names for ownership and responsibility displays. Sensitive role
-- membership remains governed by the narrower Phase 0 user_roles policy.
drop policy profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
using (
  public.has_any_role(array['super_admin', 'procurement_manager', 'procurement_officer', 'viewer_auditor'])
);

comment on table public.procurement_cases is
  'Shared procurement case record. Case ownership and current responsibility are intentionally separate.';
comment on function public.assign_procurement_case_number() is
  'Generates collision-safe server-side case numbers in PRC-YYYY-000123 format.';
comment on function public.can_edit_procurement_case(uuid) is
  'Central case authorization used by RLS and mirrored by server-side permission checks.';
