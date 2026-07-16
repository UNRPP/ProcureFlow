-- Local development seed data. Do not apply demo credentials to production.
insert into public.roles (code, name_en, name_th, description_en, description_th)
values
  ('super_admin', 'Super administrator', 'ผู้ดูแลระบบสูงสุด', 'Full system administration', 'จัดการระบบทั้งหมด'),
  ('procurement_manager', 'Procurement manager', 'ผู้จัดการฝ่ายพัสดุ', 'Manage cases, assignments, and reports', 'จัดการงาน การมอบหมาย และรายงาน'),
  ('procurement_officer', 'Procurement officer', 'เจ้าหน้าที่พัสดุ', 'Create and manage assigned procurement work', 'สร้างและจัดการงานจัดซื้อที่ได้รับมอบหมาย'),
  ('viewer_auditor', 'Viewer / auditor', 'ผู้ตรวจสอบ', 'Read-only audit and reporting access', 'ดูข้อมูล รายงาน และการตรวจสอบเท่านั้น')
on conflict (code) do update set
  name_en = excluded.name_en,
  name_th = excluded.name_th,
  description_en = excluded.description_en,
  description_th = excluded.description_th,
  is_active = true;

insert into public.departments (code, name_en, name_th)
values
  ('procurement', 'Procurement Department', 'ฝ่ายพัสดุ'),
  ('finance', 'Finance Department', 'ฝ่ายการเงิน'),
  ('medical_engineering', 'Medical Engineering', 'ฝ่ายวิศวกรรมการแพทย์'),
  ('nursing', 'Nursing Department', 'ฝ่ายการพยาบาล'),
  ('information_technology', 'Information Technology', 'ฝ่ายเทคโนโลยีสารสนเทศ'),
  ('executive', 'Executive Office', 'สำนักงานบริหาร')
on conflict (code) do update set name_en = excluded.name_en, name_th = excluded.name_th, is_active = true, archived_at = null;

insert into public.work_categories (code, name_en, name_th)
values
  ('medical_device', 'Medical devices', 'เครื่องมือแพทย์'),
  ('medical_equipment', 'Medical equipment', 'ครุภัณฑ์การแพทย์'),
  ('service_contract', 'Contracts for services', 'สัญญาบริการ')
on conflict (code) do update set name_en = excluded.name_en, name_th = excluded.name_th, is_active = true, archived_at = null;

insert into public.budget_categories (code, name_en, name_th)
values
  ('capital_equipment', 'Capital equipment', 'ครุภัณฑ์'),
  ('medical_supplies', 'Medical supplies', 'วัสดุการแพทย์'),
  ('maintenance_repair', 'Maintenance and repair', 'บำรุงรักษาและซ่อมแซม'),
  ('it_software', 'IT and software', 'เทคโนโลยีสารสนเทศและซอฟต์แวร์'),
  ('operations', 'Operations', 'ดำเนินงาน')
on conflict (code) do update set name_en = excluded.name_en, name_th = excluded.name_th, is_active = true, archived_at = null;

insert into public.budget_sources (code, name_en, name_th)
values
  ('annual_budget', 'Annual hospital budget', 'งบประมาณประจำปีของโรงพยาบาล'),
  ('donation', 'Donation', 'เงินบริจาค'),
  ('research_grant', 'Research grant', 'ทุนวิจัย'),
  ('hospital_revenue', 'Hospital revenue', 'เงินบำรุงโรงพยาบาล')
on conflict (code) do update set name_en = excluded.name_en, name_th = excluded.name_th, is_active = true, archived_at = null;

insert into public.procurement_types (code, name_en, name_th)
values
  ('open_tender', 'Open tender', 'ประกวดราคา'),
  ('limited_tender', 'Limited tender', 'สอบราคาแบบจำกัด'),
  ('quotation', 'Request for quotation', 'ขอใบเสนอราคา'),
  ('direct_purchase', 'Direct purchase', 'วิธีเฉพาะเจาะจง')
on conflict (code) do update set name_en = excluded.name_en, name_th = excluded.name_th, is_active = true, archived_at = null;

insert into public.fiscal_years (code, year, name_en, name_th, starts_on, ends_on)
values
  ('FY2026', 2026, 'Fiscal year 2026', 'ปีงบประมาณ 2569', '2025-10-01', '2026-09-30'),
  ('FY2027', 2027, 'Fiscal year 2027', 'ปีงบประมาณ 2570', '2026-10-01', '2027-09-30')
on conflict (code) do update set
  name_en = excluded.name_en,
  name_th = excluded.name_th,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  is_active = true,
  archived_at = null;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@procureflow.local', crypt('ProcureFlow123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Anan Chaiyasit","locale":"en"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'manager@procureflow.local', crypt('ProcureFlow123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Pimchanok Srisuk","locale":"th"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'officer@procureflow.local', crypt('ProcureFlow123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Narin Wongsa","locale":"en"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'auditor@procureflow.local', crypt('ProcureFlow123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Siriporn Kittikul","locale":"th"}', now(), now(), '', '', '', '')
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  email_confirmed_at = excluded.email_confirmed_at,
  updated_at = now();

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select email, id, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users
where id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004'
)
on conflict (provider_id, provider) do update set identity_data = excluded.identity_data, updated_at = now();

update public.profiles
set department_id = (select id from public.departments where code = 'procurement'),
    employee_code = case id
      when '10000000-0000-0000-0000-000000000001' then 'ADM-001'
      when '10000000-0000-0000-0000-000000000002' then 'MGR-001'
      when '10000000-0000-0000-0000-000000000003' then 'OFF-001'
      when '10000000-0000-0000-0000-000000000004' then 'AUD-001'
    end
where id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004'
);

insert into public.user_roles (user_id, role_id, created_by)
select seeded.user_id, roles.id, '10000000-0000-0000-0000-000000000001'
from (
  values
    ('10000000-0000-0000-0000-000000000001'::uuid, 'super_admin'::text),
    ('10000000-0000-0000-0000-000000000002'::uuid, 'procurement_manager'::text),
    ('10000000-0000-0000-0000-000000000003'::uuid, 'procurement_officer'::text),
    ('10000000-0000-0000-0000-000000000004'::uuid, 'viewer_auditor'::text)
) as seeded(user_id, role_code)
join public.roles on roles.code = seeded.role_code
on conflict (user_id, role_id) do nothing;

-- Phase 1 demo cases cover every category, status, responsibility type, and
-- several filter/export combinations.
insert into public.procurement_cases (
  id, case_number, title, description, work_category_id,
  requesting_department_id, fiscal_year_id, budget_category_id,
  budget_source_id, estimated_value, final_value, procurement_type_id,
  priority, case_owner_id, current_responsible_user_id,
  current_responsible_department_id, target_completion_date, status,
  hold_reason, cancellation_reason, completed_at, created_by, created_at
)
values
  (
    '20000000-0000-0000-0000-000000000001', 'PRC-2026-000001',
    'Portable ultrasound system', 'Point-of-care imaging for the emergency department.',
    (select id from public.work_categories where code = 'medical_equipment'),
    (select id from public.departments where code = 'medical_engineering'),
    (select id from public.fiscal_years where code = 'FY2026'),
    (select id from public.budget_categories where code = 'capital_equipment'),
    (select id from public.budget_sources where code = 'annual_budget'),
    2450000, null, (select id from public.procurement_types where code = 'open_tender'),
    'critical', '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003', null, '2026-08-30', 'active',
    null, null, null, '10000000-0000-0000-0000-000000000002', '2026-07-01 02:00:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000002', 'PRC-2026-000002',
    'Patient monitor sets', 'Bedside monitoring devices for the medical ward.',
    (select id from public.work_categories where code = 'medical_device'),
    (select id from public.departments where code = 'nursing'),
    (select id from public.fiscal_years where code = 'FY2026'),
    (select id from public.budget_categories where code = 'medical_supplies'),
    (select id from public.budget_sources where code = 'hospital_revenue'),
    760000, null, (select id from public.procurement_types where code = 'quotation'),
    'urgent', '10000000-0000-0000-0000-000000000003',
    null, (select id from public.departments where code = 'finance'), '2026-08-10', 'active',
    null, null, null, '10000000-0000-0000-0000-000000000003', '2026-07-02 03:00:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000003', 'PRC-2026-000003',
    'MRI annual maintenance', 'Preventive and corrective maintenance service.',
    (select id from public.work_categories where code = 'service_contract'),
    (select id from public.departments where code = 'medical_engineering'),
    (select id from public.fiscal_years where code = 'FY2026'),
    (select id from public.budget_categories where code = 'maintenance_repair'),
    (select id from public.budget_sources where code = 'annual_budget'),
    1300000, null, (select id from public.procurement_types where code = 'limited_tender'),
    'normal', '10000000-0000-0000-0000-000000000003',
    null, null, '2026-09-15', 'draft',
    null, null, null, '10000000-0000-0000-0000-000000000003', '2026-07-04 04:00:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000004', 'PRC-2026-000004',
    'Infusion pump replacement', 'Replace end-of-life pumps in critical care.',
    (select id from public.work_categories where code = 'medical_device'),
    (select id from public.departments where code = 'nursing'),
    (select id from public.fiscal_years where code = 'FY2026'),
    (select id from public.budget_categories where code = 'capital_equipment'),
    (select id from public.budget_sources where code = 'donation'),
    980000, null, (select id from public.procurement_types where code = 'quotation'),
    'urgent', '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003', null, '2026-07-29', 'on_hold',
    'Donation confirmation is pending.', null, null,
    '10000000-0000-0000-0000-000000000002', '2026-06-18 04:00:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000005', 'PRC-2026-000005',
    'Laboratory freezer', 'Ultra-low temperature freezer for specimen storage.',
    (select id from public.work_categories where code = 'medical_equipment'),
    (select id from public.departments where code = 'medical_engineering'),
    (select id from public.fiscal_years where code = 'FY2026'),
    (select id from public.budget_categories where code = 'capital_equipment'),
    (select id from public.budget_sources where code = 'research_grant'),
    520000, 508500, (select id from public.procurement_types where code = 'direct_purchase'),
    'normal', '10000000-0000-0000-0000-000000000003',
    null, null, '2026-06-30', 'completed',
    null, null, '2026-06-27 08:30:00+00',
    '10000000-0000-0000-0000-000000000003', '2026-05-12 03:00:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000006', 'PRC-2026-000006',
    'Hospital network support', 'Managed network monitoring and on-call support.',
    (select id from public.work_categories where code = 'service_contract'),
    (select id from public.departments where code = 'information_technology'),
    (select id from public.fiscal_years where code = 'FY2027'),
    (select id from public.budget_categories where code = 'it_software'),
    (select id from public.budget_sources where code = 'annual_budget'),
    890000, null, (select id from public.procurement_types where code = 'open_tender'),
    'normal', '10000000-0000-0000-0000-000000000003',
    null, (select id from public.departments where code = 'information_technology'), '2026-10-15', 'draft',
    null, null, null, '10000000-0000-0000-0000-000000000003', '2026-07-08 06:00:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000007', 'PRC-2026-000007',
    'Surgical instrument trays', 'Reusable instrument sets for operating rooms.',
    (select id from public.work_categories where code = 'medical_device'),
    (select id from public.departments where code = 'nursing'),
    (select id from public.fiscal_years where code = 'FY2026'),
    (select id from public.budget_categories where code = 'medical_supplies'),
    (select id from public.budget_sources where code = 'hospital_revenue'),
    410000, null, (select id from public.procurement_types where code = 'quotation'),
    'normal', '10000000-0000-0000-0000-000000000003',
    null, (select id from public.departments where code = 'executive'), '2026-08-22', 'active',
    null, null, null, '10000000-0000-0000-0000-000000000002', '2026-07-09 02:30:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000008', 'PRC-2026-000008',
    'CT injector system', 'Injector equipment request withdrawn after scope review.',
    (select id from public.work_categories where code = 'medical_equipment'),
    (select id from public.departments where code = 'medical_engineering'),
    (select id from public.fiscal_years where code = 'FY2026'),
    (select id from public.budget_categories where code = 'capital_equipment'),
    (select id from public.budget_sources where code = 'annual_budget'),
    1150000, null, (select id from public.procurement_types where code = 'open_tender'),
    'normal', '10000000-0000-0000-0000-000000000003',
    null, null, null, 'cancelled',
    null, 'Clinical requirements changed.', null,
    '10000000-0000-0000-0000-000000000002', '2026-06-22 05:00:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000009', 'PRC-2026-000009',
    'Sterilizer validation service', 'Annual validation and calibration services.',
    (select id from public.work_categories where code = 'service_contract'),
    (select id from public.departments where code = 'medical_engineering'),
    (select id from public.fiscal_years where code = 'FY2026'),
    (select id from public.budget_categories where code = 'maintenance_repair'),
    (select id from public.budget_sources where code = 'hospital_revenue'),
    275000, null, (select id from public.procurement_types where code = 'direct_purchase'),
    'urgent', '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003', null, '2026-07-25', 'active',
    null, null, null, '10000000-0000-0000-0000-000000000003', '2026-07-10 07:00:00+00'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  requesting_department_id = excluded.requesting_department_id,
  fiscal_year_id = excluded.fiscal_year_id,
  budget_category_id = excluded.budget_category_id,
  budget_source_id = excluded.budget_source_id,
  estimated_value = excluded.estimated_value,
  final_value = excluded.final_value,
  procurement_type_id = excluded.procurement_type_id,
  priority = excluded.priority,
  case_owner_id = excluded.case_owner_id,
  current_responsible_user_id = excluded.current_responsible_user_id,
  current_responsible_department_id = excluded.current_responsible_department_id,
  target_completion_date = excluded.target_completion_date,
  status = excluded.status,
  hold_reason = excluded.hold_reason,
  cancellation_reason = excluded.cancellation_reason,
  completed_at = excluded.completed_at;

insert into public.medical_device_case_details (
  case_id, item_name, quantity, unit, estimated_unit_price,
  intended_use, device_classification, is_reusable
)
values
  ('20000000-0000-0000-0000-000000000002', 'Bedside patient monitor', 12, 'sets', 63333.33, 'Continuous vital-sign monitoring in the medical ward.', 'Class II', true),
  ('20000000-0000-0000-0000-000000000004', 'Volumetric infusion pump', 20, 'units', 49000, 'Medication delivery in critical care.', 'Class II', true),
  ('20000000-0000-0000-0000-000000000007', 'General surgery instrument tray', 8, 'sets', 51250, 'Reusable instruments for general surgery.', 'Class I', true)
on conflict (case_id) do update set
  item_name = excluded.item_name, quantity = excluded.quantity, unit = excluded.unit,
  estimated_unit_price = excluded.estimated_unit_price, intended_use = excluded.intended_use,
  device_classification = excluded.device_classification, is_reusable = excluded.is_reusable;

insert into public.medical_equipment_case_details (
  case_id, equipment_name, quantity, purchase_kind, installation_location,
  replaced_asset_reference, expected_installation_date,
  warranty_required, maintenance_required
)
values
  ('20000000-0000-0000-0000-000000000001', 'Portable ultrasound system', 2, 'new_purchase', 'Emergency Department', null, '2026-09-20', true, true),
  ('20000000-0000-0000-0000-000000000005', 'Ultra-low temperature freezer', 1, 'replacement', 'Research Laboratory', 'AST-LAB-0042', '2026-06-22', true, true),
  ('20000000-0000-0000-0000-000000000008', 'CT contrast injector', 1, 'new_purchase', 'Radiology Department', null, null, true, true)
on conflict (case_id) do update set
  equipment_name = excluded.equipment_name, quantity = excluded.quantity,
  purchase_kind = excluded.purchase_kind, installation_location = excluded.installation_location,
  replaced_asset_reference = excluded.replaced_asset_reference,
  expected_installation_date = excluded.expected_installation_date,
  warranty_required = excluded.warranty_required, maintenance_required = excluded.maintenance_required;

insert into public.service_contract_case_details (
  case_id, scope_of_service, contract_start_date, contract_end_date,
  is_recurring, existing_contract_number, current_provider,
  renewal_notification_date
)
values
  ('20000000-0000-0000-0000-000000000003', 'Preventive maintenance, parts, and emergency repairs for the MRI system.', '2026-10-01', '2027-09-30', true, 'MRI-MA-2025-014', 'MedTech Service Co.', '2027-06-30'),
  ('20000000-0000-0000-0000-000000000006', '24/7 network monitoring, incident response, and quarterly health review.', '2026-11-01', '2027-10-31', true, null, 'Siam Network Operations', '2027-07-31'),
  ('20000000-0000-0000-0000-000000000009', 'Validation and calibration of central sterilization equipment.', '2026-08-01', '2026-08-31', false, 'CSSD-VAL-2025-003', 'Quality Calibration Ltd.', null)
on conflict (case_id) do update set
  scope_of_service = excluded.scope_of_service,
  contract_start_date = excluded.contract_start_date,
  contract_end_date = excluded.contract_end_date,
  is_recurring = excluded.is_recurring,
  existing_contract_number = excluded.existing_contract_number,
  current_provider = excluded.current_provider,
  renewal_notification_date = excluded.renewal_notification_date;

select setval('public.procurement_case_number_seq', 9, true);

-- Phase 2 workflow templates. Seed as drafts, add steps, then publish so the
-- same immutability rules used by the application are exercised.
insert into public.workflow_templates (
  id, code, version, name_en, name_th, description_en, description_th,
  procurement_type_id, status, created_by
)
select
  seeded.id, seeded.code, 1, seeded.name_en, seeded.name_th,
  'Standard seven-stage hospital procurement workflow.',
  'ขั้นตอนมาตรฐานเจ็ดขั้นสำหรับงานจัดซื้อจัดจ้างของโรงพยาบาล',
  pt.id, 'draft', '10000000-0000-0000-0000-000000000001'
from (
  values
    ('30000000-0000-0000-0000-000000000001'::uuid, 'open_tender_standard', 'Open tender workflow', 'ขั้นตอนประกวดราคา', 'open_tender'),
    ('30000000-0000-0000-0000-000000000002'::uuid, 'limited_tender_standard', 'Limited tender workflow', 'ขั้นตอนสอบราคาแบบจำกัด', 'limited_tender'),
    ('30000000-0000-0000-0000-000000000003'::uuid, 'quotation_standard', 'Quotation workflow', 'ขั้นตอนขอใบเสนอราคา', 'quotation'),
    ('30000000-0000-0000-0000-000000000004'::uuid, 'direct_purchase_standard', 'Direct purchase workflow', 'ขั้นตอนวิธีเฉพาะเจาะจง', 'direct_purchase')
) seeded(id, code, name_en, name_th, procurement_type_code)
join public.procurement_types pt on pt.code = seeded.procurement_type_code
on conflict (id) do nothing;

insert into public.workflow_template_steps (
  template_id, step_key, name_en, name_th, description_en, description_th,
  sequence, default_responsible_role_id, default_responsible_department_id,
  target_days, required_document_behavior, can_skip
)
select
  template.id,
  step.step_key,
  step.name_en,
  step.name_th,
  step.description_en,
  step.description_th,
  step.sequence,
  case when step.department_code is null
    then (select id from public.roles where code = 'procurement_officer')
    else null end,
  case when step.department_code is not null
    then (select id from public.departments where code = step.department_code)
    else null end,
  step.target_days,
  step.document_behavior,
  step.can_skip
from public.workflow_templates template
cross join (
  values
    ('request_review', 'Request review', 'ตรวจสอบคำขอ', 'Review scope, category, and intake completeness.', 'ตรวจสอบขอบเขต หมวดงาน และความครบถ้วนของคำขอ', 1, null::text, 3, 'warn', false),
    ('specification', 'Specification', 'จัดทำข้อกำหนด', 'Develop and approve the technical specification.', 'จัดทำและอนุมัติข้อกำหนดทางเทคนิค', 2, null::text, 10, 'block', false),
    ('budget_check', 'Budget check', 'ตรวจสอบงบประมาณ', 'Confirm budget source and availability.', 'ยืนยันแหล่งงบประมาณและวงเงิน', 3, 'finance', 5, 'block', false),
    ('approval', 'Approval', 'อนุมัติ', 'Obtain the required management approval.', 'ขออนุมัติจากผู้บริหารตามอำนาจ', 4, 'executive', 7, 'block', false),
    ('procurement', 'Procurement', 'ดำเนินการจัดซื้อ', 'Run the selected procurement procedure.', 'ดำเนินวิธีจัดซื้อจัดจ้างที่เลือก', 5, null::text, 20, 'block', false),
    ('evaluation', 'Evaluation', 'ประเมินผล', 'Evaluate submissions and document the decision.', 'ประเมินข้อเสนอและบันทึกผลการพิจารณา', 6, null::text, 10, 'block', false),
    ('contracting', 'Contracting', 'จัดทำสัญญา', 'Finalize award and contract documentation.', 'จัดทำผลการจัดซื้อและเอกสารสัญญา', 7, null::text, 10, 'block', true)
) step(step_key, name_en, name_th, description_en, description_th, sequence, department_code, target_days, document_behavior, can_skip)
where template.id in (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000004'
)
on conflict (template_id, step_key) do nothing;

update public.workflow_templates
set status = 'published', published_at = now()
where id in (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000004'
) and status = 'draft';

insert into public.case_workflows (
  case_id, template_id, template_code, template_version,
  template_name_en, template_name_th, status, started_by, started_at,
  completed_at, cancelled_at
)
select
  pc.id, wt.id, wt.code, wt.version, wt.name_en, wt.name_th,
  case
    when pc.status = 'completed' then 'completed'
    when pc.status = 'cancelled' then 'cancelled'
    else 'active'
  end,
  pc.created_by,
  pc.created_at + interval '1 day',
  case when pc.status = 'completed' then pc.completed_at else null end,
  case when pc.status = 'cancelled' then pc.updated_at else null end
from public.procurement_cases pc
join public.workflow_templates wt
  on wt.procurement_type_id = pc.procurement_type_id and wt.status = 'published'
where pc.status <> 'draft'
on conflict (case_id) do nothing;

with stage_targets as (
  select
    cw.id workflow_id,
    pc.id case_id,
    pc.case_number,
    pc.status case_status,
    pc.case_owner_id,
    pc.current_responsible_user_id,
    pc.current_responsible_department_id,
    pc.created_at,
    pc.completed_at case_completed_at,
    case pc.case_number
      when 'PRC-2026-000001' then 4
      when 'PRC-2026-000002' then 3
      when 'PRC-2026-000004' then 2
      when 'PRC-2026-000007' then 5
      when 'PRC-2026-000008' then 3
      when 'PRC-2026-000009' then 6
      else 7
    end active_sequence,
    step.*
  from public.case_workflows cw
  join public.procurement_cases pc on pc.id = cw.case_id
  join public.workflow_template_steps step on step.template_id = cw.template_id
)
insert into public.case_stage_instances (
  case_workflow_id, case_id, template_step_id, step_key, name_en, name_th,
  description_en, description_th, sequence, iteration,
  default_responsible_role_id, default_responsible_department_id,
  responsible_user_id, responsible_department_id, target_days,
  required_document_behavior, can_skip, status, entered_at, due_at,
  completed_at, completed_by
)
select
  workflow_id, case_id, id, step_key, name_en, name_th,
  description_en, description_th, sequence, 1,
  default_responsible_role_id, default_responsible_department_id,
  case
    when case_status in ('active', 'on_hold') and sequence = active_sequence
      then current_responsible_user_id
    when sequence <= active_sequence then case_owner_id
    else null
  end,
  case
    when case_status in ('active', 'on_hold') and sequence = active_sequence
      then current_responsible_department_id
    else null
  end,
  target_days, required_document_behavior, can_skip,
  case
    when case_status = 'completed' then 'completed'
    when case_status = 'cancelled' and sequence >= active_sequence then 'cancelled'
    when case_status = 'cancelled' and sequence < active_sequence then 'completed'
    when sequence < active_sequence then 'completed'
    when sequence = active_sequence then 'active'
    else 'pending'
  end,
  case when sequence <= active_sequence
    then created_at + make_interval(days => sequence * 2) else null end,
  case when sequence <= active_sequence
    then created_at + make_interval(days => sequence * 2 + target_days) else null end,
  case
    when case_status = 'completed' then
      coalesce(case_completed_at, created_at + make_interval(days => sequence * 3))
    when case_status = 'cancelled' then
      created_at + make_interval(days => active_sequence * 3)
    when sequence < active_sequence then
      created_at + make_interval(days => sequence * 3)
    else null
  end,
  case
    when case_status in ('completed', 'cancelled') or sequence < active_sequence
      then case_owner_id
    else null
  end
from stage_targets
on conflict (case_workflow_id, sequence, iteration) do nothing;

update public.procurement_cases pc
set current_stage_instance_id = stage.id
from public.case_stage_instances stage
where stage.case_id = pc.id and stage.status = 'active';

insert into public.case_assignments (
  case_id, stage_instance_id, assigned_user_id, assigned_department_id,
  assignment_kind, reason, assigned_by, assigned_at, unassigned_at
)
select
  stage.case_id, stage.id,
  case when stage.responsible_department_id is null
    then coalesce(stage.responsible_user_id, pc.case_owner_id)
    else null end,
  stage.responsible_department_id,
  'default', 'Seeded workflow history', pc.created_by,
  stage.entered_at,
  stage.completed_at
from public.case_stage_instances stage
join public.procurement_cases pc on pc.id = stage.case_id
where stage.entered_at is not null
  and not exists (
    select 1 from public.case_assignments existing
    where existing.stage_instance_id = stage.id
  );

insert into public.case_responsibility_intervals (
  case_id, stage_instance_id, responsible_user_id, responsible_department_id,
  started_at, ended_at, assignment_source, assignment_reason, created_by
)
select
  stage.case_id, stage.id,
  case when stage.responsible_department_id is null
    then coalesce(stage.responsible_user_id, pc.case_owner_id)
    else null end,
  stage.responsible_department_id,
  stage.entered_at,
  stage.completed_at,
  'default', 'Seeded workflow history', pc.created_by
from public.case_stage_instances stage
join public.procurement_cases pc on pc.id = stage.case_id
where stage.entered_at is not null
  and not exists (
    select 1 from public.case_responsibility_intervals existing
    where existing.stage_instance_id = stage.id
  );

insert into public.workflow_transition_events (
  case_id, case_workflow_id, from_stage_instance_id, to_stage_instance_id,
  action, reason, performed_by, created_at
)
select
  cw.case_id, cw.id, null,
  (select id from public.case_stage_instances
   where case_workflow_id = cw.id and sequence = 1 and iteration = 1),
  'start', null, cw.started_by, cw.started_at
from public.case_workflows cw
where not exists (
  select 1 from public.workflow_transition_events event
  where event.case_workflow_id = cw.id and event.action = 'start'
);

-- Phase 4 document types, immutable stage checklists, collaboration, and preferences.
insert into public.document_types (id, code, name_en, name_th)
values
  ('50000000-0000-0000-0000-000000000001', 'request_form', 'Procurement request form', 'แบบคำขอจัดซื้อจัดจ้าง'),
  ('50000000-0000-0000-0000-000000000002', 'technical_specification', 'Technical specification', 'ข้อกำหนดทางเทคนิค'),
  ('50000000-0000-0000-0000-000000000003', 'quotation', 'Supplier quotation', 'ใบเสนอราคา'),
  ('50000000-0000-0000-0000-000000000004', 'approval_record', 'Approval record', 'เอกสารอนุมัติ'),
  ('50000000-0000-0000-0000-000000000005', 'evaluation_record', 'Evaluation record', 'เอกสารประเมินผล'),
  ('50000000-0000-0000-0000-000000000006', 'signed_contract', 'Signed contract', 'สัญญาที่ลงนามแล้ว')
on conflict (code) do update set
  name_en = excluded.name_en,
  name_th = excluded.name_th;

select set_config('procureflow.seed_mode', 'on', false);
insert into public.workflow_step_document_requirements (
  template_step_id, document_type_id, is_required, blocks_completion,
  description_en, description_th
)
select
  step.id,
  document_type.id,
  true,
  requirement.blocks_completion,
  requirement.description_en,
  requirement.description_th
from public.workflow_template_steps step
join public.workflow_templates template on template.id = step.template_id
join (
  values
    ('request_review', 'request_form', true, 'Approved request form', 'แบบคำขอที่รับรองแล้ว'),
    ('specification', 'technical_specification', true, 'Final technical or service specification', 'ข้อกำหนดทางเทคนิคหรือขอบเขตงานฉบับสมบูรณ์'),
    ('approval', 'approval_record', true, 'Recorded procurement approval', 'เอกสารบันทึกการอนุมัติ'),
    ('evaluation', 'evaluation_record', false, 'Evaluation evidence', 'หลักฐานการประเมิน'),
    ('contracting', 'signed_contract', true, 'Signed agreement or contract', 'ข้อตกลงหรือสัญญาที่ลงนามแล้ว')
) requirement(step_key, document_type_code, blocks_completion, description_en, description_th)
  on requirement.step_key = step.step_key
join public.document_types document_type on document_type.code = requirement.document_type_code
where template.status = 'published'
on conflict (template_step_id, document_type_id) do update set
  is_required = excluded.is_required,
  blocks_completion = excluded.blocks_completion,
  description_en = excluded.description_en,
  description_th = excluded.description_th;
select set_config('procureflow.seed_mode', 'off', false);

insert into public.case_stage_document_requirements (
  stage_instance_id, case_id, document_type_id, document_type_code,
  document_type_name_en, document_type_name_th, is_required,
  blocks_completion, description_en, description_th
)
select
  stage.id, stage.case_id, requirement.document_type_id, document_type.code,
  document_type.name_en, document_type.name_th, requirement.is_required,
  requirement.blocks_completion, requirement.description_en, requirement.description_th
from public.case_stage_instances stage
join public.workflow_step_document_requirements requirement
  on requirement.template_step_id = stage.template_step_id
join public.document_types document_type on document_type.id = requirement.document_type_id
on conflict (stage_instance_id, document_type_id) do nothing;

insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

insert into public.case_comments (id, case_id, stage_instance_id, body, author_id, created_at)
values
  (
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    (select current_stage_instance_id from public.procurement_cases where id = '20000000-0000-0000-0000-000000000001'),
    'Clinical engineering confirmed the installation location.',
    '10000000-0000-0000-0000-000000000002',
    now() - interval '2 days'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    (select current_stage_instance_id from public.procurement_cases where id = '20000000-0000-0000-0000-000000000002'),
    'Please include the preventive-maintenance scope in the final contract.',
    '10000000-0000-0000-0000-000000000001',
    now() - interval '1 day'
  )
on conflict (id) do nothing;

insert into public.case_activity_events (
  case_id, event_type, summary_key, actor_id, details, occurred_at
)
select
  comment.case_id, 'comment', 'comments.added', comment.author_id,
  jsonb_build_object('comment_id', comment.id), comment.created_at
from public.case_comments comment
where not exists (
  select 1 from public.case_activity_events activity
  where activity.details ->> 'comment_id' = comment.id::text
);

select public.generate_procurement_notifications(now());

insert into public.workflow_transition_events (
  case_id, case_workflow_id, from_stage_instance_id, to_stage_instance_id,
  action, reason, performed_by, created_at
)
select
  stage.case_id, stage.case_workflow_id, stage.id,
  (select next_stage.id from public.case_stage_instances next_stage
   where next_stage.case_workflow_id = stage.case_workflow_id
     and next_stage.sequence = stage.sequence + 1 and next_stage.iteration = 1),
  case when stage.status = 'cancelled' then 'cancel' else 'complete' end,
  case when stage.status = 'cancelled' then 'Seeded cancellation history' else null end,
  stage.completed_by,
  stage.completed_at
from public.case_stage_instances stage
where stage.status in ('completed', 'cancelled')
  and stage.completed_at is not null
  and not exists (
    select 1 from public.workflow_transition_events event
    where event.from_stage_instance_id = stage.id
  );

insert into public.case_activity_events (
  case_id, event_type, summary_key, actor_id, details, occurred_at
)
select
  event.case_id, 'workflow_transition', 'workflow.' || event.action,
  event.performed_by, jsonb_build_object('event_id', event.id), event.created_at
from public.workflow_transition_events event
where not exists (
  select 1 from public.case_activity_events activity
  where activity.details ->> 'event_id' = event.id::text
);
