import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  DatabaseZap,
  UserRoundX,
} from "lucide-react";
import Link from "next/link";

import { DashboardChartsLazy } from "@/components/dashboard/dashboard-charts-lazy";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";
import { getDashboardReport } from "@/server/queries/reporting";

function KpiCard({
  title,
  value,
  icon: Icon,
  tone,
  href,
  actionLabel,
}: {
  title: string;
  value: string;
  icon: typeof BriefcaseBusiness;
  tone: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <Link
      href={href}
      aria-label={actionLabel}
      className="bg-card border-border group hover:border-primary/35 focus-visible:ring-ring/50 block rounded-2xl border p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-medium">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
        </div>
        <span
          className={`rounded-xl p-2.5 transition-transform duration-200 group-hover:scale-105 ${tone}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const [{ locale, messages }, report] = await Promise.all([
    getI18n(),
    getDashboardReport(),
  ]);
  const t = messages.dashboard;

  if (!report) {
    return (
      <>
        <PageHeader title={t.title} description={t.description} />
        <Alert className="border-warning/35 bg-warning/8">
          <DatabaseZap className="text-warning-foreground" />
          <AlertTitle>{t.dataUnavailableTitle}</AlertTitle>
          <AlertDescription>{t.dataUnavailableDescription}</AlertDescription>
        </Alert>
      </>
    );
  }

  const kpis = [
    {
      title: t.kpis.active,
      value: formatNumber(Number(report.summary.active_cases), locale),
      icon: BriefcaseBusiness,
      tone: "bg-primary/10 text-primary",
      href: "/cases?dashboard=active",
    },
    {
      title: t.kpis.overdue,
      value: formatNumber(Number(report.summary.overdue_cases), locale),
      icon: CircleAlert,
      tone: "bg-destructive/10 text-destructive",
      href: "/cases?dashboard=overdue",
    },
    {
      title: t.kpis.dueSoon,
      value: formatNumber(Number(report.summary.due_soon), locale),
      icon: CalendarClock,
      tone: "bg-warning/15 text-warning-foreground",
      href: "/cases?dashboard=due_soon",
    },
    {
      title: t.kpis.unassigned,
      value: formatNumber(Number(report.summary.unassigned_cases), locale),
      icon: UserRoundX,
      tone: "bg-chart-5/10 text-chart-5",
      href: "/cases?dashboard=unassigned",
    },
    {
      title: t.kpis.completedMonth,
      value: formatNumber(Number(report.summary.completed_this_month), locale),
      icon: CheckCircle2,
      tone: "bg-success/12 text-success-foreground",
      href: "/cases?dashboard=completed_month",
    },
    {
      title: t.kpis.activeValue,
      value: formatNumber(
        Number(report.summary.active_estimated_value),
        locale,
        {
          style: "currency",
          currency: "THB",
          notation: "compact",
          maximumFractionDigits: 2,
        },
      ),
      icon: BadgeDollarSign,
      tone: "bg-info/10 text-info-foreground",
      href: "/cases?dashboard=active_value&sort=estimated_value&direction=desc",
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t.title} description={t.description} />
        <p className="text-muted-foreground text-xs tabular-nums sm:pt-2">
          {t.generatedAt.replace(
            "{time}",
            formatDate(report.generated_at, locale, {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          )}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.title}
            {...kpi}
            actionLabel={t.viewCases.replace("{title}", kpi.title)}
          />
        ))}
      </section>

      <section className="mt-4">
        <DashboardChartsLazy
          report={report}
          locale={locale}
          loadingLabel={messages.common.loading}
          titles={t.charts}
          labels={{
            total: messages.reports.columns.total,
            created: t.charts.created,
            completed: t.charts.completed,
            activeCases: t.charts.activeCases,
          }}
        />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <section className="bg-card border-border rounded-2xl border shadow-sm xl:col-span-7">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-sm font-semibold">{t.overdueTitle}</h2>
            <Link
              href="/cases?status=active"
              className="text-primary text-xs font-medium"
            >
              {t.viewAll}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-xs">
              <caption className="sr-only">{t.overdueTitle}</caption>
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="px-5 py-3 font-medium">
                    {messages.cases.fields.caseNumber}
                  </th>
                  <th className="px-3 py-3 font-medium">
                    {messages.cases.fields.title}
                  </th>
                  <th className="px-3 py-3 font-medium">
                    {messages.workflows.currentStage}
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    {t.kpis.overdue}
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.overdue_cases.length ? (
                  report.overdue_cases.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-5 py-3 font-medium">
                        <Link
                          href={`/cases/${item.id}`}
                          className="hover:text-primary"
                        >
                          {item.case_number}
                        </Link>
                      </td>
                      <td className="max-w-56 truncate px-3 py-3">
                        {item.title}
                      </td>
                      <td className="px-3 py-3">
                        {locale === "th"
                          ? item.stage_name_th
                          : item.stage_name_en}
                      </td>
                      <td className="text-destructive px-5 py-3 text-right font-medium tabular-nums">
                        {t.overdueDays.replace(
                          "{days}",
                          formatNumber(Number(item.overdue_days), locale),
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-muted-foreground px-5 py-8 text-center"
                    >
                      {messages.pages.reports.emptyTitle}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-card border-border rounded-2xl border shadow-sm xl:col-span-5">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-sm font-semibold">{t.workloadTitle}</h2>
            <Link
              href="/reports?report=personnel"
              className="text-primary text-xs font-medium"
            >
              {t.viewAll}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[31rem] text-left text-xs">
              <caption className="sr-only">{t.workloadTitle}</caption>
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="px-5 py-3 font-medium">
                    {messages.reports.columns.personnel}
                  </th>
                  <th className="px-3 py-3 text-right font-medium">
                    {t.ownedCases}
                  </th>
                  <th className="px-3 py-3 text-right font-medium">
                    {t.actionRequired}
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    {t.kpis.overdue}
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.workload.length ? (
                  report.workload.map((item) => (
                    <tr key={item.user_id} className="border-b last:border-0">
                      <td className="px-5 py-3 font-medium">
                        {item.full_name}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {item.owned_cases}
                      </td>
                      <td className="text-primary px-3 py-3 text-right font-medium tabular-nums">
                        {item.action_required}
                      </td>
                      <td className="text-destructive px-5 py-3 text-right font-medium tabular-nums">
                        {item.overdue}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-muted-foreground px-5 py-8 text-center"
                    >
                      {messages.pages.reports.emptyTitle}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="bg-card border-border mt-4 rounded-2xl border shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">{t.charts.bottlenecks}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] text-left text-xs">
            <caption className="sr-only">{t.charts.bottlenecks}</caption>
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="px-5 py-3 font-medium">
                  {messages.reports.columns.stage}
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  {t.charts.activeCases}
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  {t.charts.averageDays}
                </th>
                <th className="px-5 py-3 text-right font-medium">
                  {t.charts.overdueCases}
                </th>
              </tr>
            </thead>
            <tbody>
              {report.bottlenecks.map((item) => (
                <tr key={item.key} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium">
                    {locale === "th" ? item.name_th : item.name_en}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {item.active_cases}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatNumber(Number(item.average_days), locale, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="text-destructive px-5 py-3 text-right font-medium tabular-nums">
                    {item.overdue_cases}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
