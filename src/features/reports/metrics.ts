import type { ResponsibilityDetailRow } from "@/server/queries/reporting";

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

export type StageStatistic = {
  stepKey: string;
  stageNameEn: string;
  stageNameTh: string;
  uniqueCases: number;
  intervalCount: number;
  minimumDays: number;
  maximumDays: number;
  averageDays: number;
  medianDays: number;
  totalDays: number;
  completedCases: number;
};

export function summarizeResponsibilityDetailsByStage(
  rows: ResponsibilityDetailRow[],
): StageStatistic[] {
  const grouped = new Map<string, ResponsibilityDetailRow[]>();
  rows.forEach((row) => {
    grouped.set(row.stageKey, [...(grouped.get(row.stageKey) ?? []), row]);
  });
  return [...grouped.entries()]
    .map(([stepKey, group]) => {
      const days = group.map((row) => row.decimalDays);
      const uniqueCases = new Set(group.map((row) => row.caseId));
      const completedCases = new Set(
        group
          .filter((row) => row.caseStatus === "completed")
          .map((row) => row.caseId),
      );
      const totalDays = days.reduce((sum, value) => sum + value, 0);
      return {
        stepKey,
        stageNameEn: group[0]!.stageNameEn,
        stageNameTh: group[0]!.stageNameTh,
        uniqueCases: uniqueCases.size,
        intervalCount: group.length,
        minimumDays: Math.min(...days),
        maximumDays: Math.max(...days),
        averageDays: totalDays / days.length,
        medianDays: median(days),
        totalDays,
        completedCases: completedCases.size,
      };
    })
    .sort((a, b) => a.stepKey.localeCompare(b.stepKey));
}

export function groupedTotalsReconcile(
  groupedTotals: Array<number | string>,
  caseCount: number,
): boolean {
  return (
    groupedTotals.reduce<number>((sum, value) => sum + Number(value), 0) ===
    caseCount
  );
}
