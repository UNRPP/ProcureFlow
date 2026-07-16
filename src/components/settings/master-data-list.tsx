"use client";

import { CheckCircle2, CircleOff, LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditableMasterDataTable } from "@/features/settings/master-data";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import {
  createMasterDataAction,
  setMasterDataActiveAction,
  type MasterDataInput,
} from "@/server/actions/master-data";
import type { MasterDataCatalog } from "@/server/queries/master-data";
import type { MasterDataRecord } from "@/types/database";

type CatalogKey = keyof MasterDataCatalog;

const sections: {
  key: CatalogKey;
  messageKey: keyof Messages["masterData"];
  table?: EditableMasterDataTable;
}[] = [
  { key: "workCategories", messageKey: "workCategories" },
  { key: "departments", messageKey: "departments", table: "departments" },
  {
    key: "budgetCategories",
    messageKey: "budgetCategories",
    table: "budget_categories",
  },
  {
    key: "budgetSources",
    messageKey: "budgetSources",
    table: "budget_sources",
  },
  {
    key: "procurementTypes",
    messageKey: "procurementTypes",
    table: "procurement_types",
  },
  { key: "fiscalYears", messageKey: "fiscalYears", table: "fiscal_years" },
  {
    key: "documentTypes",
    messageKey: "documentTypes",
    table: "document_types",
  },
];

function displayName(record: MasterDataRecord, locale: Locale): string {
  if (locale === "th" && record.name_th.trim()) return record.name_th;
  return record.name_en;
}

export function MasterDataList({
  catalog,
  locale,
  messages,
  canManage,
}: {
  catalog: MasterDataCatalog;
  locale: Locale;
  messages: Messages;
  canManage: boolean;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState<CatalogKey | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  async function submitRecord(
    event: React.FormEvent<HTMLFormElement>,
    table: EditableMasterDataTable,
  ) {
    event.preventDefault();
    setPendingId("create");
    setNotice(null);
    const formData = new FormData(event.currentTarget);
    const input: MasterDataInput = {
      table,
      code: String(formData.get("code") ?? ""),
      nameEn: String(formData.get("nameEn") ?? ""),
      nameTh: String(formData.get("nameTh") ?? ""),
      year: formData.get("year") ? Number(formData.get("year")) : undefined,
      startsOn: formData.get("startsOn")
        ? String(formData.get("startsOn"))
        : undefined,
      endsOn: formData.get("endsOn")
        ? String(formData.get("endsOn"))
        : undefined,
    };
    const result = await createMasterDataAction(input);
    setPendingId(null);
    setNotice({
      kind: result.status === "success" ? "success" : "error",
      message: result.message,
    });
    if (result.status === "success") {
      setCreating(null);
      router.refresh();
    }
  }

  async function toggleRecord(
    table: EditableMasterDataTable,
    record: MasterDataRecord,
  ) {
    if (record.is_active && !window.confirm(messages.settings.confirmArchive)) {
      return;
    }
    setPendingId(record.id);
    setNotice(null);
    const result = await setMasterDataActiveAction({
      table,
      id: record.id,
      active: !record.is_active,
    });
    setPendingId(null);
    setNotice({
      kind: result.status === "success" ? "success" : "error",
      message: result.message,
    });
    if (result.status === "success") router.refresh();
  }

  return (
    <div>
      {notice ? (
        <p
          role="status"
          className={
            notice.kind === "success"
              ? "text-success-foreground mb-3 text-sm"
              : "text-destructive mb-3 text-sm"
          }
        >
          {notice.message}
        </p>
      ) : null}
      <div className="bg-card overflow-hidden rounded-2xl border">
        {sections.map((section, sectionIndex) => {
          const records = catalog[section.key];

          return (
            <section
              key={section.key}
              className={sectionIndex > 0 ? "border-t" : undefined}
            >
              <div className="bg-muted/40 flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-semibold">
                  {messages.masterData[section.messageKey]}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {records.length}
                  </span>
                  {canManage && section.table ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setCreating((current) =>
                          current === section.key ? null : section.key,
                        )
                      }
                    >
                      <Plus />
                      {messages.settings.add}
                    </Button>
                  ) : null}
                </div>
              </div>
              {creating === section.key && section.table ? (
                <form
                  className="bg-primary/3 grid gap-3 border-t border-b p-4 sm:grid-cols-2 lg:grid-cols-3"
                  onSubmit={(event) => submitRecord(event, section.table!)}
                >
                  <div>
                    <Label htmlFor={`${section.key}-code`}>
                      {messages.masterData.code}
                    </Label>
                    <Input
                      id={`${section.key}-code`}
                      name="code"
                      required
                      className="mt-2"
                    />
                    <p className="text-muted-foreground mt-1 text-xs">
                      {messages.settings.codeHelp}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor={`${section.key}-name-en`}>
                      {messages.masterData.nameEnglish}
                    </Label>
                    <Input
                      id={`${section.key}-name-en`}
                      name="nameEn"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${section.key}-name-th`}>
                      {messages.masterData.nameThai}
                    </Label>
                    <Input
                      id={`${section.key}-name-th`}
                      name="nameTh"
                      required
                      className="mt-2"
                    />
                  </div>
                  {section.table === "fiscal_years" ? (
                    <>
                      <div>
                        <Label htmlFor="fiscal-year-value">
                          {messages.settings.year}
                        </Label>
                        <Input
                          id="fiscal-year-value"
                          name="year"
                          type="number"
                          min="2000"
                          max="2200"
                          required
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fiscal-start">
                          {messages.settings.startsOn}
                        </Label>
                        <Input
                          id="fiscal-start"
                          name="startsOn"
                          type="date"
                          required
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fiscal-end">
                          {messages.settings.endsOn}
                        </Label>
                        <Input
                          id="fiscal-end"
                          name="endsOn"
                          type="date"
                          required
                          className="mt-2"
                        />
                      </div>
                    </>
                  ) : null}
                  <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={pendingId === "create"}>
                      {pendingId === "create" ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <Plus />
                      )}
                      {pendingId === "create"
                        ? messages.settings.saving
                        : messages.settings.add}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCreating(null)}
                    >
                      {messages.settings.cancel}
                    </Button>
                  </div>
                </form>
              ) : null}
              {records.length === 0 ? (
                <p className="text-muted-foreground px-5 py-4 text-sm">
                  {messages.settings.empty}
                </p>
              ) : (
                <ul className="divide-y">
                  {records.map((record) => (
                    <li
                      key={record.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {displayName(record, locale)}
                        </p>
                        <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                          {record.code}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            record.is_active
                              ? "border-success/35 text-success-foreground dark:text-success w-fit"
                              : "text-muted-foreground w-fit"
                          }
                        >
                          {record.is_active ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <CircleOff className="size-3" />
                          )}
                          {record.is_active
                            ? messages.masterData.active
                            : messages.masterData.archived}
                        </Badge>
                        {canManage && section.table ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={pendingId === record.id}
                            onClick={() => toggleRecord(section.table!, record)}
                          >
                            {pendingId === record.id ? (
                              <LoaderCircle className="animate-spin" />
                            ) : null}
                            {record.is_active
                              ? messages.settings.archive
                              : messages.settings.reactivate}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
