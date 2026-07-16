-- Phase 0 foundation: bilingual master data, profiles, roles, and secure access.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('super_admin', 'procurement_manager', 'procurement_officer', 'viewer_auditor')),
  name_en text not null check (btrim(name_en) <> ''),
  name_th text not null check (btrim(name_th) <> ''),
  description_en text,
  description_th text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_]*$'),
  name_en text not null check (btrim(name_en) <> ''),
  name_th text not null check (btrim(name_th) <> ''),
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_active and archived_at is null) or (not is_active))
);

create table public.work_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('medical_device', 'medical_equipment', 'service_contract')),
  name_en text not null check (btrim(name_en) <> ''),
  name_th text not null check (btrim(name_th) <> ''),
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_active and archived_at is null) or (not is_active))
);

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_]*$'),
  name_en text not null check (btrim(name_en) <> ''),
  name_th text not null check (btrim(name_th) <> ''),
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_active and archived_at is null) or (not is_active))
);

create table public.budget_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_]*$'),
  name_en text not null check (btrim(name_en) <> ''),
  name_th text not null check (btrim(name_th) <> ''),
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_active and archived_at is null) or (not is_active))
);

create table public.procurement_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_]*$'),
  name_en text not null check (btrim(name_en) <> ''),
  name_th text not null check (btrim(name_th) <> ''),
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_active and archived_at is null) or (not is_active))
);

create table public.fiscal_years (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^FY[0-9]{4}$'),
  year integer not null unique check (year between 2000 and 2200),
  name_en text not null check (btrim(name_en) <> ''),
  name_th text not null check (btrim(name_th) <> ''),
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  check ((is_active and archived_at is null) or (not is_active))
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  email text not null unique,
  full_name text not null check (btrim(full_name) <> ''),
  employee_code text unique,
  department_id uuid references public.departments(id) on delete restrict,
  locale text not null default 'en' check (locale in ('en', 'th')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_department_id_idx on public.profiles(department_id);
create index profiles_active_idx on public.profiles(is_active) where is_active;

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create index user_roles_role_id_idx on public.user_roles(role_id);

create trigger roles_set_updated_at before update on public.roles
for each row execute function public.set_updated_at();
create trigger departments_set_updated_at before update on public.departments
for each row execute function public.set_updated_at();
create trigger work_categories_set_updated_at before update on public.work_categories
for each row execute function public.set_updated_at();
create trigger budget_categories_set_updated_at before update on public.budget_categories
for each row execute function public.set_updated_at();
create trigger budget_sources_set_updated_at before update on public.budget_sources
for each row execute function public.set_updated_at();
create trigger procurement_types_set_updated_at before update on public.procurement_types
for each row execute function public.set_updated_at();
create trigger fiscal_years_set_updated_at before update on public.fiscal_years
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- Create or synchronize the application profile when Supabase Auth creates a user.
create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null then
    raise exception 'ProcureFlow requires an email address';
  end if;

  insert into public.profiles (id, email, full_name, locale)
  values (
    new.id,
    new.email,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'locale' in ('en', 'th') then new.raw_user_meta_data ->> 'locale' else 'en' end
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_changed
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_auth_user();

-- Security-definer helpers avoid recursive RLS checks in policies.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active
  );
$$;

create or replace function public.has_any_role(required_codes text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = (select auth.uid())
      and r.code = any(required_codes)
      and r.is_active
      and p.is_active
  );
$$;

-- Users may update their display name and locale, but security/accountability fields
-- remain immutable unless a super administrator performs the update.
create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.has_any_role(array['super_admin']) then
    return new;
  end if;

  if old.id <> (select auth.uid())
    or new.id is distinct from old.id
    or new.email is distinct from old.email
    or new.employee_code is distinct from old.employee_code
    or new.department_id is distinct from old.department_id
    or new.is_active is distinct from old.is_active
    or new.created_at is distinct from old.created_at then
    raise exception 'Profile security fields cannot be changed' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_security_fields
before update on public.profiles
for each row execute function public.protect_profile_security_fields();

revoke all on function public.is_active_user() from public;
revoke all on function public.has_any_role(text[]) from public;
revoke all on function public.protect_profile_security_fields() from public;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.has_any_role(text[]) to authenticated;

alter table public.roles enable row level security;
alter table public.departments enable row level security;
alter table public.work_categories enable row level security;
alter table public.budget_categories enable row level security;
alter table public.budget_sources enable row level security;
alter table public.procurement_types enable row level security;
alter table public.fiscal_years enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

revoke all on table public.roles, public.departments, public.work_categories,
  public.budget_categories, public.budget_sources, public.procurement_types,
  public.fiscal_years, public.profiles, public.user_roles from anon;

grant select, insert, update, delete on table public.roles, public.departments,
  public.work_categories, public.budget_categories, public.budget_sources,
  public.procurement_types, public.fiscal_years to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, delete on table public.user_roles to authenticated;

create policy roles_read on public.roles for select to authenticated
using (public.is_active_user());
create policy roles_admin_write on public.roles for all to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));

create policy departments_read on public.departments for select to authenticated
using (public.is_active_user());
create policy departments_admin_write on public.departments for all to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));

create policy work_categories_read on public.work_categories for select to authenticated
using (public.is_active_user());
create policy work_categories_admin_write on public.work_categories for all to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));

create policy budget_categories_read on public.budget_categories for select to authenticated
using (public.is_active_user());
create policy budget_categories_admin_write on public.budget_categories for all to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));

create policy budget_sources_read on public.budget_sources for select to authenticated
using (public.is_active_user());
create policy budget_sources_admin_write on public.budget_sources for all to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));

create policy procurement_types_read on public.procurement_types for select to authenticated
using (public.is_active_user());
create policy procurement_types_admin_write on public.procurement_types for all to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));

create policy fiscal_years_read on public.fiscal_years for select to authenticated
using (public.is_active_user());
create policy fiscal_years_admin_write on public.fiscal_years for all to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));

create policy profiles_read on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or public.has_any_role(array['super_admin', 'procurement_manager', 'viewer_auditor'])
);
create policy profiles_update_own on public.profiles for update to authenticated
using (id = (select auth.uid()) and public.is_active_user())
with check (id = (select auth.uid()));
create policy profiles_admin_update on public.profiles for update to authenticated
using (public.has_any_role(array['super_admin']))
with check (public.has_any_role(array['super_admin']));

create policy user_roles_read on public.user_roles for select to authenticated
using (
  user_id = (select auth.uid())
  or public.has_any_role(array['super_admin', 'procurement_manager', 'viewer_auditor'])
);
create policy user_roles_admin_insert on public.user_roles for insert to authenticated
with check (public.has_any_role(array['super_admin']));
create policy user_roles_admin_delete on public.user_roles for delete to authenticated
using (public.has_any_role(array['super_admin']));

comment on function public.has_any_role(text[]) is
  'Checks role membership without recursive RLS evaluation; callable only by authenticated users.';
comment on table public.user_roles is
  'Many-to-many role membership. Application authorization must still perform server-side checks.';
