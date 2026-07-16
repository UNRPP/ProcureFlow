import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260715140000_phase3_reporting.sql",
  ),
  "utf8",
).toLowerCase();

describe("Phase 3 reporting migration", () => {
  it.each([
    "dashboard_report",
    "personnel_stage_kpi_report",
    "work_status_report",
  ])("creates and restricts the %s function", (name) => {
    expect(migration).toContain(`function public.${name}`);
    expect(migration).toMatch(
      new RegExp(
        `revoke all on function public\\.${name}[\\s\\S]+? from public`,
      ),
    );
    expect(migration).toMatch(
      new RegExp(
        `grant execute on function public\\.${name}[\\s\\S]+? to authenticated`,
      ),
    );
  });

  it("calculates personnel duration from responsibility intervals and raw timestamps", () => {
    expect(migration).toContain(
      "from public.case_responsibility_intervals interval",
    );
    expect(migration).toContain("/ 86400.0 days");
    expect(migration).toContain("percentile_cont(0.5)");
    expect(migration).toContain("least(coalesce(interval.ended_at, now())");
    expect(migration).toContain("greatest(interval.started_at");
  });

  it("supports every required work-status grouping", () => {
    [
      "work_category",
      "procurement_type",
      "budget_source",
      "budget_category",
      "current_stage",
      "department",
      "owner",
      "fiscal_year",
    ].forEach((dimension) => expect(migration).toContain(`'${dimension}'`));
  });

  it("keeps reporting functions under caller RLS", () => {
    expect(migration).not.toContain("security definer");
  });
});
