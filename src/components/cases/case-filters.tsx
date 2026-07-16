import { Download, FileSpreadsheet, Filter, Plus, Search } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import { localizedMasterDataName } from "@/lib/i18n/master-data";
import type { Messages } from "@/lib/i18n/messages";
import type { CaseFormOptions } from "@/server/queries/cases";
import { cn } from "@/lib/utils";

const selectClassName =
  "border-input bg-background h-8 min-w-0 rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function CaseFilters({
  locale,
  messages,
  options,
  query,
  canCreate,
}: {
  locale: Locale;
  messages: Messages;
  options: CaseFormOptions;
  query: Record<string, string>;
  canCreate: boolean;
}) {
  const t = messages.cases;
  const name = (item: { name_en: string; name_th: string }) =>
    localizedMasterDataName(item, locale);
  const exportParams = new URLSearchParams(query);
  exportParams.set("locale", locale);

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/api/exports/cases.csv?${exportParams.toString()}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Download />
            {t.actions.exportCsv}
          </Link>
          <Link
            href={`/api/exports/cases.xlsx?${exportParams.toString()}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <FileSpreadsheet />
            {t.actions.exportXlsx}
          </Link>
        </div>
        {canCreate ? (
          <Link
            href="/cases/new?category=medical_device"
            className={buttonVariants()}
          >
            <Plus />
            {t.actions.create}
          </Link>
        ) : null}
      </div>

      <form
        action="/cases"
        className="bg-card grid gap-2 rounded-2xl border p-3 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1.5fr)_repeat(5,minmax(8rem,1fr))_auto]"
        aria-label={t.table.filters}
      >
        <label className="relative sm:col-span-2 xl:col-span-1">
          <span className="sr-only">{t.table.search}</span>
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            name="search"
            defaultValue={query.search}
            placeholder={t.table.search}
            className="pl-8"
          />
        </label>
        <select
          name="status"
          defaultValue={query.status}
          className={selectClassName}
          aria-label={t.fields.status}
        >
          <option value="">{t.table.allStatuses}</option>
          {Object.entries(t.statuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={query.category}
          className={selectClassName}
          aria-label={t.fields.workCategory}
        >
          <option value="">{t.table.allCategories}</option>
          {options.workCategories.map((item) => (
            <option key={item.id} value={item.id}>
              {name(item)}
            </option>
          ))}
        </select>
        <select
          name="procurementType"
          defaultValue={query.procurementType}
          className={selectClassName}
          aria-label={t.fields.procurementType}
        >
          <option value="">{t.table.allProcurementTypes}</option>
          {options.procurementTypes.map((item) => (
            <option key={item.id} value={item.id}>
              {name(item)}
            </option>
          ))}
        </select>
        <select
          name="fiscalYear"
          defaultValue={query.fiscalYear}
          className={selectClassName}
          aria-label={t.fields.fiscalYear}
        >
          <option value="">{t.table.allFiscalYears}</option>
          {options.fiscalYears.map((item) => (
            <option key={item.id} value={item.id}>
              {name(item)}
            </option>
          ))}
        </select>
        <select
          name="owner"
          defaultValue={query.owner}
          className={selectClassName}
          aria-label={t.fields.caseOwner}
        >
          <option value="">{t.table.allOwners}</option>
          {options.profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className={cn(buttonVariants(), "w-full xl:w-auto")}
        >
          <Filter />
          {t.actions.applyFilters}
        </button>
      </form>
    </div>
  );
}
