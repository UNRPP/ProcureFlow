import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260715170000_phase4_collaboration.sql",
  ),
  "utf8",
).toLowerCase();

const businessTables = [
  "document_types",
  "workflow_step_document_requirements",
  "case_stage_document_requirements",
  "case_documents",
  "case_document_versions",
  "case_comments",
  "notifications",
  "notification_preferences",
];

describe("Phase 4 collaboration migration", () => {
  it.each(businessTables)("enables RLS on %s", (table) => {
    expect(migration).toContain(
      `alter table public.${table} enable row level security;`,
    );
  });

  it.each(businessTables)("defines a policy for %s", (table) => {
    expect(migration).toMatch(
      new RegExp(`create policy [\\s\\S]+? on public\\.${table}`),
    );
  });

  it("preserves document versions and comments as immutable history", () => {
    expect(migration).toContain("case_document_versions_immutable");
    expect(migration).toContain("case_comments_immutable");
    expect(migration).toContain(
      "document versions and case comments are immutable",
    );
    expect(migration).toContain("unique (document_id, version_number)");
  });

  it("snapshots requirements and blocks completion when configured", () => {
    expect(migration).toContain("snapshot_stage_document_requirements");
    expect(migration).toContain("case_stage_document_requirements_snapshot");
    expect(migration).toContain("enforce_required_stage_documents");
    expect(migration).toContain("required stage documents are missing");
  });

  it("creates a private bucket with case-scoped read, insert, and orphan-cleanup policies", () => {
    expect(migration).toContain("'case-documents', 'case-documents', false");
    expect(migration).toContain("case_documents_storage_read");
    expect(migration).toContain("case_documents_storage_insert");
    expect(migration).toContain("case_documents_storage_orphan_cleanup");
    expect(migration).not.toContain(
      "create policy case_documents_storage_update",
    );
  });

  it("keeps reminder generation server-only and idempotent", () => {
    expect(migration).toContain("generate_procurement_notifications");
    expect(migration).toContain(
      "grant execute on function public.generate_procurement_notifications(timestamptz) to service_role",
    );
    expect(migration).toContain("unique (recipient_user_id, source_key)");
    expect(migration).toContain(
      "on conflict (recipient_user_id, source_key) do nothing",
    );
  });
});
