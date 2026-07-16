-- Run with psql after creating the first production Auth user:
-- psql "$SUPABASE_DB_URL" --set=admin_email='admin@example.org' \
--   --file=supabase/bootstrap_super_admin.sql
\set ON_ERROR_STOP on
\if :{?admin_email}
\else
  \echo 'admin_email is required'
  \quit 1
\endif

begin;

create temporary table selected_bootstrap_profile on commit drop as
select id
from public.profiles
where lower(email) = lower(:'admin_email');

do $$
begin
  if (select count(*) from selected_bootstrap_profile) <> 1 then
    raise exception 'Exactly one matching application profile is required';
  end if;
  if not exists (select 1 from public.roles where code = 'super_admin') then
    raise exception 'Apply production_seed.sql before bootstrapping an administrator';
  end if;
end;
$$;

insert into public.user_roles (user_id, role_id, created_by)
select profile.id, role.id, null
from selected_bootstrap_profile profile
cross join public.roles role
where role.code = 'super_admin'
on conflict (user_id, role_id) do nothing;

commit;
