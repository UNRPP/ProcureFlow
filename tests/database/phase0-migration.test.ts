import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260714170000_phase0_foundation.sql",
  ),
  "utf8",
).toLowerCase();

const phaseZeroTables = [
  "profiles",
  "roles",
  "user_roles",
  "departments",
  "work_categories",
  "budget_categories",
  "budget_sources",
  "procurement_types",
  "fiscal_years",
];

describe("Phase 0 database migration", () => {
  it.each(phaseZeroTables)("enables RLS on %s", (table) => {
    expect(migration).toContain(
      `alter table public.${table} enable row level security;`,
    );
  });

  it.each(phaseZeroTables)("defines at least one policy for %s", (table) => {
    expect(migration).toMatch(
      new RegExp(`create policy [\\s\\S]+? on public\\.${table}`),
    );
  });

  it("does not grant business-table access to anonymous users", () => {
    expect(migration).toContain("from anon;");
    expect(migration).not.toMatch(/grant\s+(select|all)[\s\S]+?to\s+anon/i);
  });

  it("protects profile accountability fields", () => {
    expect(migration).toContain("protect_profile_security_fields");
    expect(migration).toContain("profile security fields cannot be changed");
  });
});
