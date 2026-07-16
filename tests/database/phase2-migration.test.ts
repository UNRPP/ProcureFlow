import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260715120000_phase2_workflows.sql",
  ),
  "utf8",
).toLowerCase();

const workflowTables = [
  "workflow_templates",
  "workflow_template_steps",
  "case_workflows",
  "case_stage_instances",
  "workflow_transition_events",
  "case_assignments",
  "case_responsibility_intervals",
  "case_activity_events",
];

describe("Phase 2 workflow migration", () => {
  it.each(workflowTables)("enables RLS on %s", (table) => {
    expect(migration).toContain(
      `alter table public.${table} enable row level security;`,
    );
  });

  it.each(workflowTables)("defines read policies for %s", (table) => {
    expect(migration).toMatch(
      new RegExp(`create policy [\\s\\S]+? on public\\.${table}`),
    );
  });

  it("enforces one active stage per case", () => {
    expect(migration).toContain(
      "create unique index case_stage_instances_one_active_case_idx",
    );
    expect(migration).toContain("where status = 'active'");
  });

  it("keeps published templates and completed stages immutable", () => {
    expect(migration).toContain("published workflow versions are immutable");
    expect(migration).toContain("completed case stage history is immutable");
    expect(migration).toContain("audit events are immutable");
  });

  it("creates snapshots instead of linking active cases to mutable steps", () => {
    expect(migration).toContain("insert into public.case_stage_instances");
    expect(migration).toContain("template_name_en");
    expect(migration).toContain("target_stage.iteration + 1");
  });

  it("closes and creates responsibility intervals on reassignment", () => {
    expect(migration).toContain("close_stage_responsibility");
    expect(migration).toContain(
      "insert into public.case_responsibility_intervals",
    );
    expect(migration).toContain("assignment_source");
  });

  it("enforces required transition reasons in the database", () => {
    expect(migration).toContain(
      "transition_action in ('return', 'hold', 'skip', 'cancel')",
    );
    expect(migration).toContain("this workflow action requires a reason");
  });
});
