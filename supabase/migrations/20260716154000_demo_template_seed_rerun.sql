-- Permit the idempotent demo seed to re-submit its already-published steps.
-- No other published workflow template may be changed.
create or replace function public.protect_workflow_template_step()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_status text;
  parent_code text;
  parent_id uuid := coalesce(new.template_id, old.template_id);
begin
  select status, code into parent_status, parent_code
  from public.workflow_templates where id = parent_id;
  if parent_status is distinct from 'draft' then
    if tg_op = 'INSERT' and parent_code = 'demo_standard'
      and exists (
        select 1 from public.workflow_template_steps
        where template_id = parent_id and step_key = new.step_key
      ) then
      return null;
    end if;
    raise exception 'Only draft workflow steps may be changed' using errcode = '23514';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

comment on function public.protect_workflow_template_step() is
  'Prevents changes to published workflow steps, except duplicate no-op inserts by the controlled demo seed.';
