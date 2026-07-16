"use client";

import { LoaderCircle, Play, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n/config";
import { localizedMasterDataName } from "@/lib/i18n/master-data";
import type { Messages } from "@/lib/i18n/messages";
import {
  availableWorkflowActions,
  transitionRequiresReason,
  type WorkflowAction as TransitionAction,
} from "@/features/workflows/rules";
import {
  startCaseWorkflowAction,
  transitionCaseWorkflowAction,
} from "@/server/actions/workflows";
import type { CaseWorkflowData } from "@/server/queries/workflows";
import type { CaseStatus } from "@/types/database";

const selectClassName =
  "border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function WorkflowActions({
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
  const router = useRouter();
  const [action, setAction] = useState<TransitionAction | null>(null);
  const [responsibleType, setResponsibleType] = useState<"user" | "department">(
    "user",
  );
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const t = messages.workflows;

  if (!editable) return null;

  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);
    const result = await startCaseWorkflowAction(
      caseId,
      String(data.get("templateId") ?? ""),
    );
    setPending(false);
    setNotice(result.message);
    if (result.status === "success") router.refresh();
  }

  async function transition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    setPending(true);
    const data = new FormData(event.currentTarget);
    const result = await transitionCaseWorkflowAction(caseId, {
      action,
      reason: String(data.get("reason") ?? ""),
      responsibleType: action === "reassign" ? responsibleType : undefined,
      responsibleId:
        action === "reassign"
          ? String(data.get("responsibleId") ?? "")
          : undefined,
    });
    setPending(false);
    setNotice(result.message);
    if (result.status === "success") {
      setAction(null);
      router.refresh();
    }
  }

  if (!workflow.workflow && caseStatus === "draft") {
    return (
      <div className="border-t p-4 sm:p-5">
        <h3 className="font-semibold">{t.startTitle}</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {t.startDescription}
        </p>
        {workflow.publishedTemplates.length === 0 ? (
          <p className="text-warning-foreground mt-3 text-sm">
            {t.noPublishedTemplate}
          </p>
        ) : (
          <form
            onSubmit={start}
            className="mt-4 flex flex-col gap-2 sm:flex-row"
          >
            <select
              name="templateId"
              required
              className={selectClassName + " flex-1"}
            >
              {workflow.publishedTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {locale === "th" ? template.name_th : template.name_en} ·{" "}
                  {t.fields.version} {template.version}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <Play />}
              {t.actions.start}
            </Button>
          </form>
        )}
        {notice ? (
          <p className="text-muted-foreground mt-2 text-sm">{notice}</p>
        ) : null}
      </div>
    );
  }

  if (!workflow.workflow || !workflow.currentStage) return null;
  const finalSequence = Math.max(
    ...workflow.stages.map((stage) => stage.sequence),
  );
  const actions = availableWorkflowActions({
    caseStatus,
    stageSequence: workflow.currentStage.sequence,
    finalSequence,
    canSkip: workflow.currentStage.can_skip,
  });
  const reasonRequired = action !== null && transitionRequiresReason(action);

  return (
    <div className="border-t p-4 sm:p-5">
      <div className="flex flex-wrap gap-2">
        {actions.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={
              item === "cancel"
                ? "destructive"
                : item === "complete" || item === "resume"
                  ? "default"
                  : "outline"
            }
            onClick={() => setAction(item)}
          >
            {t.actions[item]}
          </Button>
        ))}
      </div>
      {action ? (
        <form
          onSubmit={transition}
          className="bg-muted/35 mt-4 grid gap-3 rounded-xl border p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{t.actions[action]}</h3>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => setAction(null)}
              aria-label={t.actions.close}
            >
              <X />
            </Button>
          </div>
          {action === "reassign" ? (
            <>
              <div>
                <Label htmlFor="responsibleType">
                  {t.fields.defaultResponsibility}
                </Label>
                <select
                  id="responsibleType"
                  className={selectClassName + " mt-2"}
                  value={responsibleType}
                  onChange={(event) =>
                    setResponsibleType(
                      event.target.value as "user" | "department",
                    )
                  }
                >
                  <option value="user">{t.responsibility.user}</option>
                  <option value="department">
                    {t.responsibility.department}
                  </option>
                </select>
              </div>
              <div>
                <Label htmlFor="responsibleId">{t.fields.responsible}</Label>
                <select
                  id="responsibleId"
                  name="responsibleId"
                  required
                  className={selectClassName + " mt-2"}
                >
                  <option value="">{messages.common.selectOption}</option>
                  {responsibleType === "user"
                    ? workflow.profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </option>
                      ))
                    : workflow.departments
                        .filter((department) => department.is_active)
                        .map((department) => (
                          <option key={department.id} value={department.id}>
                            {localizedMasterDataName(department, locale)}
                          </option>
                        ))}
                </select>
              </div>
            </>
          ) : null}
          {reasonRequired || action === "reassign" ? (
            <div>
              <Label htmlFor="transitionReason">{t.fields.reason}</Label>
              <Textarea
                id="transitionReason"
                name="reason"
                required={reasonRequired}
                className="mt-2 min-h-20"
              />
            </div>
          ) : null}
          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? <LoaderCircle className="animate-spin" /> : null}
            {t.actions.apply}
          </Button>
          {notice ? (
            <p className="text-muted-foreground text-sm">{notice}</p>
          ) : null}
        </form>
      ) : null}
      {!action && notice ? (
        <p className="text-muted-foreground mt-2 text-sm">{notice}</p>
      ) : null}
    </div>
  );
}
