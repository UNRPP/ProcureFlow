"use server";

import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { z } from "zod";

import {
  isEditableMasterDataTable,
  type EditableMasterDataTable,
} from "@/features/settings/master-data";
import { getI18n } from "@/lib/i18n/server";
import { logServerError } from "@/lib/observability/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/queries/profile";

export type MasterDataActionState =
  { status: "success"; message: string } | { status: "error"; message: string };

export async function manageDemoDataAction(
  operation: "seed" | "clear",
): Promise<MasterDataActionState> {
  const [{ messages }, currentUser] = await Promise.all([getI18n(), getCurrentProfile()]);
  if (!currentUser?.roles.includes("super_admin")) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const supabase = await createClient();
  const result = await supabase.rpc(operation === "seed" ? "seed_demo_data" : "clear_demo_data");
  if (result.error) {
    logServerError("demo_data.manage_failed", result.error, {
      operation,
      databaseMessage: result.error.message,
    });
    return { status: "error", message: messages.settings.demoFailed };
  }
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/cases");
  revalidatePath("/my-work");
  revalidatePath("/calendar");
  revalidatePath("/reports");
  revalidatePath("/settings");
  return {
    status: "success",
    message: operation === "seed"
      ? messages.settings.demoSeeded.replace("{count}", String(result.data))
      : messages.settings.demoCleared.replace("{count}", String(result.data)),
  };
}

export type MasterDataInput = {
  table: EditableMasterDataTable;
  code: string;
  nameEn: string;
  nameTh: string;
  year?: number;
  startsOn?: string;
  endsOn?: string;
};

function cellText(value: ExcelJS.CellValue): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && value && "text" in value) return String(value.text).trim();
  return String(value ?? "").trim();
}

export async function importMasterDataAction(formData: FormData): Promise<MasterDataActionState> {
  const [{ messages }, currentUser] = await Promise.all([getI18n(), getCurrentProfile()]);
  if (!currentUser?.roles.includes("super_admin")) return { status: "error", message: messages.cases.errors.unauthorized };
  const table = String(formData.get("table") ?? "");
  const file = formData.get("file");
  if (!isEditableMasterDataTable(table) || !(file instanceof File) || file.size === 0 || file.size > 1024 * 1024) {
    return { status: "error", message: messages.settings.importInvalid };
  }
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.getWorksheet("Import");
    const headers = table === "fiscal_years" ? ["code", "name_en", "name_th", "year", "starts_on", "ends_on"] : ["code", "name_en", "name_th"];
    if (!sheet || headers.some((header, index) => cellText(sheet.getRow(1).getCell(index + 1).value) !== header)) {
      return { status: "error", message: messages.settings.importInvalid };
    }
    const rows: Record<string, unknown>[] = [];
    for (let index = 2; index <= sheet.rowCount; index += 1) {
      const values = headers.map((_, column) => cellText(sheet.getRow(index).getCell(column + 1).value));
      if (values.every((value) => !value)) continue;
      if (values.some((value) => !value) || (table === "fiscal_years" && (!/^FY\d{4}$/.test(values[0] ?? "") || !/^\d{4}$/.test(values[3] ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(values[4] ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(values[5] ?? "")))) {
        return { status: "error", message: messages.settings.importInvalid };
      }
      rows.push(Object.fromEntries(headers.map((header, column) => [header, header === "year" ? Number(values[column]) : values[column]])));
    }
    if (rows.length === 0 || rows.length > 500) return { status: "error", message: messages.settings.importInvalid };
    const supabase = await createClient();
    const result = await supabase.rpc("import_master_data_batch", { target_table: table, import_rows: rows });
    if (result.error) {
      logServerError("master_data.import_failed", result.error);
      return { status: "error", message: messages.settings.importFailed };
    }
    revalidatePath("/settings"); revalidatePath("/cases");
    return { status: "success", message: messages.settings.imported.replace("{count}", String(result.data)) };
  } catch (error) {
    logServerError("master_data.import_parse_failed", error);
    return { status: "error", message: messages.settings.importInvalid };
  }
}

export async function createMasterDataAction(
  input: MasterDataInput,
): Promise<MasterDataActionState> {
  const [{ messages }, currentUser] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
  ]);
  if (!currentUser?.roles.includes("super_admin")) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const baseSchema = z.object({
    table: z.string().refine(isEditableMasterDataTable),
    code: z.string().regex(/^[a-z][a-z0-9_]*$|^FY[0-9]{4}$/),
    nameEn: z.string().trim().min(1),
    nameTh: z.string().trim().min(1),
    year: z.number().int().min(2000).max(2200).optional(),
    startsOn: z.string().date().optional(),
    endsOn: z.string().date().optional(),
  });
  const parsed = baseSchema.safeParse(input);
  if (
    !parsed.success ||
    (input.table === "fiscal_years" &&
      (!input.year ||
        !input.startsOn ||
        !input.endsOn ||
        input.endsOn < input.startsOn))
  ) {
    return { status: "error", message: messages.cases.errors.validation };
  }
  const supabase = await createClient();
  const base = {
    code: parsed.data.code,
    name_en: parsed.data.nameEn,
    name_th: parsed.data.nameTh,
    is_active: true,
    archived_at: null,
  };
  const result =
    parsed.data.table === "fiscal_years"
      ? await supabase.from("fiscal_years").insert({
          ...base,
          year: parsed.data.year!,
          starts_on: parsed.data.startsOn!,
          ends_on: parsed.data.endsOn!,
        })
      : parsed.data.table === "departments"
        ? await supabase.from("departments").insert(base)
        : parsed.data.table === "budget_categories"
          ? await supabase.from("budget_categories").insert(base)
          : parsed.data.table === "budget_sources"
            ? await supabase.from("budget_sources").insert(base)
            : parsed.data.table === "procurement_types"
              ? await supabase.from("procurement_types").insert(base)
              : await supabase.from("document_types").insert(base);
  if (result.error) {
    logServerError("master_data.create_failed", result.error);
    return { status: "error", message: messages.settings.saveFailed };
  }
  revalidatePath("/settings");
  revalidatePath("/cases");
  return { status: "success", message: messages.settings.saved };
}

export async function setMasterDataActiveAction({
  table,
  id,
  active,
}: {
  table: string;
  id: string;
  active: boolean;
}): Promise<MasterDataActionState> {
  const [{ messages }, currentUser] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
  ]);
  if (
    !currentUser?.roles.includes("super_admin") ||
    !isEditableMasterDataTable(table) ||
    !z.string().uuid().safeParse(id).success
  ) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const supabase = await createClient();
  const values = {
    is_active: active,
    archived_at: active ? null : new Date().toISOString(),
  };
  const result =
    table === "departments"
      ? await supabase.from("departments").update(values).eq("id", id)
      : table === "budget_categories"
        ? await supabase.from("budget_categories").update(values).eq("id", id)
        : table === "budget_sources"
          ? await supabase.from("budget_sources").update(values).eq("id", id)
          : table === "procurement_types"
            ? await supabase
                .from("procurement_types")
                .update(values)
                .eq("id", id)
            : table === "fiscal_years"
              ? await supabase.from("fiscal_years").update(values).eq("id", id)
              : await supabase
                  .from("document_types")
                  .update(values)
                  .eq("id", id);
  if (result.error) {
    logServerError("master_data.status_update_failed", result.error);
    return { status: "error", message: messages.settings.saveFailed };
  }
  revalidatePath("/settings");
  revalidatePath("/cases");
  return { status: "success", message: messages.settings.saved };
}
