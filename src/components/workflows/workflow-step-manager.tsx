"use client";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  FileCheck2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n/config";
import { localizedMasterDataName } from "@/lib/i18n/master-data";
import type { Messages } from "@/lib/i18n/messages";
import {
  deleteDocumentRequirementAction,
  saveDocumentRequirementAction,
} from "@/server/actions/collaboration";
import {
  deleteWorkflowStepAction,
  reorderWorkflowStepsAction,
  saveWorkflowStepAction,
  setWorkflowTemplateStatusAction,
} from "@/server/actions/workflows";
import type {
  WorkflowTemplateDetail,
  WorkflowTemplateStep,
} from "@/server/queries/workflows";

const selectClassName =
  "border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function WorkflowStepManager({
  detail,
  locale,
  messages,
}: {
  detail: WorkflowTemplateDetail;
  locale: Locale;
  messages: Messages;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<WorkflowTemplateStep | "new" | null>(
    null,
  );
  const [responsibilityType, setResponsibilityType] = useState<
    "none" | "role" | "department"
  >("none");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const t = messages.workflows;
  const draft = detail.template.status === "draft";

  function beginEdit(step: WorkflowTemplateStep) {
    setEditing(step);
    setResponsibilityType(
      step.default_responsible_department_id
        ? "department"
        : step.default_responsible_role_id
          ? "role"
          : "none",
    );
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);
    const result = await saveWorkflowStepAction({
      id: editing && editing !== "new" ? editing.id : undefined,
      templateId: detail.template.id,
      stepKey: String(data.get("stepKey") ?? ""),
      nameEn: String(data.get("nameEn") ?? ""),
      nameTh: String(data.get("nameTh") ?? ""),
      descriptionEn: String(data.get("descriptionEn") ?? ""),
      descriptionTh: String(data.get("descriptionTh") ?? ""),
      targetDays: Number(data.get("targetDays") ?? 0),
      responsibilityType,
      responsibilityId:
        responsibilityType === "none"
          ? null
          : String(data.get("responsibilityId") ?? ""),
      requiredDocumentBehavior: String(
        data.get("documentBehavior") ?? "none",
      ) as "none" | "warn" | "block",
      canSkip: data.get("canSkip") === "on",
    });
    setPending(false);
    setNotice(result.message);
    if (result.status === "success") {
      setEditing(null);
      router.refresh();
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...detail.steps];
    const target = index + direction;
    if (!next[index] || !next[target]) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setPending(true);
    const result = await reorderWorkflowStepsAction(
      detail.template.id,
      next.map((step) => step.id),
    );
    setPending(false);
    setNotice(result.message);
    router.refresh();
  }

  async function remove(stepId: string) {
    if (!window.confirm(t.confirm.delete)) return;
    setPending(true);
    const result = await deleteWorkflowStepAction(detail.template.id, stepId);
    setPending(false);
    setNotice(result.message);
    router.refresh();
  }

  async function addRequirement(
    event: React.FormEvent<HTMLFormElement>,
    stepId: string,
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    const result = await saveDocumentRequirementAction({
      templateStepId: stepId,
      documentTypeId: String(data.get("documentTypeId") ?? ""),
      blocksCompletion: data.get("blocksCompletion") === "on",
      descriptionEn: "",
      descriptionTh: "",
    });
    setPending(false);
    setNotice(result.message);
    if (result.status === "success") {
      event.currentTarget.reset();
      router.refresh();
    }
  }

  async function removeRequirement(requirementId: string) {
    setPending(true);
    const result = await deleteDocumentRequirementAction(requirementId);
    setPending(false);
    setNotice(result.message);
    router.refresh();
  }

  async function publish() {
    if (!window.confirm(t.confirm.publish)) return;
    setPending(true);
    const result = await setWorkflowTemplateStatusAction(
      detail.template.id,
      "published",
    );
    setPending(false);
    setNotice(result.message);
    router.refresh();
  }

  const editingStep = editing && editing !== "new" ? editing : null;
  const responsibilityOptions =
    responsibilityType === "department"
      ? detail.departments.filter(
          (department) =>
            department.is_active ||
            department.id === editingStep?.default_responsible_department_id,
        )
      : detail.roles;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {notice ? (
          <p className="text-muted-foreground text-sm">{notice}</p>
        ) : (
          <span />
        )}
        {draft ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing("new")}>
              <Plus />
              {t.addStep}
            </Button>
            <Button
              onClick={publish}
              disabled={pending || detail.steps.length === 0}
            >
              <CheckCircle2 />
              {t.actions.publish}
            </Button>
          </div>
        ) : null}
      </div>

      {editing ? (
        <form
          key={editingStep?.id ?? "new"}
          onSubmit={save}
          className="bg-card grid gap-4 rounded-2xl border p-4 sm:grid-cols-2 sm:p-6"
        >
          <h2 className="font-semibold sm:col-span-2">
            {editing === "new" ? t.addStep : t.editStep}
          </h2>
          <Field
            label={t.fields.stepKey}
            name="stepKey"
            value={editingStep?.step_key}
          />
          <Field
            label={t.fields.targetDays}
            name="targetDays"
            type="number"
            value={String(editingStep?.target_days ?? 7)}
          />
          <Field
            label={t.fields.nameEn}
            name="nameEn"
            value={editingStep?.name_en}
          />
          <Field
            label={t.fields.nameTh}
            name="nameTh"
            value={editingStep?.name_th}
          />
          <TextField
            label={t.fields.descriptionEn}
            name="descriptionEn"
            value={editingStep?.description_en ?? ""}
          />
          <TextField
            label={t.fields.descriptionTh}
            name="descriptionTh"
            value={editingStep?.description_th ?? ""}
          />
          <div>
            <Label htmlFor="responsibilityType">
              {t.fields.defaultResponsibility}
            </Label>
            <select
              id="responsibilityType"
              className={selectClassName + " mt-2"}
              value={responsibilityType}
              onChange={(event) =>
                setResponsibilityType(
                  event.target.value as "none" | "role" | "department",
                )
              }
            >
              <option value="none">{t.responsibility.none}</option>
              <option value="role">{t.responsibility.role}</option>
              <option value="department">{t.responsibility.department}</option>
            </select>
          </div>
          {responsibilityType !== "none" ? (
            <div>
              <Label htmlFor="responsibilityId">{t.fields.responsible}</Label>
              <select
                id="responsibilityId"
                name="responsibilityId"
                className={selectClassName + " mt-2"}
                defaultValue={
                  responsibilityType === "department"
                    ? (editingStep?.default_responsible_department_id ?? "")
                    : (editingStep?.default_responsible_role_id ?? "")
                }
                required
              >
                <option value="">{messages.common.selectOption}</option>
                {responsibilityOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {locale === "th" && "name_th" in option
                      ? option.name_th
                      : option.name_en}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <Label htmlFor="documentBehavior">
              {t.fields.documentBehavior}
            </Label>
            <select
              id="documentBehavior"
              name="documentBehavior"
              className={selectClassName + " mt-2"}
              defaultValue={editingStep?.required_document_behavior ?? "none"}
            >
              {(["none", "warn", "block"] as const).map((behavior) => (
                <option key={behavior} value={behavior}>
                  {t.documentBehavior[behavior]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 self-end py-2 text-sm">
            <input
              type="checkbox"
              name="canSkip"
              defaultChecked={editingStep?.can_skip ?? false}
            />
            {t.fields.canSkip}
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : null}
              {t.actions.saveStep}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(null)}
            >
              {messages.common.cancel}
            </Button>
          </div>
        </form>
      ) : null}

      {detail.steps.length === 0 ? (
        <p className="text-muted-foreground border-y py-8 text-center text-sm">
          {t.emptySteps}
        </p>
      ) : (
        <ol className="bg-card overflow-hidden rounded-2xl border">
          {detail.steps.map((step, index) => {
            const requirements = detail.documentRequirements.filter(
              (requirement) => requirement.template_step_id === step.id,
            );
            const availableTypes = detail.documentTypes.filter(
              (documentType) =>
                !requirements.some(
                  (requirement) =>
                    requirement.document_type_id === documentType.id,
                ),
            );
            return (
              <li
                key={step.id}
                className="flex items-start gap-3 border-b p-4 last:border-b-0 sm:px-5"
              >
                <span className="bg-primary text-primary-foreground grid size-7 shrink-0 place-items-center rounded-lg text-xs font-semibold">
                  {step.sequence}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {locale === "th" ? step.name_th : step.name_en}
                    </p>
                    {step.can_skip ? (
                      <Badge variant="outline">{t.actions.skip}</Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {step.step_key} · {step.target_days}{" "}
                    {t.fields.targetDays.toLowerCase()} ·{" "}
                    {step.default_responsible_department_id
                      ? localizedMasterDataName(
                          detail.departments.find(
                            (item) =>
                              item.id ===
                              step.default_responsible_department_id,
                          ) ?? {
                            name_en: messages.common.notProvided,
                            name_th: messages.common.notProvided,
                          },
                          locale,
                        )
                      : t.responsibility.none}
                  </p>
                  <div className="mt-3 border-t pt-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <FileCheck2 className="size-3.5" />
                      {messages.documents.requirementsTitle}
                    </p>
                    {requirements.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {requirements.map((requirement) => {
                          const documentType = detail.documentTypes.find(
                            (item) => item.id === requirement.document_type_id,
                          );
                          return (
                            <span
                              key={requirement.id}
                              className="bg-muted inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs"
                            >
                              {documentType
                                ? locale === "th"
                                  ? documentType.name_th
                                  : documentType.name_en
                                : messages.common.notProvided}
                              <Badge variant="outline">
                                {requirement.blocks_completion
                                  ? messages.documents.blocking
                                  : messages.documents.warning}
                              </Badge>
                              {draft ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeRequirement(requirement.id)
                                  }
                                  aria-label={
                                    messages.documents.removeRequirement
                                  }
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <X className="size-3.5" />
                                </button>
                              ) : null}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {messages.documents.noneRequired}
                      </p>
                    )}
                    {draft && availableTypes.length ? (
                      <form
                        onSubmit={(event) => addRequirement(event, step.id)}
                        className="mt-2 flex flex-wrap items-center gap-2"
                      >
                        <select
                          name="documentTypeId"
                          className={selectClassName + " max-w-xs"}
                          aria-label={messages.documents.requirementType}
                          required
                          defaultValue=""
                        >
                          <option value="">
                            {messages.documents.requirementType}
                          </option>
                          {availableTypes.map((documentType) => (
                            <option
                              key={documentType.id}
                              value={documentType.id}
                            >
                              {locale === "th"
                                ? documentType.name_th
                                : documentType.name_en}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1.5 text-xs">
                          <input type="checkbox" name="blocksCompletion" />
                          {messages.documents.blocksCompletion}
                        </label>
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                        >
                          {messages.documents.saveRequirement}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
                {draft ? (
                  <div className="flex shrink-0 items-center">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={index === 0 || pending}
                      onClick={() => move(index, -1)}
                      aria-label={t.actions.moveUp}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={index === detail.steps.length - 1 || pending}
                      onClick={() => move(index, 1)}
                      aria-label={t.actions.moveDown}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => beginEdit(step)}
                      aria-label={t.editStep}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => remove(step.id)}
                      aria-label={t.actions.delete}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  value,
  type = "text",
}: {
  label: string;
  name: string;
  value?: string;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={"step-" + name}>{label}</Label>
      <Input
        id={"step-" + name}
        name={name}
        type={type}
        min={type === "number" ? "0" : undefined}
        defaultValue={value}
        required
        className="mt-2"
      />
    </div>
  );
}

function TextField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) {
  return (
    <div>
      <Label htmlFor={"step-" + name}>{label}</Label>
      <Textarea
        id={"step-" + name}
        name={name}
        defaultValue={value}
        className="mt-2"
      />
    </div>
  );
}
