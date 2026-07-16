-- Production-safe baseline data.
-- This file contains no users, credentials, procurement cases, fiscal years,
-- departments, budget data, or workflow templates. Review Thai terminology
-- with hospital procurement staff before applying it.
begin;

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

insert into public.work_categories (code, name_en, name_th)
values
  ('medical_device', 'Medical devices', 'เครื่องมือแพทย์'),
  ('medical_equipment', 'Medical equipment', 'ครุภัณฑ์การแพทย์'),
  ('service_contract', 'Contracts for services', 'สัญญาบริการ')
on conflict (code) do update set
  name_en = excluded.name_en,
  name_th = excluded.name_th,
  is_active = true,
  archived_at = null;

insert into public.document_types (code, name_en, name_th)
values
  ('request_form', 'Procurement request form', 'แบบคำขอจัดซื้อจัดจ้าง'),
  ('technical_specification', 'Technical specification', 'ข้อกำหนดทางเทคนิค'),
  ('quotation', 'Supplier quotation', 'ใบเสนอราคา'),
  ('approval_record', 'Approval record', 'เอกสารอนุมัติ'),
  ('evaluation_record', 'Evaluation record', 'เอกสารประเมินผล'),
  ('signed_contract', 'Signed contract', 'สัญญาที่ลงนามแล้ว')
on conflict (code) do update set
  name_en = excluded.name_en,
  name_th = excluded.name_th,
  is_active = true,
  archived_at = null;

commit;
