import { differenceInCalendarDays } from "date-fns";
import {
  CheckCircle2,
  Circle,
  CirclePause,
  Clock3,
  RotateCcw,
  SkipForward,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/i18n/format";
import { localizedMasterDataName } from "@/lib/i18n/master-data";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import type {
  CaseActivity,
  CaseStage,
  CaseWorkflowData,
} from "@/server/queries/workflows";
import type { CaseStatus } from "@/types/database";

import { WorkflowActions } from "./workflow-actions";

const stageIcons = {
  pending: Circle,
  active: Clock3,
  completed: CheckCircle2,
  returned: RotateCcw,
  skipped: SkipForward,
  cancelled: XCircle,
};

export function CaseWorkflowPanel({
  caseId,
  caseStatus,
  workflow,
  editable,
  locale,
  messages,
}: {
  caseId: string;
  caseStatus: CaseStatus;
  workflow: CaseWorkflowData;
  editable: boolean;
  locale: Locale;
  messages: Messages;
}) {
  const t = messages.workflows;
  const name = (stage: CaseStage) =>
    locale === "th" ? stage.name_th : stage.name_en;
  const responsible = (stage: CaseStage) => {
    if (stage.responsible_user_id) {
      return (
        workflow.profiles.find(
          (profile) => profile.id === stage.responsible_user_id,
        )?.full_name ?? messages.common.notProvided
      );
    }
    if (stage.responsible_department_id) {
      const department = workflow.departments.find(
        (item) => item.id === stage.responsible_department_id,
      );
      return department
        ? localizedMasterDataName(department, locale)
        : messages.common.notProvided;
    }
    return messages.cases.table.unassigned;
  };
  const transitionById = new Map(
    workflow.transitions.map((transition) => [transition.id, transition]),
  );
  const activityLabel = (event: CaseActivity) => {
    if (event.summary_key === "documents.uploaded") {
      return messages.documents.activityUploaded;
    }
    if (event.summary_key === "comments.added") {
      return messages.comments.activityAdded;
    }
    const action = event.summary_key.replace(
      "workflow.",
      "",
    ) as keyof typeof t.timelineActions;
    return t.timelineActions[action] ?? event.summary_key;
  };

  return (
    <section className="bg-card rounded-2xl border">
      <div className="border-b px-4 py-3.5 sm:px-5">
        <h2 className="font-semibold">{t.currentStage}</h2>
        {workflow.workflow ? (
          <p className="text-muted-foreground mt-1 text-xs">
            {locale === "th"
              ? workflow.workflow.template_name_th
              : workflow.workflow.template_name_en}{" "}
            · {t.fields.version} {workflow.workflow.template_version}
          </p>
        ) : null}
      </div>

      {workflow.stages.length > 0 ? (
        <ol className="flex gap-1 overflow-x-auto border-b px-4 py-4 sm:px-5">
          {workflow.stages.map((stage, index) => {
            const Icon = stageIcons[stage.status];
            return (
              <li
                key={stage.id}
                className="flex min-w-36 flex-1 items-start gap-2"
              >
                <span
                  className={
                    stage.status === "active"
                      ? "bg-primary text-primary-foreground grid size-7 shrink-0 place-items-center rounded-full"
                      : stage.status === "completed"
                        ? "bg-success/15 text-success-foreground grid size-7 shrink-0 place-items-center rounded-full"
                        : "bg-muted text-muted-foreground grid size-7 shrink-0 place-items-center rounded-full"
                  }
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{name(stage)}</p>
                  <p className="text-muted-foreground mt-0.5 text-[0.68rem]">
                    {t.stageStatuses[stage.status]}
                    {stage.iteration > 1
                      ? " · " + t.fields.iteration + " " + stage.iteration
                      : ""}
                  </p>
                </div>
                {index < workflow.stages.length - 1 ? (
                  <span className="bg-border mt-3 h-px min-w-4 flex-1" />
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}

      {workflow.currentStage ? (
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">
                {name(workflow.currentStage)}
              </h3>
              <Badge variant="outline">
                <CirclePause aria-hidden="true" />
                {t.stageStatuses.active}
              </Badge>
            </div>
            {locale === "th"
              ? workflow.currentStage.description_th
              : workflow.currentStage.description_en}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Info
              label={t.fields.enteredAt}
              value={
                workflow.currentStage.entered_at
                  ? formatDate(workflow.currentStage.entered_at, locale)
                  : messages.common.notProvided
              }
            />
            <Info
              label={t.fields.dueAt}
              value={
                workflow.currentStage.due_at
                  ? dueLabel(workflow.currentStage.due_at, locale, messages)
                  : messages.common.notProvided
              }
            />
            <div className="col-span-2">
              <Info
                label={t.fields.responsible}
                value={responsible(workflow.currentStage)}
              />
            </div>
          </dl>
        </div>
      ) : !workflow.workflow ? (
        <p className="text-muted-foreground p-5 text-sm">
          {messages.cases.sections.phaseTwoPlaceholder}
        </p>
      ) : null}

      <WorkflowActions
        caseId={caseId}
        caseStatus={caseStatus}
        workflow={workflow}
        editable={editable}
        locale={locale}
        messages={messages}
      />

      {workflow.activities.length > 0 ? (
        <div className="border-t p-4 sm:p-5">
          <h3 className="font-semibold">{t.activity}</h3>
          <ol className="mt-3 space-y-3">
            {workflow.activities.map((event) => {
              const eventId =
                typeof event.details.event_id === "string"
                  ? event.details.event_id
                  : null;
              const transition = eventId ? transitionById.get(eventId) : null;
              const filename =
                typeof event.details.filename === "string"
                  ? event.details.filename
                  : null;
              return (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span
                    className="bg-primary mt-1.5 size-2 shrink-0 rounded-full"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium">{activityLabel(event)}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {event.actor?.full_name ?? messages.common.notProvided} ·{" "}
                      {formatDate(event.occurred_at, locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {transition?.reason ? (
                      <p className="text-muted-foreground mt-1">
                        {transition.reason}
                      </p>
                    ) : filename ? (
                      <p className="text-muted-foreground mt-1">{filename}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function dueLabel(value: string, locale: Locale, messages: Messages): string {
  const date = new Date(value);
  const days = differenceInCalendarDays(new Date(), date);
  if (days > 0) {
    return (
      formatDate(date, locale) +
      " · " +
      messages.workflows.overdue.replace("{days}", String(days))
    );
  }
  if (days === 0) {
    return formatDate(date, locale) + " · " + messages.workflows.dueToday;
  }
  return formatDate(date, locale);
}
