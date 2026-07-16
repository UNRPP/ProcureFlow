import ExcelJS from "exceljs";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import th from "../../messages/th.json";
import {
  buildPersonnelKpiWorkbook,
  buildWorkStatusWorkbook,
} from "@/lib/exports/reports";
import type {
  PersonnelKpiRow,
  ResponsibilityDetailRow,
  WorkStatusCaseDetail,
  WorkStatusRow,
} from "@/server/queries/reporting";

const personnelRows: PersonnelKpiRow[] = [
  {
    user_id: "10000000-0000-0000-0000-000000000001",
    full_name: "Alex Tan",
    step_key: "review",
    stage_name_en: "Request review",
    stage_name_th: "ตรวจสอบคำขอ",
    unique_cases: 1,
    interval_count: 2,
    minimum_days: 1.25,
    maximum_days: 2.75,
    average_days: 2,
    median_days: 2,
    total_days: 4,
    completed_cases: 1,
  },
];

const responsibilityDetails: ResponsibilityDetailRow[] = [
  {
    intervalId: "40000000-0000-0000-0000-000000000001",
    userId: "10000000-0000-0000-0000-000000000001",
    fullName: "Alex Tan",
    caseId: "20000000-0000-0000-0000-000000000001",
    caseNumber: "PRC-2026-000001",
    caseTitle: "Portable ultrasound",
    caseStatus: "completed",
    stageKey: "review",
    stageNameEn: "Request review",
    stageNameTh: "ตรวจสอบคำขอ",
    stageIteration: 1,
    startedAt: "2026-07-01T00:00:00Z",
    endedAt: "2026-07-02T06:00:00Z",
    decimalDays: 1.25,
    assignmentSource: "default",
  },
];

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

const caseDetails: WorkStatusCaseDetail[] = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    case_number: "PRC-2026-000001",
    title: "Portable ultrasound",
    description: null,
    work_category_id: "m1",
    requesting_department_id: "m1",
    fiscal_year_id: "m1",
    budget_category_id: "m1",
    budget_source_id: "m1",
    estimated_value: 500000,
    final_value: 490000,
    procurement_type_id: "m1",
    priority: "urgent",
    case_owner_id: "10000000-0000-0000-0000-000000000001",
    current_responsible_user_id: null,
    current_responsible_department_id: null,
    current_stage_instance_id: null,
    target_completion_date: "2026-08-01",
    status: "completed",
    hold_reason: null,
    cancellation_reason: null,
    completed_at: "2026-07-15T00:00:00Z",
    created_by: "10000000-0000-0000-0000-000000000001",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-15T00:00:00Z",
    workCategory: master,
    requestingDepartment: master,
    fiscalYear: master,
    budgetCategory: master,
    budgetSource: master,
    procurementType: master,
    owner: {
      id: "10000000-0000-0000-0000-000000000001",
      full_name: "Alex Tan",
    },
    responsibleUser: null,
    responsibleDepartment: null,
    currentStage: null,
  },
];

const statusRows: WorkStatusRow[] = [
  {
    group_key: "medical_device",
    group_name_en: "Medical device",
    group_name_th: "เครื่องมือแพทย์",
    total: 1,
    completed: 1,
    active_remaining: 0,
    on_hold: 0,
    cancelled: 0,
    completion_percentage: 100,
    overdue_remaining: 0,
  },
];

function saveVerificationFixture(name: string, bytes: Buffer) {
  const directory = process.env.PROCUREFLOW_WORKBOOK_OUTPUT_DIR;
  if (!directory) return;
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/${name}`, bytes);
}

describe("Phase 3 report workbooks", () => {
  it("creates a four-sheet personnel workbook with raw timestamp detail", async () => {
    const bytes = await buildPersonnelKpiWorkbook({
      rows: personnelRows,
      details: responsibilityDetails,
      locale: "en",
      messages: en,
      exportedAt: new Date("2026-07-15T00:00:00Z"),
      filterDescription: "start=2026-07-01",
    });
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x50, 0x4b]);
    saveVerificationFixture("personnel-stage-kpi-en.xlsx", bytes);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as never);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      en.reports.exports.summary,
      en.reports.exports.personnelKpi,
      en.reports.exports.stageStatistics,
      en.reports.exports.caseDetail,
    ]);
    const detail = workbook.getWorksheet(en.reports.exports.caseDetail)!;
    expect(detail.getCell("I2").value).toBeInstanceOf(Date);
    expect(detail.getCell("K2").value).toBe(1.25);
    expect(detail.autoFilter).toBeTruthy();
    expect(detail.views[0]?.state).toBe("frozen");
  });

  it("creates a reconciled work-status workbook with numeric case detail", async () => {
    const bytes = await buildWorkStatusWorkbook({
      grouping: "work_category",
      rows: statusRows,
      details: caseDetails,
      locale: "en",
      messages: en,
      exportedAt: new Date("2026-07-15T00:00:00Z"),
      filterDescription: "group=work_category",
    });
    saveVerificationFixture("work-status-en.xlsx", bytes);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as never);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      en.reports.exports.summary,
      en.reports.exports.groupedStatus,
      en.reports.exports.caseDetail,
    ]);
    const summary = workbook.getWorksheet(en.reports.exports.summary)!;
    expect(summary.getCell("B11").formula).toContain("IF(B9=B10");
    expect(summary.getCell("B11").result).toBe(en.reports.exports.reconciled);
    const detail = workbook.getWorksheet(en.reports.exports.caseDetail)!;
    expect(detail.getCell("J2").value).toBe(500000);
    expect(detail.getCell("K2").value).toBeInstanceOf(Date);
  });

  it("localizes Thai workbook headings and master data", async () => {
    const bytes = await buildWorkStatusWorkbook({
      grouping: "work_category",
      rows: statusRows,
      details: caseDetails,
      locale: "th",
      messages: th,
      exportedAt: new Date("2026-07-15T00:00:00Z"),
      filterDescription: "",
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as never);
    const grouped = workbook.getWorksheet(th.reports.exports.groupedStatus)!;
    const detail = workbook.getWorksheet(th.reports.exports.caseDetail)!;
    expect(grouped.getCell("A1").value).toBe(th.reports.columns.group);
    expect(grouped.getCell("A2").value).toBe(statusRows[0]!.group_name_th);
    expect(detail.getCell("C2").value).toBe(master.name_th);
  });
});
