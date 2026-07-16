import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260715100000_phase1_cases.sql"),
  "utf8",
).toLowerCase();

const caseTables = [
  "procurement_cases",
  "medical_device_case_details",
  "medical_equipment_case_details",
  "service_contract_case_details",
];

describe("Phase 1 database migration", () => {
  it.each(caseTables)("enables RLS on %s", (table) => {
    expect(migration).toContain(
      `alter table public.${table} enable row level security;`,
    );
  });

  it.each(caseTables)("defines policies for %s", (table) => {
    expect(migration).toMatch(
      new RegExp(`create policy [\\s\\S]+? on public\\.${table}`),
    );
  });

  it("generates case numbers on the server", () => {
    expect(migration).toContain("assign_procurement_case_number");
    expect(migration).toContain("'prc-%s-%s'");
    expect(migration).toContain("procurement_case_number_seq");
  });

  it("keeps category creation atomic and relational", () => {
    expect(migration).toContain("create_procurement_case(case_data jsonb");
    expect(migration).toContain(
      "insert into public.medical_device_case_details",
    );
    expect(migration).toContain(
      "insert into public.medical_equipment_case_details",
    );
    expect(migration).toContain(
      "insert into public.service_contract_case_details",
    );
  });

  it("prevents use of archived master data for new references", () => {
    expect(migration).toContain("validate_active_case_master_data");
    expect(migration).toContain("and is_active");
  });

  it("does not grant case access to anonymous users", () => {
    expect(migration).toContain("from anon;");
    expect(migration).not.toMatch(
      /grant\s+(select|all)[\s\S]+?procurement_cases[\s\S]+?to\s+anon/i,
    );
  });
});
