import { DatabaseZap } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ReportFilters } from "@/components/reports/report-filters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  isReportGrouping,
  reportPeriod,
  validDateInput,
  validUuidInput,
} from "@/features/reports/filters";
import { formatNumber } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";
import {
  getPersonnelKpiReport,
  getReportFilterOptions,
  getWorkStatusReport,
  type PersonnelKpiRow,
  type WorkStatusRow,
} from "@/server/queries/reporting";

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function PersonnelTable({
  rows,
  locale,
  messages,
}: {
  rows: PersonnelKpiRow[];
  locale: "en" | "th";
  messages: Awaited<ReturnType<typeof getI18n>>["messages"];
}) {
  const c = messages.reports.columns;
  const number = (value: number) =>
    formatNumber(Number(value), locale, { maximumFractionDigits: 4 });
  return (
    <div className="bg-card overflow-x-auto rounded-2xl border shadow-sm">
      <table className="w-full min-w-[70rem] text-left text-xs">
        <caption className="sr-only">{messages.reports.personnelTitle}</caption>
        <thead className="text-muted-foreground">
          <tr className="border-b">
            {[
              c.personnel,
              c.stage,
              c.uniqueCases,
              c.intervalCount,
              c.minimumDays,
              c.maximumDays,
              c.averageDays,
              c.medianDays,
              c.totalDays,
              c.completedCases,
            ].map((heading, index) => (
              <th
                key={heading}
                scope="col"
                className={`px-4 py-3 font-medium ${index > 1 ? "text-right" : ""}`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.user_id}:${row.step_key}`}
              className="border-b last:border-0"
            >
              <td className="px-4 py-3 font-medium">{row.full_name}</td>
              <td className="px-4 py-3">
                {locale === "th" ? row.stage_name_th : row.stage_name_en}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {number(row.unique_cases)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {number(row.interval_count)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {number(row.minimum_days)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {number(row.maximum_days)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {number(row.average_days)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {number(row.median_days)}
              </td>
              <td className="px-4 py-3 text-right font-medium tabular-nums">
                {number(row.total_days)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {number(row.completed_cases)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkStatusTable({
  rows,
  locale,
  messages,
}: {
  rows: WorkStatusRow[];
  locale: "en" | "th";
  messages: Awaited<ReturnType<typeof getI18n>>["messages"];
}) {
  const c = messages.reports.columns;
  const number = (value: number, digits = 0) =>
    formatNumber(Number(value), locale, { maximumFractionDigits: digits });
  return (
    <div className="bg-card overflow-x-auto rounded-2xl border shadow-sm">
      <table className="w-full min-w-[66rem] text-left text-xs">
        <caption className="sr-only">
          {messages.reports.workStatusTitle}
        </caption>
        <thead className="text-muted-foreground">
          <tr className="border-b">
            {[
              c.group,
              c.total,
              c.completed,
              c.activeRemaining,
              c.onHold,
              c.cancelled,
              c.completionPercentage,
              c.overdueRemaining,
            ].map((heading, index) => (
              <th
                key={heading}
                scope="col"
                className={`px-4 py-3 font-medium ${index > 0 ? "text-right" : ""}`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.group_key} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">
                {locale === "th" ? row.group_name_th : row.group_name_en}
              </td>
              <td className="px-4 py-3 text-right font-medium tabular-nums">
                {number(row.total)}
              </td>
              <td className="text-success-foreground px-4 py-3 text-right tabular-nums">
                {number(row.completed)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {number(row.active_remaining)}
              </td>
              <td className="text-warning-foreground px-4 py-3 text-right tabular-nums">
                {number(row.on_hold)}
              </td>
              <td className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                {number(row.cancelled)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {number(row.completion_percentage, 2)}%
              </td>
              <td className="text-destructive px-4 py-3 text-right font-medium tabular-nums">
                {number(row.overdue_remaining)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const value = (key: string) => single(raw[key]);
  const report =
    value("report") === "work-status" ? "work-status" : "personnel";
  const requestedGroup = value("group");
  const group = isReportGrouping(requestedGroup)
    ? requestedGroup
    : "work_category";
  const start = validDateInput(value("start"));
  const end = validDateInput(value("end"));
  const userId = validUuidInput(value("userId"));
  const stage = value("stage")
    .replace(/[^a-z0-9_\-]/gi, "")
    .slice(0, 80);
  const period = reportPeriod(start, end);
  const [{ locale, messages }, options, rows] = await Promise.all([
    getI18n(),
    getReportFilterOptions(),
    report === "personnel"
      ? getPersonnelKpiReport({
          start: period.start,
          end: period.end,
          userId,
          stepKey: stage,
        })
      : getWorkStatusReport(group, period),
  ]);
  const page = messages.pages.reports;

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      {options ? (
        <ReportFilters
          locale={locale}
          messages={messages}
          options={options}
          query={{ report, group, start, end, userId, stage }}
        />
      ) : null}
      {rows === null || !options ? (
        <Alert variant="destructive">
          <DatabaseZap />
          <AlertTitle>{messages.dashboard.dataUnavailableTitle}</AlertTitle>
          <AlertDescription>
            {messages.dashboard.dataUnavailableDescription}
          </AlertDescription>
        </Alert>
      ) : rows.length === 0 ? (
        <EmptyState
          title={page.emptyTitle}
          description={page.emptyDescription}
        />
      ) : report === "personnel" ? (
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold">
              {messages.reports.personnelTitle}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {messages.reports.personnelDescription}
            </p>
          </div>
          <PersonnelTable
            rows={rows as PersonnelKpiRow[]}
            locale={locale}
            messages={messages}
          />
          <p className="text-muted-foreground mt-3 text-xs">
            {messages.reports.exports.decimalDayNote}
          </p>
        </section>
      ) : (
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold">
              {messages.reports.workStatusTitle}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {messages.reports.workStatusDescription}
            </p>
          </div>
          <WorkStatusTable
            rows={rows as WorkStatusRow[]}
            locale={locale}
            messages={messages}
          />
        </section>
      )}
    </>
  );
}
