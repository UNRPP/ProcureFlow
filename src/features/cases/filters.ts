import {
  isDashboardCaseFilter,
  isCaseStatus,
  type CaseListFilters,
  type CaseSortField,
} from "@/server/queries/cases";

const sortFields: CaseSortField[] = [
  "case_number",
  "title",
  "status",
  "priority",
  "estimated_value",
  "target_completion_date",
  "created_at",
];

export function caseFiltersFromSearchParams(
  searchParams: URLSearchParams,
): Omit<CaseListFilters, "page" | "pageSize"> {
  const statusValue = searchParams.get("status") ?? "";
  const sortValue = searchParams.get("sort") as CaseSortField | null;
  const dashboardValue = searchParams.get("dashboard") ?? "";
  return {
    search: searchParams.get("search") ?? "",
    status: isCaseStatus(statusValue) ? statusValue : "",
    workCategoryId: searchParams.get("category") ?? "",
    procurementTypeId: searchParams.get("procurementType") ?? "",
    fiscalYearId: searchParams.get("fiscalYear") ?? "",
    ownerId: searchParams.get("owner") ?? "",
    dashboardFilter: isDashboardCaseFilter(dashboardValue)
      ? dashboardValue
      : "",
    sort:
      sortValue && sortFields.includes(sortValue) ? sortValue : "created_at",
    direction: searchParams.get("direction") === "asc" ? "asc" : "desc",
  };
}
