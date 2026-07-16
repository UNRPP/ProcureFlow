import { describe, expect, it } from "vitest";

import {
  availableWorkflowActions,
  responsibilityIntervalDays,
  transitionRequiresReason,
} from "@/features/workflows/rules";

describe("workflow rules", () => {
  it("requires reasons for history-changing exception actions", () => {
    expect(transitionRequiresReason("return")).toBe(true);
    expect(transitionRequiresReason("hold")).toBe(true);
    expect(transitionRequiresReason("skip")).toBe(true);
    expect(transitionRequiresReason("cancel")).toBe(true);
    expect(transitionRequiresReason("complete")).toBe(false);
    expect(transitionRequiresReason("reassign")).toBe(false);
  });

  it("does not offer return from the first stage or completion before the last", () => {
    const actions = availableWorkflowActions({
      caseStatus: "active",
      stageSequence: 1,
      finalSequence: 7,
      canSkip: false,
    });
    expect(actions).not.toContain("return");
    expect(actions).not.toContain("skip");
    expect(actions).not.toContain("complete_case");
    expect(actions).toContain("complete");
  });

  it("offers only safe actions while a case is on hold", () => {
    expect(
      availableWorkflowActions({
        caseStatus: "on_hold",
        stageSequence: 3,
        finalSequence: 7,
        canSkip: true,
      }),
    ).toEqual(["resume", "reassign", "cancel"]);
  });

  it("calculates exact decimal calendar days from raw timestamps", () => {
    expect(
      responsibilityIntervalDays(
        "2026-07-01T06:00:00Z",
        "2026-07-03T18:00:00Z",
      ),
    ).toBe(2.5);
  });
});
