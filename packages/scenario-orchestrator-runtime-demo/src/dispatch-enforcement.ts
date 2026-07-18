import type { ActionRegistry } from "@yutra/runtime";
import type { ScenarioSideEffectLevel } from "@yutra/scenario-orchestrator-runtime-contract";
import {
  DEMO_RUNTIME_ERROR_CODES,
  DemoRuntimeAdapterError
} from "./errors";
import type { SlotDispatchSummary, SlotSideEffectCoverage } from "./types";

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

export function createDispatchEnforcedActionRegistry(input: {
  actionRegistry: ActionRegistry;
  coverage: SlotSideEffectCoverage;
  maximumAllowedLevel: ScenarioSideEffectLevel;
}): {
  actionRegistry: ActionRegistry;
  summary: () => SlotDispatchSummary;
  violation: () => DemoRuntimeAdapterError | undefined;
} {
  const invocationCounts: Record<string, number> = {};
  let highestExecutedLevel: ScenarioSideEffectLevel = "none";
  let effectCount = 0;
  let externalEffectsOccurred = false;
  let dispatchViolation: DemoRuntimeAdapterError | undefined;

  const actionRegistry = Object.fromEntries(
    Object.entries(input.actionRegistry).map(([actionId, handler]) => [
      actionId,
      async (...args: Parameters<typeof handler>) => {
        const level = input.coverage.actionLevels[actionId];
        if (!level) {
          dispatchViolation = new DemoRuntimeAdapterError(
            DEMO_RUNTIME_ERROR_CODES.ACTION_SIDE_EFFECT_UNCLASSIFIED,
            `Action side-effect classification is required before dispatch for ${actionId}.`,
            { actionId }
          );
          throw dispatchViolation;
        }
        if (rank(level) > rank(input.maximumAllowedLevel)) {
          dispatchViolation = new DemoRuntimeAdapterError(
            DEMO_RUNTIME_ERROR_CODES.SIDE_EFFECT_LEVEL_EXCEEDED,
            `Action ${actionId} exceeds the invocation side-effect boundary.`,
            { actionId }
          );
          throw dispatchViolation;
        }

        invocationCounts[actionId] = (invocationCounts[actionId] ?? 0) + 1;
        if (rank(level) > rank(highestExecutedLevel)) highestExecutedLevel = level;
        if (level !== "none") effectCount += 1;
        const result = await handler(...args);
        const meta = result.meta as Record<string, unknown> | undefined;
        if (meta?.externalEffectsOccurred === true) externalEffectsOccurred = true;
        return result;
      }
    ])
  ) as ActionRegistry;

  return {
    actionRegistry,
    summary: () => ({
      highestExecutedLevel,
      effectCount,
      externalEffectsOccurred,
      invocationCounts: Object.freeze({ ...invocationCounts })
    }),
    violation: () => dispatchViolation
  };
}
