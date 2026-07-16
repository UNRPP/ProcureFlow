import { DatabaseZap } from "lucide-react";
import Link from "next/link";

import { CaseFilters } from "@/components/cases/case-filters";
import { CaseTable } from "@/components/cases/case-table";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { canCreateCase } from "@/lib/permissions/cases";
import {
  getCaseFormOptions,
  isDashboardCaseFilter,
  isCaseStatus,
  listCases,
  type CaseSortField,
} from "@/server/queries/cases";
import { getCurrentProfile } from "@/server/queries/profile";
import { cn } from "@/lib/utils";

const sortFields: CaseSortField[] = [
  "case_number",
  "title",
  "status",
  "priority",
  "estimated_value",
  "target_completion_date",
  "created_at",
];

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, single(value)]),
  );
  const status = isCaseStatus(query.status) ? query.status : "";
  const sort = sortFields.includes(query.sort as CaseSortField)
    ? (query.sort as CaseSortField)
    : "created_at";
  const direction = query.direction === "asc" ? "asc" : "desc";
  const page = Math.max(Number.parseInt(query.page ?? "1", 10) || 1, 1);
  const dashboardValue = query.dashboard ?? "";
  const dashboardFilter = isDashboardCaseFilter(dashboardValue)
    ? dashboardValue
    : "";

  const [{ locale, messages }, options, currentUser, result] =
    await Promise.all([
      getI18n(),
      getCaseFormOptions({ includeArchived: true }),
      getCurrentProfile(),
      listCases({
        search: query.search,
        status,
        workCategoryId: query.category,
        procurementTypeId: query.procurementType,
        fiscalYearId: query.fiscalYear,
        ownerId: query.owner,
        dashboardFilter,
        sort,
        direction,
        page,
      }),
    ]);
  const pageMessages = messages.pages.cases;

  return (
    <>
      <PageHeader
        title={pageMessages.title}
        description={pageMessages.description}
      />
      {options && currentUser ? (
        <CaseFilters
          locale={locale}
          messages={messages}
          options={options}
          query={{ ...query, sort, direction }}
          canCreate={canCreateCase(currentUser.roles)}
        />
      ) : null}

      {dashboardFilter ? (
        <Alert className="border-info/30 bg-info/8 mb-5">
          <DatabaseZap className="text-info-foreground" />
          <AlertTitle>
            {messages.pages.cases.dashboardFilters[dashboardFilter].title}
          </AlertTitle>
          <AlertDescription>
            {messages.pages.cases.dashboardFilters[dashboardFilter].description}
          </AlertDescription>
        </Alert>
      ) : null}

      {result.status === "unavailable" ? (
        <Alert variant="destructive">
          <DatabaseZap />
          <AlertTitle>{messages.dashboard.dataUnavailableTitle}</AlertTitle>
          <AlertDescription>
            {messages.dashboard.dataUnavailableDescription}
          </AlertDescription>
        </Alert>
      ) : result.data.length === 0 ? (
        <EmptyState
          title={pageMessages.emptyTitle}
          description={pageMessages.emptyDescription}
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm tabular-nums">
              {messages.cases.table.results.replace(
                "{count}",
                String(result.total),
              )}
            </p>
            <p className="text-muted-foreground text-xs">
              {messages.cases.exports.limited}
            </p>
          </div>
          <CaseTable
            cases={result.data}
            locale={locale}
            messages={messages}
            query={{ ...query, sort, direction }}
          />
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            query={{ ...query, sort, direction }}
            messages={messages}
          />
        </>
      )}
    </>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  query,
  messages,
}: {
  page: number;
  pageSize: number;
  total: number;
  query: Record<string, string>;
  messages: Awaited<ReturnType<typeof getI18n>>["messages"];
}) {
  const pages = Math.max(Math.ceil(total / pageSize), 1);
  const href = (target: number) => {
    const params = new URLSearchParams(query);
    params.set("page", String(target));
    return `/cases?${params.toString()}`;
  };
  return (
    <nav
      className="mt-4 flex items-center justify-between gap-3"
      aria-label={messages.cases.table.page
        .replace("{page}", String(page))
        .replace("{pages}", String(pages))}
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className={buttonVariants({ variant: "outline" })}
        >
          {messages.cases.actions.previous}
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline" }),
            "pointer-events-none opacity-45",
          )}
        >
          {messages.cases.actions.previous}
        </span>
      )}
      <span className="text-muted-foreground text-sm tabular-nums">
        {messages.cases.table.page
          .replace("{page}", String(page))
          .replace("{pages}", String(pages))}
      </span>
      {page < pages ? (
        <Link
          href={href(page + 1)}
          className={buttonVariants({ variant: "outline" })}
        >
          {messages.cases.actions.next}
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline" }),
            "pointer-events-none opacity-45",
          )}
        >
          {messages.cases.actions.next}
        </span>
      )}
    </nav>
  );
}
