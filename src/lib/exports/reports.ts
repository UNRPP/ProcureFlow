import ExcelJS from "exceljs";
import { Buffer } from "node:buffer";

import {
  groupedTotalsReconcile,
  summarizeResponsibilityDetailsByStage,
} from "@/features/reports/metrics";
import type { Locale } from "@/lib/i18n/config";
import { localizedMasterDataName } from "@/lib/i18n/master-data";
import type { Messages } from "@/lib/i18n/messages";
import type {
  PersonnelKpiRow,
  ResponsibilityDetailRow,
  WorkStatusCaseDetail,
  WorkStatusRow,
} from "@/server/queries/reporting";
import type { CaseStatus } from "@/types/database";

const blue = "FF1559C7";
const paleBlue = "FFEAF2FF";
const paleGray = "FFF4F7FB";
const darkBlue = "FF123263";

type BaseContext = {
  locale: Locale;
  messages: Messages;
  exportedAt: Date;
  filterDescription: string;
};

export type PersonnelWorkbookContext = BaseContext & {
  rows: PersonnelKpiRow[];
  details: ResponsibilityDetailRow[];
};

export type WorkStatusWorkbookContext = BaseContext & {
  grouping: keyof Messages["reports"]["groupings"];
  rows: WorkStatusRow[];
  details: WorkStatusCaseDetail[];
};

function createWorkbook(exportedAt: Date) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ProcureFlow";
  workbook.created = exportedAt;
  workbook.modified = exportedAt;
  workbook.properties.date1904 = false;
  return workbook;
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  name: string,
  title: string,
  rows: Array<[string, ExcelJS.CellValue]>,
) {
  const sheet = workbook.addWorksheet(name.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 2, showGridLines: false }],
  });
  sheet.columns = [{ width: 30 }, { width: 82 }];
  sheet.addRow([title]);
  sheet.mergeCells("A1:B1");
  sheet.getRow(1).height = 30;
  sheet.getCell("A1").font = {
    bold: true,
    size: 17,
    color: { argb: darkBlue },
  };
  sheet.getCell("A1").alignment = { vertical: "middle" };
  sheet.addRow([]);
  rows.forEach((row) => sheet.addRow(row));
  for (let rowNumber = 3; rowNumber <= sheet.rowCount; rowNumber += 1) {
    sheet.getCell(rowNumber, 1).font = {
      bold: true,
      color: { argb: darkBlue },
    };
  }
  sheet.getCell("B4").numFmt = "yyyy-mm-dd hh:mm";
  sheet.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      if (rowNumber > 2 && rowNumber % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: paleGray },
        };
      }
    });
  });
  return sheet;
}

function addTableSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: Array<{ header: string; width: number }>,
  rows: ExcelJS.CellValue[][],
) {
  const sheet = workbook.addWorksheet(name.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });
  sheet.columns = columns.map((column) => ({
    header: column.header,
    width: column.width,
  }));
  rows.forEach((row) => sheet.addRow(row));
  const header = sheet.getRow(1);
  header.height = 25;
  header.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: blue },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(sheet.rowCount, 1), column: sheet.columnCount },
  };
  sheet.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.alignment = { vertical: "top", wrapText: rowNumber !== 1 };
      if (rowNumber > 1 && rowNumber % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: paleGray },
        };
      }
    });
  });
  return sheet;
}

function setColumnNumberFormat(
  sheet: ExcelJS.Worksheet,
  column: number,
  numberFormat: string,
) {
  for (let row = 2; row <= sheet.rowCount; row += 1) {
    sheet.getCell(row, column).numFmt = numberFormat;
  }
}

function formulaSheetName(name: string) {
  return `'${name.replaceAll("'", "''")}'`;
}

function statusLabel(status: string, messages: Messages) {
  return messages.cases.statuses[status as CaseStatus] ?? status;
}

function assignmentSourceLabel(source: string, messages: Messages) {
  const values = messages.reports.assignmentSources as Record<string, string>;
  return values[source] ?? source;
}

export async function buildPersonnelKpiWorkbook(
  context: PersonnelWorkbookContext,
): Promise<Buffer> {
  const { rows, details, locale, messages, exportedAt, filterDescription } =
    context;
  const workbook = createWorkbook(exportedAt);
  const t = messages.reports;
  const c = t.columns;
  const e = t.exports;
  const stageStatistics = summarizeResponsibilityDetailsByStage(details);
  const totalDays = details.reduce((sum, row) => sum + row.decimalDays, 0);

  const summary = addSummarySheet(workbook, e.summary, t.personnelTitle, [
    [e.report, t.personnelTitle],
    [e.exportTime, exportedAt],
    [e.language, locale === "th" ? "ไทย" : "English"],
    [e.criteria, filterDescription],
    [e.rowCount, rows.length],
    [e.detailCount, details.length],
    [c.totalDays, totalDays],
    [e.reconciliation, e.decimalDayNote],
  ]);
  const personnel = addTableSheet(
    workbook,
    e.personnelKpi,
    [
      { header: c.personnel, width: 24 },
      { header: c.stage, width: 24 },
      { header: c.uniqueCases, width: 14 },
      { header: c.intervalCount, width: 14 },
      { header: c.minimumDays, width: 16 },
      { header: c.maximumDays, width: 16 },
      { header: c.averageDays, width: 16 },
      { header: c.medianDays, width: 16 },
      { header: c.totalDays, width: 16 },
      { header: c.completedCases, width: 16 },
    ],
    rows.map((row) => [
      row.full_name,
      locale === "th" ? row.stage_name_th : row.stage_name_en,
      Number(row.unique_cases),
      Number(row.interval_count),
      Number(row.minimum_days),
      Number(row.maximum_days),
      Number(row.average_days),
      Number(row.median_days),
      Number(row.total_days),
      Number(row.completed_cases),
    ]),
  );
  for (let column = 5; column <= 9; column += 1) {
    setColumnNumberFormat(personnel, column, "0.0000");
  }

  const stages = addTableSheet(
    workbook,
    e.stageStatistics,
    [
      { header: messages.workflows.fields.stepKey, width: 20 },
      { header: c.stage, width: 25 },
      { header: c.uniqueCases, width: 14 },
      { header: c.intervalCount, width: 14 },
      { header: c.minimumDays, width: 16 },
      { header: c.maximumDays, width: 16 },
      { header: c.averageDays, width: 16 },
      { header: c.medianDays, width: 16 },
      { header: c.totalDays, width: 16 },
      { header: c.completedCases, width: 16 },
    ],
    stageStatistics.map((row) => [
      row.stepKey,
      locale === "th" ? row.stageNameTh : row.stageNameEn,
      row.uniqueCases,
      row.intervalCount,
      row.minimumDays,
      row.maximumDays,
      row.averageDays,
      row.medianDays,
      row.totalDays,
      row.completedCases,
    ]),
  );
  for (let column = 5; column <= 9; column += 1) {
    setColumnNumberFormat(stages, column, "0.0000");
  }

  const detail = addTableSheet(
    workbook,
    e.caseDetail,
    [
      { header: e.intervalId, width: 38 },
      { header: c.personnel, width: 24 },
      { header: messages.cases.fields.caseNumber, width: 20 },
      { header: messages.cases.fields.title, width: 34 },
      { header: messages.cases.fields.status, width: 16 },
      { header: messages.workflows.fields.stepKey, width: 18 },
      { header: c.stage, width: 24 },
      { header: e.stageIteration, width: 14 },
      { header: e.startedAt, width: 22 },
      { header: e.endedAt, width: 22 },
      { header: c.totalDays, width: 16 },
      { header: e.assignmentSource, width: 20 },
    ],
    details.map((row) => [
      row.intervalId,
      row.fullName,
      row.caseNumber,
      row.caseTitle,
      statusLabel(row.caseStatus, messages),
      row.stageKey,
      locale === "th" ? row.stageNameTh : row.stageNameEn,
      row.stageIteration,
      new Date(row.startedAt),
      row.endedAt ? new Date(row.endedAt) : null,
      row.decimalDays,
      assignmentSourceLabel(row.assignmentSource, messages),
    ]),
  );
  setColumnNumberFormat(detail, 9, "yyyy-mm-dd hh:mm:ss");
  setColumnNumberFormat(detail, 10, "yyyy-mm-dd hh:mm:ss");
  setColumnNumberFormat(detail, 11, "0.0000");
  const personnelEndRow = Math.max(rows.length + 1, 2);
  const detailEndRow = Math.max(details.length + 1, 2);
  summary.getCell("B7").value = {
    formula: `COUNTA(${formulaSheetName(e.personnelKpi)}!A2:A${personnelEndRow})`,
    result: rows.length,
  };
  summary.getCell("B8").value = {
    formula: `COUNTA(${formulaSheetName(e.caseDetail)}!A2:A${detailEndRow})`,
    result: details.length,
  };
  summary.getCell("B9").value = {
    formula: `SUM(${formulaSheetName(e.caseDetail)}!K2:K${detailEndRow})`,
    result: totalDays,
  };
  summary.getCell("B9").numFmt = "0.0000";

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function buildWorkStatusWorkbook(
  context: WorkStatusWorkbookContext,
): Promise<Buffer> {
  const {
    rows,
    details,
    locale,
    messages,
    exportedAt,
    filterDescription,
    grouping,
  } = context;
  const workbook = createWorkbook(exportedAt);
  const t = messages.reports;
  const c = t.columns;
  const e = t.exports;
  const groupedTotal = rows.reduce((sum, row) => sum + Number(row.total), 0);
  const reconciled = groupedTotalsReconcile(
    rows.map((row) => row.total),
    details.length,
  );

  const summary = addSummarySheet(workbook, e.summary, t.workStatusTitle, [
    [e.report, t.workStatusTitle],
    [e.exportTime, exportedAt],
    [e.language, locale === "th" ? "ไทย" : "English"],
    [e.criteria, filterDescription],
    [e.grouping, t.groupings[grouping]],
    [e.rowCount, rows.length],
    [e.groupedTotal, groupedTotal],
    [e.caseTotal, details.length],
    [e.reconciliation, reconciled ? e.reconciled : e.notReconciled],
  ]);
  const grouped = addTableSheet(
    workbook,
    e.groupedStatus,
    [
      { header: c.group, width: 30 },
      { header: c.total, width: 14 },
      { header: c.completed, width: 14 },
      { header: c.activeRemaining, width: 18 },
      { header: c.onHold, width: 14 },
      { header: c.cancelled, width: 14 },
      { header: c.completionPercentage, width: 18 },
      { header: c.overdueRemaining, width: 18 },
    ],
    rows.map((row) => [
      locale === "th" ? row.group_name_th : row.group_name_en,
      Number(row.total),
      Number(row.completed),
      Number(row.active_remaining),
      Number(row.on_hold),
      Number(row.cancelled),
      Number(row.completion_percentage) / 100,
      Number(row.overdue_remaining),
    ]),
  );
  setColumnNumberFormat(grouped, 7, "0.00%");

  const name = (record: { name_en: string; name_th: string } | null) =>
    record
      ? localizedMasterDataName(record, locale)
      : messages.common.notProvided;
  const detail = addTableSheet(
    workbook,
    e.caseDetail,
    [
      { header: messages.cases.fields.caseNumber, width: 20 },
      { header: messages.cases.fields.title, width: 34 },
      { header: messages.cases.fields.workCategory, width: 22 },
      { header: messages.cases.fields.requestingDepartment, width: 24 },
      { header: messages.cases.fields.procurementType, width: 22 },
      { header: messages.cases.fields.caseOwner, width: 24 },
      { header: messages.workflows.currentStage, width: 24 },
      { header: messages.cases.fields.targetCompletionDate, width: 18 },
      { header: messages.cases.fields.status, width: 16 },
      { header: messages.cases.fields.estimatedValue, width: 19 },
      { header: messages.cases.fields.createdAt, width: 22 },
    ],
    details.map((row) => [
      row.case_number,
      row.title,
      name(row.workCategory),
      name(row.requestingDepartment),
      name(row.procurementType),
      row.owner?.full_name ?? messages.common.notProvided,
      row.currentStage
        ? locale === "th"
          ? row.currentStage.name_th
          : row.currentStage.name_en
        : messages.cases.table.unassigned,
      row.target_completion_date
        ? new Date(`${row.target_completion_date}T00:00:00Z`)
        : null,
      statusLabel(row.status, messages),
      Number(row.estimated_value),
      new Date(row.created_at),
    ]),
  );
  setColumnNumberFormat(detail, 8, "yyyy-mm-dd");
  setColumnNumberFormat(detail, 10, '#,##0.00" THB"');
  setColumnNumberFormat(detail, 11, "yyyy-mm-dd hh:mm:ss");
  const groupedEndRow = Math.max(rows.length + 1, 2);
  const detailEndRow = Math.max(details.length + 1, 2);
  const groupedSheet = formulaSheetName(e.groupedStatus);
  const detailSheet = formulaSheetName(e.caseDetail);
  const escapedSuccess = e.reconciled.replaceAll('"', '""');
  const escapedFailure = e.notReconciled.replaceAll('"', '""');
  summary.getCell("B8").value = {
    formula: `COUNTA(${groupedSheet}!A2:A${groupedEndRow})`,
    result: rows.length,
  };
  summary.getCell("B9").value = {
    formula: `SUM(${groupedSheet}!B2:B${groupedEndRow})`,
    result: groupedTotal,
  };
  summary.getCell("B10").value = {
    formula: `COUNTA(${detailSheet}!A2:A${detailEndRow})`,
    result: details.length,
  };
  summary.getCell("B11").value = {
    formula: `IF(B9=B10,"${escapedSuccess}","${escapedFailure}")`,
    result: reconciled ? e.reconciled : e.notReconciled,
  };
  summary.getCell("B11").font = {
    bold: true,
    color: { argb: reconciled ? "FF20834A" : "FFCA2A2A" },
  };
  for (const address of ["A3", "B3"]) {
    summary.getCell(address).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: paleBlue },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
