import { addDays, isMatch, parseISO } from "date-fns";
import { z } from "zod";

export const reportGroupings = [
  "work_category",
  "procurement_type",
  "budget_source",
  "budget_category",
  "current_stage",
  "department",
  "owner",
  "fiscal_year",
] as const;

export type ReportGrouping = (typeof reportGroupings)[number];

export function isReportGrouping(value: string): value is ReportGrouping {
  return reportGroupings.includes(value as ReportGrouping);
}

export function validDateInput(value: string | undefined): string {
  if (!value || !isMatch(value, "yyyy-MM-dd")) return "";
  return Number.isNaN(parseISO(value).getTime()) ? "" : value;
}

export function validUuidInput(value: string | undefined): string {
  return z.string().uuid().safeParse(value).success ? value! : "";
}

export function reportPeriod(start: string, end: string) {
  return {
    start: start ? `${start}T00:00:00.000Z` : null,
    end: end
      ? addDays(parseISO(`${end}T00:00:00.000Z`), 1).toISOString()
      : null,
  };
}
