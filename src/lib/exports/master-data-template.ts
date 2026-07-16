import { Buffer } from "node:buffer";
import ExcelJS from "exceljs";

import type { EditableMasterDataTable } from "@/features/settings/master-data";
import type { Locale } from "@/lib/i18n/config";

const baseHeaders = ["code", "name_en", "name_th"];

const examples: Record<EditableMasterDataTable, string[]> = {
  departments: ["surgery_department", "Surgery Department", "แผนกศัลยกรรม"],
  budget_categories: ["capital_equipment", "Capital Equipment", "ครุภัณฑ์"],
  budget_sources: ["government_budget", "Government Budget", "งบประมาณแผ่นดิน"],
  procurement_types: ["open_tender", "Open Tender", "ประกวดราคาอิเล็กทรอนิกส์"],
  fiscal_years: [
    "FY2026",
    "FY 2026",
    "ปีงบประมาณ 2569",
    "2026",
    "2025-10-01",
    "2026-09-30",
  ],
  document_types: [
    "technical_specification",
    "Technical Specification",
    "ข้อกำหนดคุณลักษณะ",
  ],
};

export async function buildMasterDataTemplate(
  table: EditableMasterDataTable,
  locale: Locale,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ProcureFlow";
  const headers =
    table === "fiscal_years"
      ? [...baseHeaders, "year", "starts_on", "ends_on"]
      : baseHeaders;
  const importSheet = workbook.addWorksheet("Import", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  importSheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.max(16, header.length + 5),
  }));
  importSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  importSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1559C7" },
  };
  importSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };
  importSheet.getColumn("starts_on").numFmt = "yyyy-mm-dd";
  importSheet.getColumn("ends_on").numFmt = "yyyy-mm-dd";

  const guide = workbook.addWorksheet("Instructions");
  guide.columns = [{ width: 24 }, { width: 80 }];
  const language = locale === "th" ? "ไทย" : "English";
  guide.addRows([
    [
      locale === "th"
        ? "แม่แบบนำเข้าข้อมูลหลัก"
        : "Master-data import template",
      "",
    ],
    [locale === "th" ? "ภาษา" : "Language", language],
    [
      locale === "th" ? "วิธีใช้" : "How to use",
      locale === "th"
        ? "กรอกข้อมูลในแผ่นงาน Import เท่านั้น ห้ามเปลี่ยนชื่อหัวคอลัมน์ ลบแถวตัวอย่างนี้ได้"
        : "Enter records only in the Import sheet. Do not rename headers. The example below is not imported.",
    ],
    [locale === "th" ? "ตัวอย่าง" : "Example", examples[table].join(" | ")],
  ]);
  guide.getRow(1).font = { bold: true, size: 16, color: { argb: "FF123263" } };
  guide.getColumn(1).font = { bold: true };
  guide.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
