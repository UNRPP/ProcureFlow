import "server-only";

import { responsibilityIntervalDays } from "@/features/workflows/rules";
import { logServerError } from "@/lib/observability/server";
import { createClient } from "@/lib/supabase/server";
import { listCasesForExport, type CaseListItem } from "@/server/queries/cases";
import type { Database } from "@/types/database";

export type DashboardBreakdown = {
  key: string;
  name_en: string;
  name_th: string;
  total: number;
};

export type DashboardReport = {
  summary: {
    active_cases: number;
    overdue_cases: number;
    due_soon: number;
    unassigned_cases: number;
    completed_this_month: number;
    active_estimated_value: number;
  };
  categories: DashboardBreakdown[];
  procurement_types: DashboardBreakdown[];
  stages: DashboardBreakdown[];
  budget_categories: DashboardBreakdown[];
  trend: { month: string; created: number; completed: number }[];
  bottlenecks: (DashboardBreakdown & {
    active_cases: number;
    average_days: number;
    overdue_cases: number;
  })[];
  overdue_cases: {
    id: string;
    case_number: string;
    title: string;
    stage_name_en: string;
    stage_name_th: string;
    overdue_days: number;
  }[];
  workload: {
    user_id: string;
    full_name: string;
    owned_cases: number;
    action_required: number;
    overdue: number;
    due_soon: number;
  }[];
  generated_at: string;
};

export type PersonnelKpiRow =
  Database["public"]["Functions"]["personnel_stage_kpi_report"]["Returns"][number];
export type WorkStatusRow =
  Database["public"]["Functions"]["work_status_report"]["Returns"][number];

export type ResponsibilityDetailRow = {
  intervalId: string;
  userId: string;
  fullName: string;
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  caseStatus: string;
  stageKey: string;
  stageNameEn: string;
  stageNameTh: string;
  stageIteration: number;
  startedAt: string;
  endedAt: string | null;
  decimalDays: number;
  assignmentSource: string;
};

export type WorkStatusCaseDetail = CaseListItem & {
  currentStage: {
    id: string;
    step_key: string;
    name_en: string;
    name_th: string;
    due_at: string | null;
  } | null;
};

export type ReportFilters = {
  start?: string | null;
  end?: string | null;
  userId?: string | null;
  stepKey?: string | null;
};

export type ReportFilterOptions = {
  profiles: { id: string; full_name: string }[];
  stages: { step_key: string; name_en: string; name_th: string }[];
};

export async function getReportFilterOptions(): Promise<ReportFilterOptions | null> {
  const supabase = await createClient();
  const [profilesResult, stagesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("case_stage_instances")
      .select("step_key, name_en, name_th")
      .order("sequence"),
  ]);
  const error = profilesResult.error ?? stagesResult.error;
  if (error) {
    logServerError("report.filter_options_failed", error);
    return null;
  }
  const stages = new Map<
    string,
    { step_key: string; name_en: string; name_th: string }
  >();
  (stagesResult.data ?? []).forEach((stage) => {
    if (!stages.has(stage.step_key)) stages.set(stage.step_key, stage);
  });
  return { profiles: profilesResult.data ?? [], stages: [...stages.values()] };
}

export async function getDashboardReport(): Promise<DashboardReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_report", {});
  if (error || !data || typeof data !== "object") {
    logServerError("report.dashboard_failed", error);
    return null;
  }
  return data as unknown as DashboardReport;
}

export async function getPersonnelKpiReport(
  filters: ReportFilters = {},
): Promise<PersonnelKpiRow[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("personnel_stage_kpi_report", {
    period_start: filters.start || null,
    period_end: filters.end || null,
    selected_user_id: filters.userId || null,
    selected_step_key: filters.stepKey || null,
  });
  if (error) {
    logServerError("report.personnel_kpi_failed", error);
    return null;
  }
  return data ?? [];
}

export async function getWorkStatusReport(
  groupDimension: string,
  filters: Pick<ReportFilters, "start" | "end"> = {},
): Promise<WorkStatusRow[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("work_status_report", {
    group_dimension: groupDimension,
    period_start: filters.start || null,
    period_end: filters.end || null,
  });
  if (error) {
    logServerError("report.work_status_failed", error);
    return null;
  }
  return data ?? [];
}

export async function getResponsibilityDetails(
  filters: ReportFilters = {},
): Promise<ResponsibilityDetailRow[] | null> {
  const supabase = await createClient();
  let intervalQuery = supabase
    .from("case_responsibility_intervals")
    .select("*")
    .not("responsible_user_id", "is", null)
    .order("started_at");
  if (filters.userId) {
    intervalQuery = intervalQuery.eq("responsible_user_id", filters.userId);
  }
  if (filters.end) {
    intervalQuery = intervalQuery.lt("started_at", filters.end);
  }
  const [intervalResult, stagesResult, casesResult, profilesResult] =
    await Promise.all([
      intervalQuery.limit(10000),
      supabase
        .from("case_stage_instances")
        .select("id, step_key, name_en, name_th, iteration"),
      supabase
        .from("procurement_cases")
        .select("id, case_number, title, status"),
      supabase.from("profiles").select("id, full_name"),
    ]);
  const error =
    intervalResult.error ??
    stagesResult.error ??
    casesResult.error ??
    profilesResult.error;
  if (error) {
    logServerError("report.responsibility_detail_failed", error);
    return null;
  }
  const stages = new Map(
    (stagesResult.data ?? []).map((stage) => [stage.id, stage]),
  );
  const cases = new Map(
    (casesResult.data ?? []).map((procurementCase) => [
      procurementCase.id,
      procurementCase,
    ]),
  );
  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const endBoundary = filters.end ? new Date(filters.end) : new Date();
  const startBoundary = filters.start ? new Date(filters.start) : null;

  return (intervalResult.data ?? []).flatMap((interval) => {
    const stage = stages.get(interval.stage_instance_id);
    const procurementCase = cases.get(interval.case_id);
    const profile = interval.responsible_user_id
      ? profiles.get(interval.responsible_user_id)
      : null;
    if (!stage || !procurementCase || !profile) return [];
    if (filters.stepKey && stage.step_key !== filters.stepKey) return [];
    if (
      startBoundary &&
      interval.ended_at &&
      new Date(interval.ended_at) <= startBoundary
    ) {
      return [];
    }
    const startedAt =
      startBoundary && new Date(interval.started_at) < startBoundary
        ? startBoundary
        : new Date(interval.started_at);
    const rawEnd = interval.ended_at ? new Date(interval.ended_at) : new Date();
    const endedAt = rawEnd > endBoundary ? endBoundary : rawEnd;
    if (endedAt <= startedAt) return [];
    return [
      {
        intervalId: interval.id,
        userId: profile.id,
        fullName: profile.full_name,
        caseId: procurementCase.id,
        caseNumber: procurementCase.case_number,
        caseTitle: procurementCase.title,
        caseStatus: procurementCase.status,
        stageKey: stage.step_key,
        stageNameEn: stage.name_en,
        stageNameTh: stage.name_th,
        stageIteration: stage.iteration,
        startedAt: interval.started_at,
        endedAt: interval.ended_at,
        decimalDays: responsibilityIntervalDays(startedAt, endedAt),
        assignmentSource: interval.assignment_source,
      },
    ];
  });
}

export async function getWorkStatusCaseDetails(
  filters: Pick<ReportFilters, "start" | "end"> = {},
): Promise<WorkStatusCaseDetail[] | null> {
  const rows = await listCasesForExport();
  if (!rows) return null;
  const filtered = rows.filter((row) => {
    const created = new Date(row.created_at);
    return (
      (!filters.start || created >= new Date(filters.start)) &&
      (!filters.end || created < new Date(filters.end))
    );
  });
  const stageIds = filtered.flatMap((row) =>
    row.current_stage_instance_id ? [row.current_stage_instance_id] : [],
  );
  if (stageIds.length === 0) {
    return filtered.map((row) => ({ ...row, currentStage: null }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_stage_instances")
    .select("id, step_key, name_en, name_th, due_at")
    .in("id", stageIds);
  if (error) {
    logServerError("report.work_status_detail_failed", error);
    return null;
  }
  const stages = new Map((data ?? []).map((stage) => [stage.id, stage]));
  return filtered.map((row) => ({
    ...row,
    currentStage: row.current_stage_instance_id
      ? (stages.get(row.current_stage_instance_id) ?? null)
      : null,
  }));
}
