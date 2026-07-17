import type { ArchetypeManifest, ArchetypeRegistry } from "@yutra/archetype-core";
import type {
  LocalizedScenarioText,
  ScenarioPatternArchetypeSummary,
  ScenarioPatternCompositionSummary,
  ScenarioPatternManifest,
  ScenarioPatternSupportContext,
  ScenarioPatternSupportStatus
} from "./types";
import { validateScenarioPattern } from "./validate-scenario-pattern";

function summarizeArchetype(manifest: ArchetypeManifest): ScenarioPatternArchetypeSummary {
  return {
    archetypeId: manifest.archetypeId,
    name: { ...manifest.name },
    layer: manifest.taxonomy.layer
  };
}

function supportStatus(productIds: string[], enabledIds: string[]): ScenarioPatternSupportStatus {
  const enabled = new Set(enabledIds);
  const supportedCount = productIds.filter((id) => enabled.has(id)).length;
  if (supportedCount === productIds.length) return "fully_supported";
  if (supportedCount === 0) return "contract_only";
  return "partially_supported";
}

function requiredLocalizedText(value: LocalizedScenarioText | undefined, label: string): LocalizedScenarioText {
  if (!value) throw new Error(`Scenario pattern primary archetype is missing ${label} taxonomy metadata.`);
  return { ...value };
}

export function resolveScenarioPatternComposition(
  pattern: ScenarioPatternManifest,
  archetypeRegistry: ArchetypeRegistry,
  supportContext: ScenarioPatternSupportContext
): ScenarioPatternCompositionSummary {
  const validation = validateScenarioPattern(pattern, archetypeRegistry);
  if (!validation.ok) {
    throw new Error(validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; "));
  }

  const primary = archetypeRegistry.get(pattern.primaryArchetypeId)!;
  const supporting = pattern.supportingArchetypeIds.map((id) => archetypeRegistry.get(id)!);
  const crossCutting = pattern.crossCuttingArchetypeIds.map((id) => archetypeRegistry.get(id)!);
  const all = [primary, ...supporting, ...crossCutting];
  const primitiveCoverage = [...new Set(all.flatMap((manifest) => manifest.taxonomy.primitiveRefs))];
  const governanceFocus = {
    en: [...new Set(all.flatMap((manifest) => manifest.taxonomy.governanceFocus?.en ?? []))],
    zhCN: [...new Set(all.flatMap((manifest) => manifest.taxonomy.governanceFocus?.zhCN ?? []))]
  };
  const productIds = [pattern.primaryArchetypeId, ...pattern.supportingArchetypeIds];

  return {
    patternId: pattern.patternId,
    primaryArchetype: summarizeArchetype(primary),
    supportingArchetypes: supporting.map(summarizeArchetype),
    crossCuttingArchetypes: crossCutting.map(summarizeArchetype),
    triggerPattern: pattern.triggerPattern,
    primaryOutput: requiredLocalizedText(primary.taxonomy.primaryOutput, "primary output"),
    acceptanceObject: requiredLocalizedText(primary.taxonomy.acceptanceObject, "acceptance object"),
    primitiveCoverage,
    governanceFocus,
    compilerSupport: supportStatus(productIds, supportContext.compilerEnabledArchetypeIds),
    workbenchSupport: supportStatus(productIds, supportContext.workbenchEnabledArchetypeIds)
  };
}
