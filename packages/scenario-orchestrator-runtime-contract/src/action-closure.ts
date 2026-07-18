import { canonicalSha256Schema } from "./invocation-schema";
import type { SlotActionClosureReport } from "./types";

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

export function createSlotActionClosureReport(input: {
  slotId: string;
  artifactHash: string;
  referencedActionIds: string[];
  resolvableActionIds: string[];
}): SlotActionClosureReport {
  const referencedActionIds = uniqueSorted(input.referencedActionIds);
  const resolvableActionIds = uniqueSorted(input.resolvableActionIds).filter(
    (actionId) => referencedActionIds.includes(actionId)
  );
  const unresolvedActionIds = referencedActionIds.filter(
    (actionId) => !resolvableActionIds.includes(actionId)
  );
  return {
    slotId: input.slotId,
    artifactHash: input.artifactHash,
    referencedActionIds,
    resolvableActionIds,
    unresolvedActionIds,
    complete:
      canonicalSha256Schema.safeParse(input.artifactHash).success &&
      unresolvedActionIds.length === 0
  };
}

export function isSlotActionClosureComplete(
  report: SlotActionClosureReport | undefined
): boolean {
  if (!report || !canonicalSha256Schema.safeParse(report.artifactHash).success) {
    return false;
  }
  const canonical = createSlotActionClosureReport(report);
  return (
    report.complete === true &&
    canonical.complete &&
    JSON.stringify(report.referencedActionIds) ===
      JSON.stringify(canonical.referencedActionIds) &&
    JSON.stringify(report.resolvableActionIds) ===
      JSON.stringify(canonical.resolvableActionIds) &&
    JSON.stringify(report.unresolvedActionIds) ===
      JSON.stringify(canonical.unresolvedActionIds)
  );
}
