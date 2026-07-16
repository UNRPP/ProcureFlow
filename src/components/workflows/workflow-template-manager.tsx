"use client";

import { Archive, Copy, LoaderCircle, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n/config";
import { localizedMasterDataName } from "@/lib/i18n/master-data";
import type { Messages } from "@/lib/i18n/messages";
import {
  createWorkflowTemplateAction,
  duplicateWorkflowTemplateAction,
  setWorkflowTemplateStatusAction,
} from "@/server/actions/workflows";
import type { WorkflowTemplateListItem } from "@/server/queries/workflows";
import type { MasterDataRecord } from "@/types/database";

const selectClassName =
  "border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function WorkflowTemplateManager({
  templates,
  procurementTypes,
  locale,
  messages,
}: {
  templates: WorkflowTemplateListItem[];
  procurementTypes: MasterDataRecord[];
  locale: Locale;
  messages: Messages;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const t = messages.workflows;

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("create");
    setNotice(null);
    const data = new FormData(event.currentTarget);
    const result = await createWorkflowTemplateAction({
      code: String(data.get("code") ?? ""),
      nameEn: String(data.get("nameEn") ?? ""),
      nameTh: String(data.get("nameTh") ?? ""),
      descriptionEn: String(data.get("descriptionEn") ?? ""),
      descriptionTh: String(data.get("descriptionTh") ?? ""),
      procurementTypeId: String(data.get("procurementTypeId") ?? ""),
    });
    setPending(null);
    setNotice(result.message);
    if (result.status === "success" && result.id) {
      router.push("/settings/workflows/" + result.id);
      router.refresh();
    }
  }

  async function duplicate(id: string) {
    setPending(id);
    const result = await duplicateWorkflowTemplateAction(id);
    setPending(null);
    setNotice(result.message);
    if (result.status === "success" && result.id) {
      router.push("/settings/workflows/" + result.id);
      router.refresh();
    }
  }

  async function archive(id: string) {
    if (!window.confirm(t.confirm.archive)) return;
    setPending(id);
    const result = await setWorkflowTemplateStatusAction(id, "archived");
    setPending(null);
    setNotice(result.message);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {notice ? (
          <p className="text-muted-foreground text-sm">{notice}</p>
        ) : (
          <span />
        )}
        <Button onClick={() => setCreating((value) => !value)}>
          <Plus />
          {t.actions.create}
        </Button>
      </div>

      {creating ? (
        <form
          onSubmit={create}
          className="bg-card grid gap-4 rounded-2xl border p-4 sm:grid-cols-2 sm:p-6"
        >
          <h2 className="font-semibold sm:col-span-2">{t.createTitle}</h2>
          <Field label={t.fields.code} name="code" required />
          <div>
            <Label htmlFor="workflow-type">{t.fields.procurementType}</Label>
            <select
              id="workflow-type"
              name="procurementTypeId"
              required
              className={selectClassName + " mt-2"}
            >
              <option value="">{messages.common.selectOption}</option>
              {procurementTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {localizedMasterDataName(item, locale)}
                </option>
              ))}
            </select>
          </div>
          <Field label={t.fields.nameEn} name="nameEn" required />
          <Field label={t.fields.nameTh} name="nameTh" required />
          <TextField label={t.fields.descriptionEn} name="descriptionEn" />
          <TextField label={t.fields.descriptionTh} name="descriptionTh" />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending === "create"}>
              {pending === "create" ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Plus />
              )}
              {t.actions.create}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreating(false)}
            >
              {messages.common.cancel}
            </Button>
          </div>
        </form>
      ) : null}

      {templates.length === 0 ? (
        <p className="text-muted-foreground border-y py-8 text-center text-sm">
          {t.emptyTemplates}
        </p>
      ) : (
        <div className="bg-card overflow-hidden rounded-2xl border">
          <ul className="divide-y">
            {templates.map((template) => (
              <li
                key={template.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {locale === "th" ? template.name_th : template.name_en}
                    </p>
                    <Badge variant="outline">
                      {t.statuses[template.status]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {template.code} · {t.fields.version} {template.version} ·{" "}
                    {template.procurementType
                      ? localizedMasterDataName(
                          template.procurementType,
                          locale,
                        )
                      : messages.common.notProvided}{" "}
                    · {template.stepCount} {t.stepsTitle.toLowerCase()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Link
                    href={"/settings/workflows/" + template.id}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    <Settings2 />
                    {t.templateDetails}
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending === template.id}
                    onClick={() => duplicate(template.id)}
                  >
                    <Copy />
                    {t.actions.duplicate}
                  </Button>
                  {template.status === "published" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending === template.id}
                      onClick={() => archive(template.id)}
                    >
                      <Archive />
                      {t.actions.archive}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={"workflow-" + name}>{label}</Label>
      <Input
        id={"workflow-" + name}
        name={name}
        required={required}
        className="mt-2"
      />
    </div>
  );
}

function TextField({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <Label htmlFor={"workflow-" + name}>{label}</Label>
      <Textarea id={"workflow-" + name} name={name} className="mt-2" />
    </div>
  );
}
