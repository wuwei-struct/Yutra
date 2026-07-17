import { createScenarioPatternRegistry } from "@yutra/scenario-pattern-core";
import { validateScenarioComposition } from "./validate-composition";
import type {
  CompositionReadiness,
  CompositionSupportContext,
  ScenarioCompositionDraft,
  ScenarioCompositionPlan
} from "./types";

function includesAll<T extends string>(available: readonly T[], required: readonly T[]): boolean {
  return required.every((id) => available.includes(id));
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function resolveCompositionReadiness(
  input: ScenarioCompositionPlan | ScenarioCompositionDraft,
  supportContext: CompositionSupportContext
): CompositionReadiness {
  if ("eligibleForCompilerInput" in input) {
    const pattern = createScenarioPatternRegistry().get(input.patternRef.patternId);
    const patternAligned = Boolean(
      pattern &&
        pattern.version === input.patternRef.version &&
        pattern.primaryArchetypeId === input.primaryArchetypeId &&
        includesAll(input.supportingArchetypeIds, pattern.supportingArchetypeIds) &&
        includesAll(input.crossCuttingArchetypeIds, pattern.crossCuttingArchetypeIds)
    );
    const productIds = unique([input.primaryArchetypeId, ...input.supportingArchetypeIds]);
    return {
      contractValid: patternAligned,
      patternAligned,
      allProductArchetypesCompilerEnabled: includesAll(supportContext.compilerEnabledArchetypeIds, productIds),
      allProductArchetypesWorkbenchEnabled: includesAll(supportContext.workbenchEnabledArchetypeIds, productIds),
      allCrossCuttingAvailable: includesAll(
        supportContext.availableCrossCuttingArchetypeIds,
        input.crossCuttingArchetypeIds
      ),
      compositionCompilerAvailable: false,
      status: patternAligned ? "contract_only" : "invalid",
      blockers: patternAligned ? [...input.blockers] : ["scenario_pattern_alignment_failed"]
    };
  }

  const validation = validateScenarioComposition(input);
  const patternRelatedCodes = new Set([
    "COMPOSITION_PATTERN_NOT_FOUND",
    "COMPOSITION_PATTERN_VERSION_MISMATCH",
    "COMPOSITION_PATTERN_ARCHETYPE_MISMATCH"
  ]);
  const patternAligned = !validation.issues.some((issue) => patternRelatedCodes.has(issue.code));
  const productIds = unique(input.slots.map((slot) => slot.archetypeId));
  const crossCuttingIds = unique(input.crossCuttingOverlays.map((overlay) => overlay.archetypeId));
  const compilerReady = includesAll(supportContext.compilerEnabledArchetypeIds, productIds);
  const workbenchReady = includesAll(supportContext.workbenchEnabledArchetypeIds, productIds);
  const overlaysReady = includesAll(supportContext.availableCrossCuttingArchetypeIds, crossCuttingIds);
  const blockers: string[] = [];
  if (!compilerReady) blockers.push("product_archetype_compiler_support_incomplete");
  if (!workbenchReady) blockers.push("product_archetype_workbench_support_incomplete");
  if (!overlaysReady) blockers.push("cross_cutting_availability_incomplete");

  let status: CompositionReadiness["status"];
  if (!validation.ok) status = "invalid";
  else if (compilerReady && workbenchReady && overlaysReady) status = "compile_ready";
  else if (!compilerReady && !workbenchReady) status = "contract_only";
  else status = "partially_supported";

  return {
    contractValid: validation.ok,
    patternAligned,
    allProductArchetypesCompilerEnabled: compilerReady,
    allProductArchetypesWorkbenchEnabled: workbenchReady,
    allCrossCuttingAvailable: overlaysReady,
    compositionCompilerAvailable: false,
    status,
    blockers
  };
}
