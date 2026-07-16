import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationsDirectory = resolve(process.cwd(), "supabase/migrations");
const migrations = readdirSync(migrationsDirectory)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => readFileSync(resolve(migrationsDirectory, name), "utf8"))
  .join("\n")
  .toLowerCase();
const hardening = readFileSync(
  resolve(migrationsDirectory, "20260715200000_phase5_hardening.sql"),
  "utf8",
).toLowerCase();
const functionPermissions = readFileSync(
  resolve(
    migrationsDirectory,
    "20260716090000_phase5_function_permissions.sql",
  ),
  "utf8",
).toLowerCase();

const createdBusinessTables = [
  ...migrations.matchAll(/create table public\.([a-z0-9_]+)/g),
].map((match) => match[1]);

describe("Phase 5 database hardening", () => {
  it("enables RLS on every business table created by the application", () => {
    expect(createdBusinessTables.length).toBeGreaterThan(20);
    for (const table of createdBusinessTables) {
      expect(migrations).toContain(
        `alter table public.${table} enable row level security;`,
      );
    }
  });

  it("removes permissive future function and schema defaults", () => {
    expect(hardening).toContain("revoke create on schema public from public");
    expect(hardening).toContain("revoke all on schema public from anon");
    expect(hardening).toContain("revoke execute on functions from public");
  });

  it("adds indexes for open work, responsibility periods, and document checks", () => {
    expect(hardening).toContain("procurement_cases_open_target_idx");
    expect(hardening).toContain("case_responsibility_intervals_period_idx");
    expect(hardening).toContain("case_documents_requirement_lookup_idx");
  });

  it("removes broad API function grants and restores only intended RPC access", () => {
    expect(functionPermissions).toContain(
      "revoke execute on all functions in schema public",
    );
    expect(functionPermissions).toContain(
      "from public, anon, authenticated, service_role",
    );
    expect(functionPermissions).toContain(
      "grant execute on function public.start_case_workflow(uuid, uuid) to authenticated",
    );
    expect(functionPermissions).toContain(
      "grant execute on function public.generate_procurement_notifications(timestamptz) to service_role",
    );
    expect(functionPermissions).not.toContain(
      "grant execute on function public.activate_case_stage",
    );
  });
});
