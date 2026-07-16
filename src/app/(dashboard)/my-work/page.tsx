import { differenceInCalendarDays, startOfDay } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  CircleUserRound,
  Inbox,
  UserRoundX,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { listMyWork, type MyWorkItem } from "@/server/queries/cases";
import { getCurrentProfile } from "@/server/queries/profile";
import { getI18n } from "@/lib/i18n/server";

function WorkSection({
  title,
  icon: Icon,
  rows,
  locale,
  messages,
}: {
  title: string;
  icon: typeof Inbox;
  rows: MyWorkItem[];
  locale: Locale;
  messages: Messages;
}) {
  return (
    <section className="bg-card border-border rounded-2xl border shadow-sm">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <Icon className="text-primary size-4" aria-hidden="true" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="bg-secondary text-secondary-foreground ml-auto rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {rows.length}
        </span>
      </div>
      {rows.length ? (
        <ul className="divide-y">
          {rows.map((item) => (
            <li key={item.id}>
              <Link
                href={`/cases/${item.id}`}
                className="hover:bg-muted/55 flex flex-col gap-2 px-5 py-4 transition-colors sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs font-medium">
                    {item.case_number}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-medium">
                    {item.title}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {item.currentStage
                      ? locale === "th"
                        ? item.currentStage.name_th
                        : item.currentStage.name_en
                      : messages.cases.table.unassigned}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {item.currentStage?.due_at
                      ? formatDate(item.currentStage.due_at, locale)
                      : item.target_completion_date
                        ? formatDate(
                            `${item.target_completion_date}T00:00:00Z`,
                            locale,
                          )
                        : messages.cases.table.noTarget}
                  </span>
                  <CaseStatusBadge
                    status={item.status}
                    messages={messages.cases.statuses}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground px-5 py-8 text-center text-sm">
          {messages.pages.myWork.emptyDescription}
        </p>
      )}
    </section>
  );
}

export default async function MyWorkPage() {
  const [{ locale, messages }, currentUser] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
  ]);
  if (!currentUser) redirect("/sign-in");
  const rows = await listMyWork(currentUser.profile.id);
  const page = messages.pages.myWork;

  if (!rows?.length) {
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
  const dueInDays = (item: MyWorkItem) =>
    item.currentStage?.due_at
      ? differenceInCalendarDays(new Date(item.currentStage.due_at), today)
      : null;
  const groups = [
    {
      title: page.actionRequired,
      icon: Inbox,
      rows: rows.filter(
        (item) => item.current_responsible_user_id === currentUser.profile.id,
      ),
    },
    {
      title: page.overdue,
      icon: AlertTriangle,
      rows: rows.filter((item) => {
        const days = dueInDays(item);
        return days !== null && days < 0;
      }),
    },
    {
      title: page.dueSoon,
      icon: CalendarClock,
      rows: rows.filter((item) => {
        const days = dueInDays(item);
        return days !== null && days >= 0 && days <= 7;
      }),
    },
    {
      title: page.recentlyAssigned,
      icon: CircleUserRound,
      rows: rows.filter((item) => {
        if (!item.currentAssignmentAt) return false;
        const assignedDaysAgo = differenceInCalendarDays(
          today,
          new Date(item.currentAssignmentAt),
        );
        return assignedDaysAgo >= 0 && assignedDaysAgo <= 7;
      }),
    },
    {
      title: page.waitingDepartment,
      icon: CalendarClock,
      rows: rows.filter(
        (item) =>
          item.case_owner_id === currentUser.profile.id &&
          Boolean(item.current_responsible_department_id),
      ),
    },
    {
      title: page.owned,
      icon: CircleUserRound,
      rows: rows.filter(
        (item) => item.case_owner_id === currentUser.profile.id,
      ),
    },
    {
      title: page.unassigned,
      icon: UserRoundX,
      rows: rows.filter(
        (item) =>
          item.case_owner_id === currentUser.profile.id &&
          !item.current_responsible_user_id &&
          !item.current_responsible_department_id,
      ),
    },
  ];

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <WorkSection
            key={group.title}
            {...group}
            locale={locale}
            messages={messages}
          />
        ))}
      </div>
    </>
  );
}
