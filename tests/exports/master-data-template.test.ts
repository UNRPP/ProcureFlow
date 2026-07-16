import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { buildMasterDataTemplate } from "@/lib/exports/master-data-template";

describe("master-data import templates", () => {
  it("creates a genuine fiscal-year workbook with import headers", async () => {
    const bytes = await buildMasterDataTemplate("fiscal_years", "en");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as never);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Import",
      "Instructions",
    ]);
    const importSheet = workbook.getWorksheet("Import")!;
    expect(
      (importSheet.getRow(1).values as ExcelJS.CellValue[]).slice(1),
    ).toEqual(["code", "name_en", "name_th", "year", "starts_on", "ends_on"]);
  });
});
