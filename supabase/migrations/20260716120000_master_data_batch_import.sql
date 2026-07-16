-- Atomic, RLS-aware batch import for administrator-maintained master data.
create or replace function public.import_master_data_batch(target_table text, import_rows jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare imported_count integer;
begin
  if not public.has_any_role(array['super_admin']) then
    raise exception 'Only super administrators can import master data' using errcode = '42501';
  end if;
  if jsonb_typeof(import_rows) <> 'array' or jsonb_array_length(import_rows) = 0 then
    raise exception 'Import must contain at least one row' using errcode = '22023';
  end if;

  if target_table = 'fiscal_years' then
    insert into public.fiscal_years (code, name_en, name_th, year, starts_on, ends_on)
    select code, name_en, name_th, year, starts_on, ends_on
    from jsonb_to_recordset(import_rows) as rows(
      code text, name_en text, name_th text, year integer, starts_on date, ends_on date
    );
  elsif target_table = 'departments' then
    insert into public.departments (code, name_en, name_th)
    select code, name_en, name_th from jsonb_to_recordset(import_rows) as rows(code text, name_en text, name_th text);
  elsif target_table = 'budget_categories' then
    insert into public.budget_categories (code, name_en, name_th)
    select code, name_en, name_th from jsonb_to_recordset(import_rows) as rows(code text, name_en text, name_th text);
  elsif target_table = 'budget_sources' then
    insert into public.budget_sources (code, name_en, name_th)
    select code, name_en, name_th from jsonb_to_recordset(import_rows) as rows(code text, name_en text, name_th text);
  elsif target_table = 'procurement_types' then
    insert into public.procurement_types (code, name_en, name_th)
    select code, name_en, name_th from jsonb_to_recordset(import_rows) as rows(code text, name_en text, name_th text);
  elsif target_table = 'document_types' then
    insert into public.document_types (code, name_en, name_th)
    select code, name_en, name_th from jsonb_to_recordset(import_rows) as rows(code text, name_en text, name_th text);
  else
    raise exception 'Unsupported master-data table' using errcode = '22023';
  end if;

  get diagnostics imported_count = row_count;
  return imported_count;
end;
$$;

revoke all on function public.import_master_data_batch(text, jsonb) from public;
grant execute on function public.import_master_data_batch(text, jsonb) to authenticated;

comment on function public.import_master_data_batch(text, jsonb) is
  'Atomically imports validated master-data rows for super administrators. RLS remains enabled on all target tables.';
