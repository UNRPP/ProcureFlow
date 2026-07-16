import { describe, expect, it } from "vitest";

import { canCreateCase, canEditCase } from "@/lib/permissions/cases";

describe("case permissions", () => {
  it("keeps auditors read-only", () => {
    expect(canCreateCase(["viewer_auditor"])).toBe(false);
    expect(
      canEditCase({
        roles: ["viewer_auditor"],
        status: "active",
        userId: "auditor",
        ownerId: "officer",
        responsibleUserId: null,
      }),
    ).toBe(false);
  });

  it("lets managers edit every case status", () => {
    expect(
      canEditCase({
        roles: ["procurement_manager"],
        status: "completed",
        userId: "manager",
        ownerId: "officer",
        responsibleUserId: null,
      }),
    ).toBe(true);
  });

  it("limits officers to open cases they own or are assigned", () => {
    expect(
      canEditCase({
        roles: ["procurement_officer"],
        status: "active",
        userId: "officer",
        ownerId: "officer",
        responsibleUserId: null,
      }),
    ).toBe(true);
    expect(
      canEditCase({
        roles: ["procurement_officer"],
        status: "active",
        userId: "officer",
        ownerId: "other",
        responsibleUserId: "other",
      }),
    ).toBe(false);
    expect(
      canEditCase({
        roles: ["procurement_officer"],
        status: "cancelled",
        userId: "officer",
        ownerId: "officer",
        responsibleUserId: null,
      }),
    ).toBe(false);
  });
});
