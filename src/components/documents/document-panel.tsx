"use client";

import {
  CheckCircle2,
  Download,
  FileClock,
  FilePlus2,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n/config";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import type { Messages } from "@/lib/i18n/messages";
import {
  uploadDocumentAction,
  type CollaborationActionState,
} from "@/server/actions/collaboration";
import type {
  CaseCollaborationData,
  CaseDocumentItem,
} from "@/server/queries/collaboration";

const initialState: CollaborationActionState = { status: "idle", message: "" };
const inputClassName =
  "border-input bg-background h-9 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function DocumentPanel({
  caseId,
  currentStageId,
  data,
  editable,
  locale,
  messages,
}: {
  caseId: string;
  currentStageId: string | null;
  data: CaseCollaborationData;
  editable: boolean;
  locale: Locale;
  messages: Messages;
}) {
  const t = messages.documents;
  const [state, action, pending] = useActionState(
    uploadDocumentAction,
    initialState,
  );
  const typeName = (id: string) => {
    const type = data.documentTypes.find((item) => item.id === id);
    return type
      ? locale === "th"
        ? type.name_th
        : type.name_en
      : messages.common.notProvided;
  };
  const checklistComplete =
    data.requirements.length > 0 &&
    data.requirements.every((requirement) => requirement.uploaded);

  return (
    <section className="bg-card rounded-2xl border">
      <div className="border-b px-4 py-3.5 sm:px-5">
        <h2 className="font-semibold">{t.title}</h2>
        <p className="text-muted-foreground mt-1 text-xs">{t.description}</p>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{t.checklist}</h3>
            {checklistComplete ? (
              <Badge
                className="border-success/40 text-success-foreground"
                variant="outline"
              >
                <CheckCircle2 />
                {t.complete}
              </Badge>
            ) : null}
          </div>
          {data.requirements.length ? (
            <ul className="mt-3 space-y-2">
              {data.requirements.map((requirement) => (
                <li
                  key={requirement.id}
                  className="bg-muted/55 flex items-start gap-3 rounded-xl p-3"
                >
                  {requirement.uploaded ? (
                    <CheckCircle2 className="text-success-foreground mt-0.5 size-4 shrink-0" />
                  ) : (
                    <TriangleAlert className="text-warning-foreground mt-0.5 size-4 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {locale === "th"
                        ? requirement.document_type_name_th
                        : requirement.document_type_name_en}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {requirement.uploaded ? t.uploaded : t.missing} ·{" "}
                      {requirement.blocks_completion ? t.blocking : t.warning}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-2 text-sm">
              {t.noneRequired}
            </p>
          )}
        </div>

        {editable ? (
          <form
            action={action}
            className="bg-muted/45 grid gap-3 rounded-xl p-4"
          >
            <input type="hidden" name="caseId" value={caseId} />
            <input
              type="hidden"
              name="stageInstanceId"
              value={currentStageId ?? ""}
            />
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FilePlus2 className="size-4" />
              {t.uploadTitle}
            </h3>
            <label className="grid gap-1.5 text-xs font-medium">
              {t.fields.documentType}
              <select
                name="documentTypeId"
                className={inputClassName}
                defaultValue=""
                required
              >
                <option value="">{messages.common.selectOption}</option>
                {data.documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {locale === "th" ? type.name_th : type.name_en}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <Label htmlFor="document-title">{t.fields.title}</Label>
              <Input
                id="document-title"
                name="title"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="document-description">
                {t.fields.description}
              </Label>
              <Textarea
                id="document-description"
                name="description"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="document-file">{t.fields.file}</Label>
              <Input
                id="document-file"
                name="file"
                type="file"
                accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                className="mt-1.5"
                required
              />
            </div>
            {state.message ? (
              <p
                className={
                  state.status === "error"
                    ? "text-destructive text-xs"
                    : "text-success-foreground text-xs"
                }
                aria-live="polite"
              >
                {state.message}
              </p>
            ) : null}
            <Button type="submit" disabled={pending} className="w-fit">
              {pending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <FilePlus2 />
              )}
              {pending ? t.actions.uploading : t.actions.upload}
            </Button>
          </form>
        ) : null}

        <div>
          <h3 className="text-sm font-semibold">{t.versionHistory}</h3>
          {data.documents.length ? (
            <div className="mt-3 space-y-3">
              {data.documents.map((document) => (
                <DocumentVersions
                  key={document.id}
                  document={document}
                  documentTypeName={typeName(document.document_type_id)}
                  caseId={caseId}
                  editable={editable}
                  locale={locale}
                  messages={messages}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mt-2 text-sm">
              {t.noDocuments}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function DocumentVersions({
  document,
  documentTypeName,
  caseId,
  editable,
  locale,
  messages,
}: {
  document: CaseDocumentItem;
  documentTypeName: string;
  caseId: string;
  editable: boolean;
  locale: Locale;
  messages: Messages;
}) {
  const t = messages.documents;
  return (
    <details className="rounded-xl border" open>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3">
        <FileClock className="text-primary size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{document.title}</p>
          <p className="text-muted-foreground text-xs">
            {documentTypeName} · {document.versions.length} {t.versionHistory}
          </p>
        </div>
      </summary>
      <div className="border-t px-3 py-3">
        <ol className="space-y-3">
          {document.versions.map((version) => (
            <li key={version.id} className="flex items-start gap-3 text-xs">
              <span className="bg-secondary rounded-md px-2 py-1 font-medium tabular-nums">
                {t.version.replace("{version}", String(version.version_number))}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {version.original_filename}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {version.uploader?.full_name ?? messages.common.notProvided} ·{" "}
                  {formatDate(version.uploaded_at, locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  ·{" "}
                  {formatNumber(version.size_bytes / 1024, locale, {
                    maximumFractionDigits: 1,
                  })}{" "}
                  {t.kilobytes}
                </p>
              </div>
              <Link
                href={`/api/documents/${version.id}`}
                className="text-primary inline-flex items-center gap-1 font-medium"
              >
                <Download className="size-3.5" />
                {t.download}
              </Link>
            </li>
          ))}
        </ol>
        {editable ? (
          <VersionUploadForm
            caseId={caseId}
            document={document}
            messages={messages}
          />
        ) : null}
      </div>
    </details>
  );
}

function VersionUploadForm({
  caseId,
  document,
  messages,
}: {
  caseId: string;
  document: CaseDocumentItem;
  messages: Messages;
}) {
  const [state, action, pending] = useActionState(
    uploadDocumentAction,
    initialState,
  );
  const t = messages.documents;
  return (
    <form
      action={action}
      className="bg-muted/45 mt-3 grid gap-2 rounded-lg p-3"
    >
      <input type="hidden" name="caseId" value={caseId} />
      <input
        type="hidden"
        name="stageInstanceId"
        value={document.stage_instance_id ?? ""}
      />
      <input type="hidden" name="documentId" value={document.id} />
      <input
        type="hidden"
        name="documentTypeId"
        value={document.document_type_id}
      />
      <input type="hidden" name="title" value={document.title} />
      <input
        type="hidden"
        name="description"
        value={document.description ?? ""}
      />
      <p className="text-xs font-semibold">{t.newVersion}</p>
      <Input
        name="file"
        type="file"
        accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
        required
      />
      <Input
        name="versionDescription"
        placeholder={t.fields.versionDescription}
      />
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-destructive text-xs"
              : "text-success-foreground text-xs"
          }
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className="w-fit"
      >
        {pending ? <LoaderCircle className="animate-spin" /> : <FilePlus2 />}
        {pending ? t.actions.uploading : t.newVersion}
      </Button>
    </form>
  );
}
