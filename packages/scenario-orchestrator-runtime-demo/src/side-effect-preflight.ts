import type {
  ScenarioSideEffectLevel,
  SlotActionClosureReport
} from "@yutra/scenario-orchestrator-runtime-contract";
import {
  DEMO_RUNTIME_ERROR_CODES,
  DemoRuntimeAdapterError
} from "./errors";
import type { SlotSideEffectPreflight } from "./types";

const SIDE_EFFECT_LEVELS: readonly ScenarioSideEffectLevel[] = [
  "none",
  "read",
  "write",
  "external",
  "financial",
  "approval"
];
const DEMO_ALLOWED_LEVELS = new Set<ScenarioSideEffectLevel>([
  "none",
  "read",
  "external"
]);

function rank(level: ScenarioSideEffectLevel): number {
  return SIDE_EFFECT_LEVELS.indexOf(level);
}

export function inspectSlotSideEffects(input: {
  closure: SlotActionClosureReport;
  maximumAllowedLevel: ScenarioSideEffectLevel;
  declaredActionLevels?: Readonly<
    Record<string, ScenarioSideEffectLevel | undefined>
  >;
  resolveSideEffectLevel: (
    actionId: string
  ) => ScenarioSideEffectLevel | undefined;
}): SlotSideEffectPreflight {
  const actionLevels: Record<string, ScenarioSideEffectLevel> = {};
  let highestLevel: ScenarioSideEffectLevel = "none";
  for (const actionId of input.closure.referencedActionIds) {
    const level = input.resolveSideEffectLevel(actionId);
    if (!level) {
      throw new DemoRuntimeAdapterError(
        DEMO_RUNTIME_ERROR_CODES.ACTION_SIDE_EFFECT_UNCLASSIFIED,
        `Action side-effect classification is required for ${actionId}.`,
        { actionId }
      );
    }
    const declaredLevel = input.declaredActionLevels?.[actionId] ?? "none";
    if (rank(level) < rank(declaredLevel)) {
      throw new DemoRuntimeAdapterError(
        DEMO_RUNTIME_ERROR_CODES.SIDE_EFFECT_LEVEL_EXCEEDED,
        `Action ${actionId} classification cannot lower the Agent DSL declaration.`,
        { actionId }
      );
    }
    if (
      rank(level) > rank(input.maximumAllowedLevel) ||
      !DEMO_ALLOWED_LEVELS.has(level)
    ) {
      throw new DemoRuntimeAdapterError(
        DEMO_RUNTIME_ERROR_CODES.SIDE_EFFECT_LEVEL_EXCEEDED,
        `Action ${actionId} exceeds the mock-only Slot side-effect boundary.`,
        { actionId }
      );
    }
    actionLevels[actionId] = level;
    if (rank(level) > rank(highestLevel)) highestLevel = level;
  }
  return {
    actionLevels: Object.freeze({ ...actionLevels }),
    highestLevel,
    effectCount: 0
  };
}
