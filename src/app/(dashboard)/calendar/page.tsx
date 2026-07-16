import { differenceInCalendarDays, startOfDay } from "date-fns";
import {
  CalendarDays,
  CircleAlert,
  DatabaseZap,
  FileClock,
} from "lucide-react";
import Link from "next/link";

import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { getI18n } from "@/lib/i18n/server";
import { listScheduledCases, type ScheduledCase } from "@/server/queries/cases";
import { getContractRenewals } from "@/server/queries/collaboration";

function scheduledAt(item: ScheduledCase): Date | null {
  if (item.currentStage?.due_at) return new Date(item.currentStage.due_at);
  if (item.target_completion_date) {
    return new Date(`${item.target_completion_date}T00:00:00Z`);
  }
  return null;
}

function Agenda({
  title,
  rows,
  locale,
  messages,
  overdue = false,
}: {
  title: string;
  rows: ScheduledCase[];
  locale: Locale;
  messages: Messages;
  overdue?: boolean;
}) {
  const t = messages.pages.calendar;
  const today = startOfDay(new Date());
  return (
    <section className="bg-card border-border rounded-2xl border shadow-sm">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        {overdue ? (
          <CircleAlert className="text-destructive size-4" aria-hidden="true" />
        ) : (
          <CalendarDays className="text-primary size-4" aria-hidden="true" />
        )}
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="bg-secondary text-secondary-foreground ml-auto rounded-full px-2 py-0.5 text-xs tabular-nums">
          {rows.length}
        </span>
      </div>
      {rows.length ? (
        <ul className="divide-y">
          {rows.map((item) => {
            const date = scheduledAt(item)!;
            const days = differenceInCalendarDays(date, today);
            const dayLabel =
              days === 0
                ? t.today
                : (overdue ? t.daysOverdue : t.daysRemaining).replace(
                    "{days}",
                    formatNumber(Math.abs(days), locale),
                  );
            return (
              <li key={item.id}>
                <Link
                  href={`/cases/${item.id}`}
                  className="hover:bg-muted/55 grid gap-3 px-5 py-4 transition-colors sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatDate(date, locale, {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    <p
                      className={`mt-0.5 text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {dayLabel}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">
                      {item.case_number}
                    </p>
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {item.currentStage?.due_at
                        ? `${t.workflowDue} · ${locale === "th" ? item.currentStage.name_th : item.currentStage.name_en}`
                        : t.targetDate}
                    </p>
                  </div>
                  <CaseStatusBadge
                    status={item.status}
                    messages={messages.cases.statuses}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground px-5 py-8 text-center text-sm">
          {messages.pages.calendar.emptyDescription}
        </p>
      )}
    </section>
  );
}

export default async function CalendarPage() {
  const [{ locale, messages }, rows, renewals] = await Promise.all([
    getI18n(),
    listScheduledCases(),
    getContractRenewals(),
  ]);
  const page = messages.pages.calendar;

  if (!rows || !renewals) {
    return (
      <>
        <PageHeader title={page.title} description={page.description} />
        <Alert className="border-warning/35 bg-warning/8">
          <DatabaseZap className="text-warning-foreground" />
          <AlertTitle>{messages.dashboard.dataUnavailableTitle}</AlertTitle>
          <AlertDescription>
            {messages.dashboard.dataUnavailableDescription}
          </AlertDescription>
        </Alert>
      </>
    );
  }

  if (rows.length === 0 && renewals.length === 0) {
    return (
      <>
        <PageHeader title={page.title} description={page.description} />
        <EmptyState
          title={page.emptyTitle}
          description={page.emptyDescription}
        />
      </>
    );
  }

  const today = startOfDay(new Date());
  const dated = rows
    .filter((item) => scheduledAt(item))
    .sort((a, b) => scheduledAt(a)!.getTime() - scheduledAt(b)!.getTime());
  const overdue = dated.filter((item) => scheduledAt(item)! < today);
  const upcoming = dated.filter((item) => scheduledAt(item)! >= today);
  const noDate = rows.filter((item) => !scheduledAt(item));

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Agenda
          title={page.pastDue}
          rows={overdue}
          locale={locale}
          messages={messages}
          overdue
        />
        <Agenda
          title={page.upcoming}
          rows={upcoming}
          locale={locale}
          messages={messages}
        />
      </div>
      {noDate.length ? (
        <section className="bg-card border-border mt-4 rounded-2xl border p-5 shadow-sm">
          <h2 className="text-sm font-semibold">{page.noDate}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {noDate.map((item) => (
              <Link
                key={item.id}
                href={`/cases/${item.id}`}
                className="bg-muted hover:bg-accent rounded-lg px-3 py-2 text-xs transition-colors"
              >
                {item.case_number} · {item.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <section className="bg-card border-border mt-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <FileClock className="text-primary size-4" aria-hidden="true" />
          <h2 className="text-sm font-semibold">{page.renewals}</h2>
          <span className="bg-secondary text-secondary-foreground ml-auto rounded-full px-2 py-0.5 text-xs tabular-nums">
            {renewals.length}
          </span>
        </div>
        {renewals.length ? (
          <ul className="divide-y">
            {renewals.map((renewal) => (
              <li key={renewal.caseId}>
                <Link
                  href={`/cases/${renewal.caseId}`}
                  className="hover:bg-muted/55 grid gap-3 px-5 py-4 transition-colors sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">
                      {renewal.caseNumber}
                    </p>
                    <p className="truncate text-sm font-medium">
                      {renewal.title}
                    </p>
                    {renewal.currentProvider ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {messages.cases.fields.currentProvider} ·{" "}
                        {renewal.currentProvider}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {page.renewalNotice}
                    </p>
                    <p className="mt-0.5 text-sm tabular-nums">
                      {renewal.renewalNotificationDate
                        ? formatDate(renewal.renewalNotificationDate, locale)
                        : messages.common.notProvided}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {page.contractEnds}
                    </p>
                    <p className="mt-0.5 text-sm font-medium tabular-nums">
                      {formatDate(renewal.contractEndDate, locale)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground px-5 py-8 text-center text-sm">
            {page.noRenewals}
          </p>
        )}
      </section>
    </>
  );
}
