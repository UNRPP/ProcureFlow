import { FileSpreadsheet, Filter } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  reportGroupings,
  type ReportGrouping,
} from "@/features/reports/filters";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import type { ReportFilterOptions } from "@/server/queries/reporting";

const selectClassName =
  "border-input bg-background h-9 min-w-0 rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
const inputClassName =
  "border-input bg-background h-9 min-w-0 rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function ReportFilters({
  locale,
  messages,
  options,
  query,
}: {
  locale: Locale;
  messages: Messages;
  options: ReportFilterOptions;
  query: {
    report: "personnel" | "work-status";
    group: ReportGrouping;
    start: string;
    end: string;
    userId: string;
    stage: string;
  };
}) {
  const t = messages.reports;
  const params = new URLSearchParams(query);
  params.set("locale", locale);
  const exportUrl =
    query.report === "personnel"
      ? `/api/exports/reports/personnel.xlsx?${params.toString()}`
      : `/api/exports/reports/work-status.xlsx?${params.toString()}`;

  return (
    <div className="mb-5 space-y-3">
      <div className="flex justify-end">
        <Link
          href={exportUrl}
          className={buttonVariants({ variant: "outline" })}
        >
          <FileSpreadsheet />
          {query.report === "personnel"
            ? t.exports.personnel
            : t.exports.workStatus}
        </Link>
      </div>
      <form
        action="/reports"
        className="bg-card grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 xl:grid-cols-7"
        aria-label={t.filters.reportType}
      >
        <label className="grid gap-1.5 text-xs font-medium">
          {t.filters.reportType}
          <select
            name="report"
            defaultValue={query.report}
            className={selectClassName}
          >
            <option value="personnel">{t.filters.personnel}</option>
            <option value="work-status">{t.filters.workStatus}</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-medium">
          {t.filters.startDate}
          <input
            type="date"
            name="start"
            defaultValue={query.start}
            className={inputClassName}
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium">
          {t.filters.endDate}
          <input
            type="date"
            name="end"
            defaultValue={query.end}
            className={inputClassName}
          />
        </label>
        {query.report === "personnel" ? (
          <>
            <label className="grid gap-1.5 text-xs font-medium">
              {t.filters.personnelFilter}
              <select
                name="userId"
                defaultValue={query.userId}
                className={selectClassName}
              >
                <option value="">{t.filters.allPersonnel}</option>
                {options.profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              {t.filters.stageFilter}
              <select
                name="stage"
                defaultValue={query.stage}
                className={selectClassName}
              >
                <option value="">{t.filters.allStages}</option>
                {options.stages.map((stage) => (
                  <option key={stage.step_key} value={stage.step_key}>
                    {locale === "th" ? stage.name_th : stage.name_en}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label className="grid gap-1.5 text-xs font-medium sm:col-span-2">
            {t.filters.groupBy}
            <select
              name="group"
              defaultValue={query.group}
              className={selectClassName}
            >
              {reportGroupings.map((group) => (
                <option key={group} value={group}>
                  {t.groupings[group]}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-end">
          <button type="submit" className={cn(buttonVariants(), "w-full")}>
            <Filter />
            {t.filters.apply}
          </button>
        </div>
      </form>
    </div>
  );
}
