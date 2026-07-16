import ExcelJS from "exceljs";
import { Buffer } from "node:buffer";

import { formatDate } from "@/lib/i18n/format";
import { localizedMasterDataName } from "@/lib/i18n/master-data";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import type { CaseListItem } from "@/server/queries/cases";

type ExportContext = {
  rows: CaseListItem[];
  locale: Locale;
  messages: Messages;
  exportedAt: Date;
  filterDescription: string;
};

function exportRows({ rows, locale, messages }: ExportContext) {
  const t = messages.cases;
  const name = (record: { name_en: string; name_th: string } | null) =>
    record
      ? localizedMasterDataName(record, locale)
      : messages.common.notProvided;

  return rows.map((item) => [
    item.case_number,
    item.title,
    name(item.workCategory),
    name(item.requestingDepartment),
    name(item.fiscalYear),
    name(item.budgetCategory),
    name(item.budgetSource),
    item.estimated_value,
    item.final_value,
    name(item.procurementType),
    t.priorities[item.priority],
    item.owner?.full_name ?? messages.common.notProvided,
    item.responsibleUser?.full_name ??
      (item.responsibleDepartment
        ? name(item.responsibleDepartment)
        : t.table.unassigned),
    item.target_completion_date
      ? new Date(`${item.target_completion_date}T00:00:00Z`)
      : null,
    t.statuses[item.status],
    new Date(item.created_at),
    new Date(item.updated_at),
  ]);
}

export function buildCasesCsv(context: ExportContext): string {
  const { messages, locale } = context;
  const f = messages.cases.fields;
  const headers = [
    f.caseNumber,
    f.title,
    f.workCategory,
    f.requestingDepartment,
    f.fiscalYear,
    f.budgetCategory,
    f.budgetSource,
    f.estimatedValue,
    f.finalValue,
    f.procurementType,
    f.priority,
    f.caseOwner,
    f.responsibleParty,
    f.targetCompletionDate,
    f.status,
    f.createdAt,
    f.updatedAt,
  ];
  const values = exportRows(context).map((row) =>
    row.map((value) => {
      if (value instanceof Date) {
        return formatDate(value, locale, {
          dateStyle: "medium",
          timeStyle: "short",
        });
      }
      return value ?? "";
    }),
  );
  const escape = (value: unknown) => {
    const stringValue = String(value ?? "");
    return /[",\r\n]/.test(stringValue)
      ? `"${stringValue.replaceAll('"', '""')}"`
      : stringValue;
  };
  return (
    "\uFEFF" +
    [headers, ...values].map((row) => row.map(escape).join(",")).join("\r\n")
  );
}

export async function buildCaseStatusWorkbook(
  context: ExportContext,
): Promise<Buffer> {
  const { messages, locale, exportedAt, filterDescription } = context;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ProcureFlow";
  workbook.created = exportedAt;
  workbook.modified = exportedAt;
  workbook.properties.date1904 = false;

  const t = messages.cases;
  const f = t.fields;
  const sheet = workbook.addWorksheet(t.exports.sheetName.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });
  sheet.columns = [
    { header: f.caseNumber, key: "caseNumber", width: 20 },
    { header: f.title, key: "title", width: 34 },
    { header: f.workCategory, key: "category", width: 22 },
    { header: f.requestingDepartment, key: "department", width: 24 },
    { header: f.fiscalYear, key: "fiscalYear", width: 18 },
    { header: f.budgetCategory, key: "budgetCategory", width: 22 },
    { header: f.budgetSource, key: "budgetSource", width: 24 },
    { header: f.estimatedValue, key: "estimatedValue", width: 18 },
    { header: f.finalValue, key: "finalValue", width: 18 },
    { header: f.procurementType, key: "procurementType", width: 22 },
    { header: f.priority, key: "priority", width: 14 },
    { header: f.caseOwner, key: "owner", width: 22 },
    { header: f.responsibleParty, key: "responsible", width: 24 },
    { header: f.targetCompletionDate, key: "target", width: 18 },
    { header: f.status, key: "status", width: 15 },
    { header: f.createdAt, key: "createdAt", width: 20 },
    { header: f.updatedAt, key: "updatedAt", width: 20 },
  ];
  exportRows(context).forEach((row) => sheet.addRow(row));
  const header = sheet.getRow(1);
  header.height = 24;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { vertical: "middle", horizontal: "left" };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1559C7" },
  };
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(sheet.rowCount, 1), column: sheet.columnCount },
  };
  sheet.getColumn(8).numFmt = '#,##0.00" THB"';
  sheet.getColumn(9).numFmt = '#,##0.00" THB"';
  sheet.getColumn(14).numFmt = "yyyy-mm-dd";
  sheet.getColumn(16).numFmt = "yyyy-mm-dd hh:mm";
  sheet.getColumn(17).numFmt = "yyyy-mm-dd hh:mm";
  sheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "top", wrapText: rowNumber !== 1 };
    if (rowNumber > 1 && rowNumber % 2 === 1) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF4F7FB" },
      };
    }
  });

  const details = workbook.addWorksheet(t.exports.filtersSheet.slice(0, 31));
  details.columns = [{ width: 24 }, { width: 80 }];
  details.addRows([
    [t.exports.title, ""],
    [t.exports.exportedAt, exportedAt],
    [t.exports.language, locale === "th" ? "ไทย" : "English"],
    [t.exports.appliedFilters, filterDescription || t.exports.none],
    [t.table.results.replace("{count}", String(context.rows.length)), ""],
    [t.exports.limited, ""],
  ]);
  details.getRow(1).font = {
    bold: true,
    size: 16,
    color: { argb: "FF123263" },
  };
  details.getColumn(1).font = { bold: true };
  details.getCell("B2").numFmt = "yyyy-mm-dd hh:mm";
  details.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
