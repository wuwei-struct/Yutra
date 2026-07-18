import type {
  ScenarioSideEffectLevel,
  SlotActionClosureReport
} from "@yutra/scenario-orchestrator-runtime-contract";
import {
  DEMO_RUNTIME_ERROR_CODES,
  DemoRuntimeAdapterError
} from "./errors";
import type { SlotSideEffectCoverage } from "./types";

const SIDE_EFFECT_LEVELS: readonly ScenarioSideEffectLevel[] = [
  "none",
  "read",
  "write",
  "external",
  "financial",
  "approval"
];
function rank(level: ScenarioSideEffectLevel): number {
  return SIDE_EFFECT_LEVELS.indexOf(level);
}

export function inspectSlotSideEffectCoverage(input: {
  closure: SlotActionClosureReport;
  resolveSideEffectLevel: (
    actionId: string
  ) => ScenarioSideEffectLevel | undefined;
}): SlotSideEffectCoverage {
  const actionLevels: Record<string, ScenarioSideEffectLevel> = {};
  const unclassifiedActionIds: string[] = [];
  let potentialMaximumLevel: ScenarioSideEffectLevel = "none";
  for (const actionId of input.closure.referencedActionIds) {
    const level = input.resolveSideEffectLevel(actionId);
    if (!level) {
      unclassifiedActionIds.push(actionId);
      continue;
    }
    actionLevels[actionId] = level;
    if (rank(level) > rank(potentialMaximumLevel)) potentialMaximumLevel = level;
  }
  if (unclassifiedActionIds.length > 0) {
    const actionId = unclassifiedActionIds[0] ?? "unknown";
    throw new DemoRuntimeAdapterError(
      DEMO_RUNTIME_ERROR_CODES.ACTION_SIDE_EFFECT_UNCLASSIFIED,
      `Action side-effect classification is required for ${actionId}.`,
      { actionId }
    );
  }

  const referencedActionIds = [...input.closure.referencedActionIds].sort();
  const classifiedActionIds = Object.keys(actionLevels).sort();
  return {
    actionLevels: Object.freeze({ ...actionLevels }),
    referencedActionIds,
    classifiedActionIds,
    unclassifiedActionIds: [],
    potentialMaximumLevel,
    complete: classifiedActionIds.length === referencedActionIds.length
  };
}
