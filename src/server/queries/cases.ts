import "server-only";

import { logServerError } from "@/lib/observability/server";
import { createClient } from "@/lib/supabase/server";
import { getMasterDataCatalog } from "@/server/queries/master-data";
import type {
  CasePriority,
  CaseStatus,
  Database,
  MasterDataRecord,
  ProcurementCase,
  Profile,
  WorkCategoryCode,
} from "@/types/database";

export type CaseListItem = ProcurementCase & {
  workCategory: MasterDataRecord | null;
  requestingDepartment: MasterDataRecord | null;
  fiscalYear: MasterDataRecord | null;
  budgetCategory: MasterDataRecord | null;
  budgetSource: MasterDataRecord | null;
  procurementType: MasterDataRecord | null;
  owner: Pick<Profile, "id" | "full_name"> | null;
  responsibleUser: Pick<Profile, "id" | "full_name"> | null;
  responsibleDepartment: MasterDataRecord | null;
};

export type MyWorkItem = CaseListItem & {
  currentStage: Pick<
    Database["public"]["Tables"]["case_stage_instances"]["Row"],
    "id" | "name_en" | "name_th" | "due_at" | "entered_at" | "status"
  > | null;
  currentAssignmentAt: string | null;
};

export type ScheduledCase = CaseListItem & {
  currentStage: Pick<
    Database["public"]["Tables"]["case_stage_instances"]["Row"],
    "id" | "name_en" | "name_th" | "due_at"
  > | null;
};

export type CaseListFilters = {
  search?: string;
  status?: CaseStatus | "";
  workCategoryId?: string;
  procurementTypeId?: string;
  fiscalYearId?: string;
  ownerId?: string;
  dashboardFilter?: DashboardCaseFilter | "";
  sort?: CaseSortField;
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export const dashboardCaseFilters = [
  "active",
  "overdue",
  "due_soon",
  "unassigned",
  "completed_month",
  "active_value",
] as const;

export type DashboardCaseFilter = (typeof dashboardCaseFilters)[number];

export function isDashboardCaseFilter(
  value: string,
): value is DashboardCaseFilter {
  return dashboardCaseFilters.includes(value as DashboardCaseFilter);
}

export type CaseSortField =
  | "case_number"
  | "title"
  | "status"
  | "priority"
  | "estimated_value"
  | "target_completion_date"
  | "created_at";

export type CaseListResult =
  | {
      status: "ready";
      data: CaseListItem[];
      total: number;
      page: number;
      pageSize: number;
    }
  | { status: "unavailable" };

export type CaseFormOptions = {
  workCategories: MasterDataRecord[];
  departments: MasterDataRecord[];
  budgetCategories: MasterDataRecord[];
  budgetSources: MasterDataRecord[];
  procurementTypes: MasterDataRecord[];
  fiscalYears: MasterDataRecord[];
  profiles: Pick<Profile, "id" | "full_name" | "department_id">[];
};

export type CaseDetail =
  | {
      case: ProcurementCase;
      categoryCode: "medical_device";
      detail: Database["public"]["Tables"]["medical_device_case_details"]["Row"];
      options: CaseFormOptions;
    }
  | {
      case: ProcurementCase;
      categoryCode: "medical_equipment";
      detail: Database["public"]["Tables"]["medical_equipment_case_details"]["Row"];
      options: CaseFormOptions;
    }
  | {
      case: ProcurementCase;
      categoryCode: "service_contract";
      detail: Database["public"]["Tables"]["service_contract_case_details"]["Row"];
      options: CaseFormOptions;
    };

const caseColumns =
  "id, case_number, title, description, work_category_id, requesting_department_id, fiscal_year_id, budget_category_id, budget_source_id, estimated_value, final_value, procurement_type_id, priority, case_owner_id, current_responsible_user_id, current_responsible_department_id, current_stage_instance_id, target_completion_date, status, hold_reason, cancellation_reason, completed_at, created_by, created_at, updated_at";

function lookup<T extends { id: string }>(records: T[]): Map<string, T> {
  return new Map(records.map((record) => [record.id, record]));
}

function decorateCases(
  cases: ProcurementCase[],
  options: CaseFormOptions,
): CaseListItem[] {
  const workCategories = lookup(options.workCategories);
  const departments = lookup(options.departments);
  const fiscalYears = lookup(options.fiscalYears);
  const budgetCategories = lookup(options.budgetCategories);
  const budgetSources = lookup(options.budgetSources);
  const procurementTypes = lookup(options.procurementTypes);
  const profiles = lookup(options.profiles);

  return cases.map((procurementCase) => ({
    ...procurementCase,
    workCategory: workCategories.get(procurementCase.work_category_id) ?? null,
    requestingDepartment:
      departments.get(procurementCase.requesting_department_id) ?? null,
    fiscalYear: fiscalYears.get(procurementCase.fiscal_year_id) ?? null,
    budgetCategory:
      budgetCategories.get(procurementCase.budget_category_id) ?? null,
    budgetSource: budgetSources.get(procurementCase.budget_source_id) ?? null,
    procurementType:
      procurementTypes.get(procurementCase.procurement_type_id) ?? null,
    owner: profiles.get(procurementCase.case_owner_id) ?? null,
    responsibleUser: procurementCase.current_responsible_user_id
      ? (profiles.get(procurementCase.current_responsible_user_id) ?? null)
      : null,
    responsibleDepartment: procurementCase.current_responsible_department_id
      ? (departments.get(procurementCase.current_responsible_department_id) ??
        null)
      : null,
  }));
}

export async function getCaseFormOptions({
  includeArchived = false,
}: {
  includeArchived?: boolean;
} = {}): Promise<CaseFormOptions | null> {
  const [catalogResult, profilesResult] = await Promise.all([
    getMasterDataCatalog(),
    (async () => {
      const supabase = await createClient();
      return supabase
        .from("profiles")
        .select("id, full_name, department_id")
        .eq("is_active", true)
        .order("full_name");
    })(),
  ]);

  if (catalogResult.status !== "ready" || profilesResult.error) return null;
  const filter = (records: MasterDataRecord[]) =>
    includeArchived ? records : records.filter((record) => record.is_active);

  return {
    workCategories: filter(catalogResult.data.workCategories),
    departments: filter(catalogResult.data.departments),
    budgetCategories: filter(catalogResult.data.budgetCategories),
    budgetSources: filter(catalogResult.data.budgetSources),
    procurementTypes: filter(catalogResult.data.procurementTypes),
    fiscalYears: filter(catalogResult.data.fiscalYears),
    profiles: profilesResult.data ?? [],
  };
}

function normalizeFilters(filters: CaseListFilters) {
  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 10), 100);
  const page = Math.max(filters.page ?? 1, 1);
  return {
    ...filters,
    page,
    pageSize,
    sort: filters.sort ?? ("created_at" as const),
    direction: filters.direction ?? ("desc" as const),
  };
}

export async function listCases(
  filters: CaseListFilters = {},
): Promise<CaseListResult> {
  const normalized = normalizeFilters(filters);
  const supabase = await createClient();
  let query = supabase
    .from("procurement_cases")
    .select(caseColumns, { count: "exact" });

  const safeSearch = filters.search
    ?.trim()
    .replace(/[%,().]/g, " ")
    .slice(0, 100);
  if (safeSearch) {
    query = query.or(
      `case_number.ilike.%${safeSearch}%,title.ilike.%${safeSearch}%`,
    );
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.workCategoryId)
    query = query.eq("work_category_id", filters.workCategoryId);
  if (filters.procurementTypeId)
    query = query.eq("procurement_type_id", filters.procurementTypeId);
  if (filters.fiscalYearId)
    query = query.eq("fiscal_year_id", filters.fiscalYearId);
  if (filters.ownerId) query = query.eq("case_owner_id", filters.ownerId);
  if (filters.dashboardFilter) {
    const dashboardCases = await supabase.rpc("dashboard_case_ids", {
      filter_key: filters.dashboardFilter,
    });
    if (dashboardCases.error) {
      logServerError("case.dashboard_filter_failed", dashboardCases.error);
      return { status: "unavailable" };
    }
    query = query.in(
      "id",
      (dashboardCases.data ?? []).map((item) => item.case_id),
    );
  }

  const start = (normalized.page - 1) * normalized.pageSize;
  const [{ data, error, count }, options] = await Promise.all([
    query
      .order(normalized.sort, {
        ascending: normalized.direction === "asc",
        nullsFirst: false,
      })
      .range(start, start + normalized.pageSize - 1),
    getCaseFormOptions({ includeArchived: true }),
  ]);

  if (error || !options) {
    logServerError("case.list_query_failed", error);
    return { status: "unavailable" };
  }

  return {
    status: "ready",
    data: decorateCases((data ?? []) as ProcurementCase[], options),
    total: count ?? 0,
    page: normalized.page,
    pageSize: normalized.pageSize,
  };
}

export async function listCasesForExport(
  filters: Omit<CaseListFilters, "page" | "pageSize"> = {},
): Promise<CaseListItem[] | null> {
  const supabase = await createClient();
  const normalized = normalizeFilters(filters);
  let query = supabase.from("procurement_cases").select(caseColumns);
  const safeSearch = filters.search
    ?.trim()
    .replace(/[%,().]/g, " ")
    .slice(0, 100);
  if (safeSearch) {
    query = query.or(
      `case_number.ilike.%${safeSearch}%,title.ilike.%${safeSearch}%`,
    );
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.workCategoryId)
    query = query.eq("work_category_id", filters.workCategoryId);
  if (filters.procurementTypeId)
    query = query.eq("procurement_type_id", filters.procurementTypeId);
  if (filters.fiscalYearId)
    query = query.eq("fiscal_year_id", filters.fiscalYearId);
  if (filters.ownerId) query = query.eq("case_owner_id", filters.ownerId);
  if (filters.dashboardFilter) {
    const dashboardCases = await supabase.rpc("dashboard_case_ids", {
      filter_key: filters.dashboardFilter,
    });
    if (dashboardCases.error) return null;
    query = query.in(
      "id",
      (dashboardCases.data ?? []).map((item) => item.case_id),
    );
  }

  const [{ data, error }, options] = await Promise.all([
    query
      .order(normalized.sort, {
        ascending: normalized.direction === "asc",
        nullsFirst: false,
      })
      .limit(5000),
    getCaseFormOptions({ includeArchived: true }),
  ]);

  if (error || !options) return null;
  return decorateCases((data ?? []) as ProcurementCase[], options);
}

export async function listMyWork(userId: string): Promise<MyWorkItem[] | null> {
  const supabase = await createClient();
  const [{ data, error }, options] = await Promise.all([
    supabase
      .from("procurement_cases")
      .select(caseColumns)
      .or(`case_owner_id.eq.${userId},current_responsible_user_id.eq.${userId}`)
      .in("status", ["draft", "active", "on_hold"])
      .order("priority")
      .order("target_completion_date", { nullsFirst: false })
      .limit(500),
    getCaseFormOptions({ includeArchived: true }),
  ]);
  if (error || !options) {
    logServerError("case.my_work_query_failed", error);
    return null;
  }
  const decorated = decorateCases((data ?? []) as ProcurementCase[], options);
  const stageIds = decorated.flatMap((item) =>
    item.current_stage_instance_id ? [item.current_stage_instance_id] : [],
  );
  if (stageIds.length === 0) {
    return decorated.map((item) => ({
      ...item,
      currentStage: null,
      currentAssignmentAt: null,
    }));
  }
  const caseIds = decorated.map((item) => item.id);
  const [stagesResult, assignmentsResult] = await Promise.all([
    supabase
      .from("case_stage_instances")
      .select("id, name_en, name_th, due_at, entered_at, status")
      .in("id", stageIds),
    supabase
      .from("case_assignments")
      .select("case_id, assigned_at")
      .in("case_id", caseIds)
      .is("unassigned_at", null),
  ]);
  const workError = stagesResult.error ?? assignmentsResult.error;
  if (workError) {
    logServerError("case.my_work_detail_query_failed", workError);
    return null;
  }
  const stageById = new Map(
    (stagesResult.data ?? []).map((stage) => [stage.id, stage]),
  );
  const assignmentByCase = new Map(
    (assignmentsResult.data ?? []).map((assignment) => [
      assignment.case_id,
      assignment.assigned_at,
    ]),
  );
  return decorated.map((item) => ({
    ...item,
    currentStage: item.current_stage_instance_id
      ? (stageById.get(item.current_stage_instance_id) ?? null)
      : null,
    currentAssignmentAt: assignmentByCase.get(item.id) ?? null,
  }));
}

export async function listScheduledCases(): Promise<ScheduledCase[] | null> {
  const rows = await listCasesForExport({
    sort: "target_completion_date",
    direction: "asc",
  });
  if (!rows) return null;
  const openRows = rows.filter((item) =>
    ["draft", "active", "on_hold"].includes(item.status),
  );
  const stageIds = openRows.flatMap((item) =>
    item.current_stage_instance_id ? [item.current_stage_instance_id] : [],
  );
  if (stageIds.length === 0) {
    return openRows.map((item) => ({ ...item, currentStage: null }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_stage_instances")
    .select("id, name_en, name_th, due_at")
    .in("id", stageIds);
  if (error) {
    logServerError("case.calendar_stage_query_failed", error);
    return null;
  }
  const stageById = new Map((data ?? []).map((stage) => [stage.id, stage]));
  return openRows.map((item) => ({
    ...item,
    currentStage: item.current_stage_instance_id
      ? (stageById.get(item.current_stage_instance_id) ?? null)
      : null,
  }));
}

export async function getCaseById(id: string): Promise<CaseDetail | null> {
  const supabase = await createClient();
  const [{ data: procurementCase, error }, options] = await Promise.all([
    supabase
      .from("procurement_cases")
      .select(caseColumns)
      .eq("id", id)
      .single(),
    getCaseFormOptions({ includeArchived: true }),
  ]);
  if (error || !procurementCase || !options) return null;

  const category = options.workCategories.find(
    (record) => record.id === procurementCase.work_category_id,
  )?.code as WorkCategoryCode | undefined;
  if (!category) return null;

  if (category === "medical_device") {
    const { data: detail } = await supabase
      .from("medical_device_case_details")
      .select("*")
      .eq("case_id", id)
      .single();
    return detail
      ? {
          case: procurementCase as ProcurementCase,
          categoryCode: category,
          detail,
          options,
        }
      : null;
  }
  if (category === "medical_equipment") {
    const { data: detail } = await supabase
      .from("medical_equipment_case_details")
      .select("*")
      .eq("case_id", id)
      .single();
    return detail
      ? {
          case: procurementCase as ProcurementCase,
          categoryCode: category,
          detail,
          options,
        }
      : null;
  }

  const { data: detail } = await supabase
    .from("service_contract_case_details")
    .select("*")
    .eq("case_id", id)
    .single();
  return detail
    ? {
        case: procurementCase as ProcurementCase,
        categoryCode: category,
        detail,
        options,
      }
    : null;
}

export function isCaseStatus(value: string | undefined): value is CaseStatus {
  return ["draft", "active", "on_hold", "completed", "cancelled"].includes(
    value ?? "",
  );
}

export function isCasePriority(
  value: string | undefined,
): value is CasePriority {
  return ["normal", "urgent", "critical"].includes(value ?? "");
}
