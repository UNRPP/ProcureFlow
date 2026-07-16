-- Production-safe demo data controls. Every created case has a DEMO- number.
-- These functions are intentionally callable only by an active super administrator.

create or replace function public.seed_demo_data()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  department_id uuid;
  fiscal_year_id uuid;
  budget_category_id uuid;
  budget_source_id uuid;
  procurement_type_id uuid;
  device_category_id uuid;
  equipment_category_id uuid;
  contract_category_id uuid;
  template_id uuid;
  inserted_count integer;
begin
  if actor_id is null or not public.has_any_role(array['super_admin']) then
    raise exception 'Demo data administration is not authorized' using errcode = '42501';
  end if;
  -- Re-running is safe and never overwrites an existing demo record.
  insert into public.departments (code, name_en, name_th) values
    ('demo_surgery', 'Demo Surgery Department', 'แผนกศัลยกรรมตัวอย่าง'),
    ('demo_radiology', 'Demo Radiology Department', 'แผนกรังสีวิทยาตัวอย่าง')
  on conflict (code) do nothing;
  insert into public.budget_categories (code, name_en, name_th) values
    ('demo_capital', 'Demo Capital Equipment', 'ครุภัณฑ์ตัวอย่าง'),
    ('demo_supplies', 'Demo Medical Supplies', 'เวชภัณฑ์ตัวอย่าง')
  on conflict (code) do nothing;
  insert into public.budget_sources (code, name_en, name_th) values
    ('demo_government', 'Demo Government Budget', 'งบประมาณแผ่นดินตัวอย่าง'),
    ('demo_hospital', 'Demo Hospital Revenue', 'รายได้โรงพยาบาลตัวอย่าง')
  on conflict (code) do nothing;
  insert into public.procurement_types (code, name_en, name_th) values
    ('demo_direct', 'Demo Direct Purchase', 'จัดซื้อโดยวิธีเฉพาะเจาะจงตัวอย่าง')
  on conflict (code) do nothing;
  insert into public.fiscal_years (code, year, name_en, name_th, starts_on, ends_on)
  values ('FY2026', 2026, 'Fiscal Year 2026', 'ปีงบประมาณ 2569', '2025-10-01', '2026-09-30')
  on conflict (code) do nothing;

  select id into department_id from public.departments where code = 'demo_surgery';
  select id into fiscal_year_id from public.fiscal_years where code = 'FY2026';
  select id into budget_category_id from public.budget_categories where code = 'demo_capital';
  select id into budget_source_id from public.budget_sources where code = 'demo_government';
  select id into procurement_type_id from public.procurement_types where code = 'demo_direct';
  select id into device_category_id from public.work_categories where code = 'medical_device';
  select id into equipment_category_id from public.work_categories where code = 'medical_equipment';
  select id into contract_category_id from public.work_categories where code = 'service_contract';
  if department_id is null or fiscal_year_id is null or budget_category_id is null
     or budget_source_id is null or procurement_type_id is null or device_category_id is null
     or equipment_category_id is null or contract_category_id is null then
    raise exception 'Required master data is unavailable';
  end if;

  insert into public.workflow_templates (
    code, version, name_en, name_th, description_en, description_th,
    procurement_type_id, status, created_by
  ) values (
    'demo_standard', 1, 'Demo standard workflow', 'ขั้นตอนทำงานตัวอย่าง',
    'A short workflow for testing cases.', 'ขั้นตอนสั้นสำหรับทดสอบงาน',
    procurement_type_id, 'draft', actor_id
  ) on conflict (code, version) do nothing;
  select id into template_id from public.workflow_templates
  where code = 'demo_standard' and version = 1;
  insert into public.workflow_template_steps (
    template_id, step_key, name_en, name_th, sequence, default_responsible_department_id, target_days, can_skip
  ) values
    (template_id, 'review', 'Request review', 'ตรวจสอบคำขอ', 1, department_id, 3, false),
    (template_id, 'approval', 'Approval', 'อนุมัติ', 2, department_id, 5, false),
    (template_id, 'contracting', 'Contracting', 'จัดทำสัญญา', 3, department_id, 7, true)
  on conflict on constraint workflow_template_steps_template_id_step_key_key do nothing;
  update public.workflow_templates
  set status = 'published', published_at = now()
  where id = template_id and status = 'draft';

  insert into public.procurement_cases (
    case_number, title, description, work_category_id, requesting_department_id,
    fiscal_year_id, budget_category_id, budget_source_id, estimated_value,
    procurement_type_id, priority, case_owner_id, current_responsible_department_id,
    target_completion_date, status, hold_reason, cancellation_reason, completed_at, created_by
  ) values
    ('DEMO-2026-0001', '[DEMO] Portable ultrasound device', 'Demo case: active urgent device procurement.', device_category_id, department_id, fiscal_year_id, budget_category_id, budget_source_id, 850000, procurement_type_id, 'urgent', actor_id, department_id, current_date + 5, 'active', null, null, null, actor_id),
    ('DEMO-2026-0002', '[DEMO] CT scanner maintenance equipment', 'Demo case: active equipment procurement.', equipment_category_id, department_id, fiscal_year_id, budget_category_id, budget_source_id, 2450000, procurement_type_id, 'critical', actor_id, department_id, current_date + 14, 'active', null, null, null, actor_id),
    ('DEMO-2026-0003', '[DEMO] Theatre instrument set', 'Demo case: draft ready to start through the workflow panel.', device_category_id, department_id, fiscal_year_id, budget_category_id, budget_source_id, 320000, procurement_type_id, 'normal', actor_id, null, current_date + 21, 'draft', null, null, null, actor_id),
    ('DEMO-2026-0004', '[DEMO] Biomedical calibration contract', 'Demo case: an on-hold service contract.', contract_category_id, department_id, fiscal_year_id, budget_category_id, budget_source_id, 480000, procurement_type_id, 'normal', actor_id, department_id, current_date + 30, 'on_hold', 'Awaiting revised technical specification.', null, null, actor_id),
    ('DEMO-2026-0005', '[DEMO] Patient monitor replacement', 'Demo case: completed equipment purchase.', equipment_category_id, department_id, fiscal_year_id, budget_category_id, budget_source_id, 610000, procurement_type_id, 'normal', actor_id, null, current_date - 4, 'completed', null, null, now() - interval '4 days', actor_id),
    ('DEMO-2026-0006', '[DEMO] Sterile supply contract', 'Demo case: cancelled service contract.', contract_category_id, department_id, fiscal_year_id, budget_category_id, budget_source_id, 275000, procurement_type_id, 'normal', actor_id, null, current_date + 45, 'cancelled', null, 'Budget reallocated to an urgent requirement.', null, actor_id),
    ('DEMO-2026-0007', '[DEMO] Infusion pump accessories', 'Demo case: active normal-priority device request.', device_category_id, department_id, fiscal_year_id, budget_category_id, budget_source_id, 180000, procurement_type_id, 'normal', actor_id, department_id, current_date + 9, 'active', null, null, null, actor_id),
    ('DEMO-2026-0008', '[DEMO] X-ray room refurbishment equipment', 'Demo case: active capital equipment request.', equipment_category_id, department_id, fiscal_year_id, budget_category_id, budget_source_id, 1120000, procurement_type_id, 'urgent', actor_id, department_id, current_date + 2, 'active', null, null, null, actor_id)
  on conflict (case_number) do nothing;
  get diagnostics inserted_count = row_count;

  insert into public.medical_device_case_details (case_id, item_name, quantity, unit, estimated_unit_price, intended_use, device_classification, is_reusable)
  select id, title, 1, 'set', estimated_value, 'Clinical demonstration and workflow testing', 'Class B', true
  from public.procurement_cases where case_number in ('DEMO-2026-0001','DEMO-2026-0003','DEMO-2026-0007')
  on conflict (case_id) do nothing;
  insert into public.medical_equipment_case_details (case_id, equipment_name, quantity, purchase_kind, installation_location, expected_installation_date, warranty_required, maintenance_required)
  select id, title, 1, 'new_purchase', 'Demo clinical area', current_date + 60, true, true
  from public.procurement_cases where case_number in ('DEMO-2026-0002','DEMO-2026-0005','DEMO-2026-0008')
  on conflict (case_id) do nothing;
  insert into public.service_contract_case_details (case_id, scope_of_service, contract_start_date, contract_end_date, is_recurring, current_provider, renewal_notification_date)
  select id, 'Demo service scope for acceptance testing', current_date, current_date + 365, true, 'Demo provider', current_date + 300
  from public.procurement_cases where case_number in ('DEMO-2026-0004','DEMO-2026-0006')
  on conflict (case_id) do nothing;

  return inserted_count;
end;
$$;

create or replace function public.clear_demo_data()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  deleted_count integer;
begin
  if actor_id is null or not public.has_any_role(array['super_admin']) then
    raise exception 'Demo data administration is not authorized' using errcode = '42501';
  end if;
  perform set_config('procureflow.demo_cleanup', 'true', true);
  -- Delete only explicitly tagged DEMO cases and their dependent records.
  delete from public.case_stage_document_requirements where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.case_document_versions where document_id in (select id from public.case_documents where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%'));
  delete from public.case_documents where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.case_comments where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.notifications where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.case_activity_events where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.workflow_transition_events where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.case_assignments where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.case_responsibility_intervals where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.case_stage_instances where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.case_workflows where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.medical_device_case_details where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.medical_equipment_case_details where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.service_contract_case_details where case_id in (select id from public.procurement_cases where case_number like 'DEMO-%');
  delete from public.procurement_cases where case_number like 'DEMO-%';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.seed_demo_data() from public;
revoke all on function public.clear_demo_data() from public;
grant execute on function public.seed_demo_data() to authenticated;
grant execute on function public.clear_demo_data() to authenticated;

comment on function public.seed_demo_data() is 'Creates an idempotent, clearly tagged DEMO dataset for super-admin acceptance testing.';
comment on function public.clear_demo_data() is 'Deletes only DEMO-* cases and their dependent app records. Demo master data and workflow remain for historical safety.';

-- This narrow escape hatch is available only inside clear_demo_data(), whose role and
-- DEMO-number guard prevent it from weakening normal historical protections.
create or replace function public.protect_case_stage_history()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and current_setting('procureflow.demo_cleanup', true) = 'true'
    and exists (select 1 from public.procurement_cases where id = old.case_id and case_number like 'DEMO-%') then return old; end if;
  if tg_op = 'DELETE' then raise exception 'Case stage history cannot be deleted' using errcode = '23514'; end if;
  if old.status in ('completed', 'returned', 'skipped', 'cancelled') then raise exception 'Completed case stage history is immutable' using errcode = '23514'; end if;
  if new.case_workflow_id is distinct from old.case_workflow_id or new.case_id is distinct from old.case_id or new.template_step_id is distinct from old.template_step_id or new.step_key is distinct from old.step_key or new.name_en is distinct from old.name_en or new.name_th is distinct from old.name_th or new.sequence is distinct from old.sequence or new.iteration is distinct from old.iteration or new.target_days is distinct from old.target_days or new.can_skip is distinct from old.can_skip or new.created_at is distinct from old.created_at then raise exception 'Case stage snapshot fields are immutable' using errcode = '23514'; end if;
  return new;
end; $$;

create or replace function public.prevent_audit_event_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_setting('procureflow.demo_cleanup', true) = 'true' and exists (select 1 from public.procurement_cases where id = old.case_id and case_number like 'DEMO-%') then return old; end if;
  raise exception 'Audit events are immutable' using errcode = '23514';
end; $$;

create or replace function public.protect_responsibility_interval()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and current_setting('procureflow.demo_cleanup', true) = 'true' and exists (select 1 from public.procurement_cases where id = old.case_id and case_number like 'DEMO-%') then return old; end if;
  if tg_op = 'DELETE' or old.ended_at is not null then raise exception 'Responsibility history is immutable' using errcode = '23514'; end if;
  if new.case_id is distinct from old.case_id or new.stage_instance_id is distinct from old.stage_instance_id or new.responsible_user_id is distinct from old.responsible_user_id or new.responsible_department_id is distinct from old.responsible_department_id or new.started_at is distinct from old.started_at or new.assignment_source is distinct from old.assignment_source or new.created_by is distinct from old.created_by then raise exception 'Responsibility attribution fields are immutable' using errcode = '23514'; end if;
  return new;
end; $$;
