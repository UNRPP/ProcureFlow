import { describe, expect, it } from "vitest";

import {
  groupedTotalsReconcile,
  median,
  summarizeResponsibilityDetailsByStage,
} from "@/features/reports/metrics";
import {
  isReportGrouping,
  reportPeriod,
  validDateInput,
  validUuidInput,
} from "@/features/reports/filters";
import type { ResponsibilityDetailRow } from "@/server/queries/reporting";

const detail = (
  overrides: Partial<ResponsibilityDetailRow>,
): ResponsibilityDetailRow => ({
  intervalId: "i1",
  userId: "10000000-0000-0000-0000-000000000001",
  fullName: "Alex Tan",
  caseId: "c1",
  caseNumber: "PRC-2026-000001",
  caseTitle: "Monitor",
  caseStatus: "active",
  stageKey: "review",
  stageNameEn: "Review",
  stageNameTh: "ตรวจสอบ",
  stageIteration: 1,
  startedAt: "2026-07-01T00:00:00Z",
  endedAt: "2026-07-02T00:00:00Z",
  decimalDays: 1,
  assignmentSource: "default",
  ...overrides,
});

describe("report metrics", () => {
  it("calculates odd and even medians without mutating source values", () => {
    const values = [4, 1, 2, 3];
    expect(median(values)).toBe(2.5);
    expect(values).toEqual([4, 1, 2, 3]);
    expect(median([7, 1, 3])).toBe(3);
  });

  it("aggregates stages from responsibility intervals without double-counting cases", () => {
    const rows = [
      detail({ decimalDays: 1.25, caseStatus: "completed" }),
      detail({ intervalId: "i2", userId: "u2", decimalDays: 2.75 }),
      detail({ intervalId: "i3", caseId: "c2", decimalDays: 5 }),
    ];
    const [summary] = summarizeResponsibilityDetailsByStage(rows);
    expect(summary).toMatchObject({
      uniqueCases: 2,
      intervalCount: 3,
      minimumDays: 1.25,
      maximumDays: 5,
      averageDays: 3,
      medianDays: 2.75,
      totalDays: 9,
      completedCases: 1,
    });
  });

  it("reconciles grouped totals to case detail", () => {
    expect(groupedTotalsReconcile(["2", 3, 1], 6)).toBe(true);
    expect(groupedTotalsReconcile([2, 2], 5)).toBe(false);
  });
});

describe("report filters", () => {
  it("allowlists supported grouping dimensions", () => {
    expect(isReportGrouping("current_stage")).toBe(true);
    expect(isReportGrouping("arbitrary_sql")).toBe(false);
  });

  it("uses an inclusive date input by producing an exclusive next-day end", () => {
    expect(reportPeriod("2026-07-01", "2026-07-31")).toEqual({
      start: "2026-07-01T00:00:00.000Z",
      end: "2026-08-01T00:00:00.000Z",
    });
  });

  it("rejects invalid dates and UUID filters", () => {
    expect(validDateInput("2026-02-31")).toBe("");
    expect(validUuidInput("not-a-uuid")).toBe("");
    expect(validUuidInput("10000000-0000-4000-8000-000000000001")).not.toBe("");
  });
});
