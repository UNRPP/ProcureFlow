"use server";

import { revalidatePath } from "next/cache";
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

export type MasterDataInput = {
  table: EditableMasterDataTable;
  code: string;
  nameEn: string;
  nameTh: string;
  year?: number;
  startsOn?: string;
  endsOn?: string;
};

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
