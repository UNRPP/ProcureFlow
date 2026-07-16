import "server-only";

import { logServerError } from "@/lib/observability/server";
import { createClient } from "@/lib/supabase/server";
import type { MasterDataRecord } from "@/types/database";

export type MasterDataCatalog = {
  workCategories: MasterDataRecord[];
  departments: MasterDataRecord[];
  budgetCategories: MasterDataRecord[];
  budgetSources: MasterDataRecord[];
  procurementTypes: MasterDataRecord[];
  fiscalYears: MasterDataRecord[];
  documentTypes: MasterDataRecord[];
};

export type MasterDataResult =
  { status: "ready"; data: MasterDataCatalog } | { status: "unavailable" };

const columns =
  "id, code, name_en, name_th, is_active, archived_at, created_at, updated_at";

export async function getMasterDataCatalog(): Promise<MasterDataResult> {
  const supabase = await createClient();

  try {
    const results = await Promise.all([
      supabase.from("work_categories").select(columns).order("name_en"),
      supabase.from("departments").select(columns).order("name_en"),
      supabase.from("budget_categories").select(columns).order("name_en"),
      supabase.from("budget_sources").select(columns).order("name_en"),
      supabase.from("procurement_types").select(columns).order("name_en"),
      supabase.from("fiscal_years").select(columns).order("year", {
        ascending: false,
      }),
      supabase.from("document_types").select(columns).order("name_en"),
    ]);

    const failedQuery = results.find((result) => result.error);
    if (failedQuery?.error) {
      logServerError("master_data.query_failed", failedQuery.error);
      return { status: "unavailable" };
    }

    const [
      workCategories,
      departments,
      budgetCategories,
      budgetSources,
      procurementTypes,
      fiscalYears,
      documentTypes,
    ] = results;

    return {
      status: "ready",
      data: {
        workCategories: workCategories.data ?? [],
        departments: departments.data ?? [],
        budgetCategories: budgetCategories.data ?? [],
        budgetSources: budgetSources.data ?? [],
        procurementTypes: procurementTypes.data ?? [],
        fiscalYears: fiscalYears.data ?? [],
        documentTypes: documentTypes.data ?? [],
      },
    };
  } catch (error) {
    logServerError("master_data.connection_failed", error);
    return { status: "unavailable" };
  }
}
