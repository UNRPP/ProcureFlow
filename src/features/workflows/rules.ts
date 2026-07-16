import type { CaseStatus } from "@/types/database";

export type WorkflowAction =
  | "complete"
  | "return"
  | "reassign"
  | "hold"
  | "resume"
  | "skip"
  | "cancel"
  | "complete_case";

export function transitionRequiresReason(action: WorkflowAction): boolean {
  return ["return", "hold", "skip", "cancel"].includes(action);
}

export function availableWorkflowActions({
  caseStatus,
  stageSequence,
  finalSequence,
  canSkip,
}: {
  caseStatus: CaseStatus;
  stageSequence: number;
  finalSequence: number;
  canSkip: boolean;
}): WorkflowAction[] {
  if (caseStatus === "on_hold") return ["resume", "reassign", "cancel"];
  if (caseStatus !== "active") return [];
  return [
    "complete",
    ...(stageSequence > 1 ? (["return"] as const) : []),
    "reassign",
    "hold",
    ...(canSkip ? (["skip"] as const) : []),
    "cancel",
    ...(stageSequence === finalSequence ? (["complete_case"] as const) : []),
  ];
}

export function responsibilityIntervalDays(
  startedAt: string | Date,
  endedAt: string | Date,
): number {
  const milliseconds =
    new Date(endedAt).getTime() - new Date(startedAt).getTime();
  return Math.max(milliseconds, 0) / 86_400_000;
}
