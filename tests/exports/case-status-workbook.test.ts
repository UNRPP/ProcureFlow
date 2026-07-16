import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import th from "../../messages/th.json";
import {
  buildCasesCsv,
  buildCaseStatusWorkbook,
} from "@/lib/exports/case-status";
import type { CaseListItem } from "@/server/queries/cases";

const master = {
  id: "m1",
  code: "sample",
  name_en: "English label",
  name_th: "ป้ายภาษาไทย",
  is_active: true,
  archived_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const row: CaseListItem = {
  id: "c1",
  case_number: "PRC-2026-000001",
  title: "Patient monitor",
  description: null,
  work_category_id: "m1",
  requesting_department_id: "m1",
  fiscal_year_id: "m1",
  budget_category_id: "m1",
  budget_source_id: "m1",
  estimated_value: 125000.5,
  final_value: null,
  procurement_type_id: "m1",
  priority: "urgent",
  case_owner_id: "u1",
  current_responsible_user_id: null,
  current_responsible_department_id: null,
  current_stage_instance_id: null,
  target_completion_date: "2026-09-30",
  status: "active",
  hold_reason: null,
  cancellation_reason: null,
  completed_at: null,
  created_by: "u1",
  created_at: "2026-07-01T02:00:00Z",
  updated_at: "2026-07-02T02:00:00Z",
  workCategory: master,
  requestingDepartment: master,
  fiscalYear: master,
  budgetCategory: master,
  budgetSource: master,
  procurementType: master,
  owner: { id: "u1", full_name: "Narin Wongsa" },
  responsibleUser: null,
  responsibleDepartment: null,
};

describe("case-status exports", () => {
  it("creates a genuine workbook with numeric and date cells", async () => {
    const bytes = await buildCaseStatusWorkbook({
      rows: [row],
      locale: "en",
      messages: en,
      exportedAt: new Date("2026-07-15T00:00:00Z"),
      filterDescription: "status=active",
    });
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x50, 0x4b]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as never);
    const sheet = workbook.getWorksheet(en.cases.exports.sheetName);
    expect(sheet).toBeDefined();
    expect(sheet!.getCell("H2").value).toBe(125000.5);
    expect(sheet!.getCell("N2").value).toBeInstanceOf(Date);
    expect(sheet!.autoFilter).toBeTruthy();
    expect(sheet!.views[0]?.state).toBe("frozen");
  });

  it("uses Thai headings and localized master-data labels", async () => {
    const bytes = await buildCaseStatusWorkbook({
      rows: [row],
      locale: "th",
      messages: th,
      exportedAt: new Date("2026-07-15T00:00:00Z"),
      filterDescription: "",
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as never);
    const sheet = workbook.getWorksheet(th.cases.exports.sheetName);
    expect(sheet!.getCell("A1").value).toBe(th.cases.fields.caseNumber);
    expect(sheet!.getCell("C2").value).toBe(master.name_th);
  });

  it("emits UTF-8 CSV with localized headings", () => {
    const csv = buildCasesCsv({
      rows: [row],
      locale: "th",
      messages: th,
      exportedAt: new Date("2026-07-15T00:00:00Z"),
      filterDescription: "",
    });
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain(th.cases.fields.caseNumber);
    expect(csv).toContain(master.name_th);
  });
});
