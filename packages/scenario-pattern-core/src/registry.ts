import {
  createArchetypeRegistry,
  type ArchetypeRegistry,
  type CrossCuttingArchetypeId,
  type TriggerPattern
} from "@yutra/archetype-core";
import { BUILTIN_SCENARIO_PATTERNS } from "./builtin-scenario-patterns";
import { explainScenarioPattern, type ScenarioPatternExplainLocale } from "./explain-scenario-pattern";
import type { ScenarioPatternId } from "./ids";
import type { ProductArchetypeId, ScenarioPatternManifest, ScenarioPatternSupportContext } from "./types";
import { validateScenarioPattern } from "./validate-scenario-pattern";

function clonePattern(pattern: ScenarioPatternManifest): ScenarioPatternManifest {
  return {
    ...pattern,
    name: { ...pattern.name },
    summary: { ...pattern.summary },
    supportingArchetypeIds: [...pattern.supportingArchetypeIds],
    crossCuttingArchetypeIds: [...pattern.crossCuttingArchetypeIds],
    compositionRationale: { ...pattern.compositionRationale },
    acceptanceSummary: { ...pattern.acceptanceSummary },
    scenarioTags: [...pattern.scenarioTags],
    publicExposure: { ...pattern.publicExposure }
  };
}

export type ScenarioPatternRegistry = {
  list(): ScenarioPatternManifest[];
  get(patternId: ScenarioPatternId): ScenarioPatternManifest | undefined;
  listByPrimaryArchetype(archetypeId: ProductArchetypeId): ScenarioPatternManifest[];
  listBySupportingArchetype(archetypeId: ProductArchetypeId): ScenarioPatternManifest[];
  listByCrossCuttingArchetype(archetypeId: CrossCuttingArchetypeId): ScenarioPatternManifest[];
  listByTrigger(triggerPattern: TriggerPattern): ScenarioPatternManifest[];
  explain(patternId: ScenarioPatternId, locale: ScenarioPatternExplainLocale, supportContext: ScenarioPatternSupportContext): string | undefined;
};

export function createScenarioPatternRegistry(
  patterns: ScenarioPatternManifest[] = BUILTIN_SCENARIO_PATTERNS,
  archetypeRegistry: ArchetypeRegistry = createArchetypeRegistry()
): ScenarioPatternRegistry {
  const ordered = patterns.map(clonePattern);
  const seen = new Set<string>();
  for (const pattern of ordered) {
    if (seen.has(pattern.patternId)) throw new Error(`SCENARIO_PATTERN_DUPLICATE_ARCHETYPE: Duplicate pattern id ${pattern.patternId}.`);
    seen.add(pattern.patternId);
    const validation = validateScenarioPattern(pattern, archetypeRegistry);
    if (!validation.ok) {
      throw new Error(validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; "));
    }
  }

  const list = (predicate?: (pattern: ScenarioPatternManifest) => boolean): ScenarioPatternManifest[] =>
    ordered.filter((pattern) => (predicate ? predicate(pattern) : true)).map(clonePattern);

  return {
    list: () => list(),
    get: (patternId) => {
      const pattern = ordered.find((item) => item.patternId === patternId);
      return pattern ? clonePattern(pattern) : undefined;
    },
    listByPrimaryArchetype: (archetypeId) => list((pattern) => pattern.primaryArchetypeId === archetypeId),
    listBySupportingArchetype: (archetypeId) => list((pattern) => pattern.supportingArchetypeIds.includes(archetypeId)),
    listByCrossCuttingArchetype: (archetypeId) => list((pattern) => pattern.crossCuttingArchetypeIds.includes(archetypeId)),
    listByTrigger: (triggerPattern) => list((pattern) => pattern.triggerPattern === triggerPattern),
    explain: (patternId, locale, supportContext) =>
      explainScenarioPattern(patternId, locale, supportContext, { patterns: ordered, archetypeRegistry })
  };
}

const builtinRegistry = createScenarioPatternRegistry();

export function listScenarioPatterns(): ScenarioPatternManifest[] {
  return builtinRegistry.list();
}

export function getScenarioPattern(patternId: ScenarioPatternId): ScenarioPatternManifest | undefined {
  return builtinRegistry.get(patternId);
}

export function listScenarioPatternsByPrimaryArchetype(archetypeId: ProductArchetypeId): ScenarioPatternManifest[] {
  return builtinRegistry.listByPrimaryArchetype(archetypeId);
}

export function listScenarioPatternsBySupportingArchetype(archetypeId: ProductArchetypeId): ScenarioPatternManifest[] {
  return builtinRegistry.listBySupportingArchetype(archetypeId);
}

export function listScenarioPatternsByCrossCuttingArchetype(archetypeId: CrossCuttingArchetypeId): ScenarioPatternManifest[] {
  return builtinRegistry.listByCrossCuttingArchetype(archetypeId);
}

export function listScenarioPatternsByTrigger(triggerPattern: TriggerPattern): ScenarioPatternManifest[] {
  return builtinRegistry.listByTrigger(triggerPattern);
}
