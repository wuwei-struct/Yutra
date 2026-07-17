import { createArchetypeRegistry, type ArchetypeRegistry } from "@yutra/archetype-core";
import { validatePackConfig } from "@yutra/pack-config-core";
import {
  createScenarioPatternRegistry,
  type ScenarioPatternRegistry
} from "@yutra/scenario-pattern-core";
import { scenarioCompositionPlanSchema } from "./composition-schema";
import type {
  ScenarioCompositionIssue,
  ScenarioCompositionIssueCode,
  ScenarioCompositionValidationResult
} from "./errors";
import { hasCompleteCompositionPrecedence } from "./precedence";
import type { ScenarioCompositionPlan } from "./types";

export type ScenarioCompositionValidationOptions = {
  archetypeRegistry?: ArchetypeRegistry;
  patternRegistry?: ScenarioPatternRegistry;
};

const TERMINAL_ROUTE_TARGETS = new Set(["$scenario_done", "$human_handoff", "$fail_closed"]);
const DEEP_MERGE_KEYS = new Set(["mergedPackConfig", "flattenedConfig", "deepMerge"]);

function issue(code: ScenarioCompositionIssueCode, message: string, path?: string[]): ScenarioCompositionIssue {
  return { code, message, path };
}

function hasForbiddenDeepMergeKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasForbiddenDeepMergeKey);
  return Object.entries(value).some(([key, nested]) => DEEP_MERGE_KEYS.has(key) || hasForbiddenDeepMergeKey(nested));
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function exactSetMatch(actual: string[], expected: string[]): boolean {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    new Set(expected).size === expected.length &&
    actual.every((value) => expected.includes(value))
  );
}

export function validateScenarioComposition(
  input: unknown,
  options: ScenarioCompositionValidationOptions = {}
): ScenarioCompositionValidationResult {
  const issues: ScenarioCompositionIssue[] = [];

  if (hasForbiddenDeepMergeKey(input)) {
    issues.push(
      issue(
        "COMPOSITION_DEEP_MERGE_NOT_ALLOWED",
        "Scenario composition preserves namespaced Pack Configs; mergedPackConfig, flattenedConfig, and deepMerge are forbidden."
      )
    );
  }

  const loose = input as Record<string, unknown> | undefined;
  if (loose?.executionModel !== undefined && loose.executionModel !== "orchestrated_subflows") {
    issues.push(
      issue(
        "COMPOSITION_EXECUTION_MODEL_UNSUPPORTED",
        "Only executionModel=orchestrated_subflows is supported.",
        ["executionModel"]
      )
    );
  }

  const parsed = scenarioCompositionPlanSchema.safeParse(input);
  if (!parsed.success) {
    for (const schemaIssue of parsed.error.issues) {
      const path = schemaIssue.path.map(String);
      let code: ScenarioCompositionIssueCode = "COMPOSITION_SCHEMA_INVALID";
      if (path.join(".") === "precedencePolicy.conflictMode") code = "COMPOSITION_CONFLICT_MODE_INVALID";
      if (path.join(".") === "patternRef.patternId") code = "COMPOSITION_PATTERN_NOT_FOUND";
      if (path.at(-1) === "transform") code = "COMPOSITION_BINDING_TRANSFORM_UNSUPPORTED";
      if (path[0] === "crossCuttingOverlays" && path.at(-1) === "archetypeId") {
        code = "COMPOSITION_OVERLAY_LAYER_MISMATCH";
      }
      if (path[0] === "slots" && path.at(-1) === "archetypeId") code = "COMPOSITION_SLOT_ARCHETYPE_MISMATCH";
      if (path[0] === "publicExposure") code = "COMPOSITION_PUBLIC_BOUNDARY_INVALID";
      issues.push(issue(code, schemaIssue.message, path));
    }
    return { ok: false, issues };
  }

  const plan = parsed.data as ScenarioCompositionPlan;
  const archetypeRegistry = options.archetypeRegistry ?? createArchetypeRegistry();
  const patternRegistry = options.patternRegistry ?? createScenarioPatternRegistry(undefined, archetypeRegistry);
  const pattern = patternRegistry.get(plan.patternRef.patternId);

  if (!pattern) {
    issues.push(issue("COMPOSITION_PATTERN_NOT_FOUND", `Scenario Pattern ${plan.patternRef.patternId} was not found.`, ["patternRef", "patternId"]));
    return { ok: false, issues };
  }
  if (pattern.version !== plan.patternRef.version) {
    issues.push(
      issue(
        "COMPOSITION_PATTERN_VERSION_MISMATCH",
        `Pattern version ${plan.patternRef.version} does not match registered version ${pattern.version}.`,
        ["patternRef", "version"]
      )
    );
  }

  const duplicateSlotIds = duplicateValues(plan.slots.map((slot) => slot.slotId));
  for (const slotId of duplicateSlotIds) {
    issues.push(issue("COMPOSITION_SLOT_DUPLICATE", `Duplicate slot id ${slotId}.`, ["slots"]));
  }
  for (const [collection, ids] of [
    ["crossCuttingOverlays", plan.crossCuttingOverlays.map((overlay) => overlay.overlayId)],
    ["routes", plan.routes.map((route) => route.routeId)],
    ["dataBindings", plan.dataBindings.map((binding) => binding.bindingId)]
  ] as const) {
    for (const duplicate of duplicateValues(ids)) {
      issues.push(issue("COMPOSITION_SCHEMA_INVALID", `Duplicate ${collection} id ${duplicate}.`, [collection]));
    }
  }

  const primarySlots = plan.slots.filter((slot) => slot.role === "primary");
  if (primarySlots.length === 0) {
    issues.push(issue("COMPOSITION_PRIMARY_SLOT_MISSING", "A composition requires exactly one primary slot.", ["slots"]));
  } else if (primarySlots.length > 1) {
    issues.push(issue("COMPOSITION_MULTIPLE_PRIMARY_SLOTS", "A composition cannot contain multiple primary slots.", ["slots"]));
  }
  const selectedPrimary = plan.slots.find((slot) => slot.slotId === plan.primarySlotId);
  if (!selectedPrimary || selectedPrimary.role !== "primary") {
    issues.push(
      issue("COMPOSITION_PRIMARY_SLOT_MISSING", "primarySlotId must reference the unique primary slot.", ["primarySlotId"])
    );
  }

  const slotIds = new Set(plan.slots.map((slot) => slot.slotId));
  for (const [index, slot] of plan.slots.entries()) {
    const manifest = archetypeRegistry.get(slot.archetypeId);
    if (!manifest || manifest.taxonomy.layer !== "product_archetype") {
      issues.push(
        issue(
          "COMPOSITION_SLOT_ARCHETYPE_MISMATCH",
          `Slot ${slot.slotId} must reference a Product Archetype.`,
          ["slots", String(index), "archetypeId"]
        )
      );
    }
    if (slot.role === "primary" && slot.archetypeId !== pattern.primaryArchetypeId) {
      issues.push(
        issue(
          "COMPOSITION_PATTERN_ARCHETYPE_MISMATCH",
          `Primary slot must use ${pattern.primaryArchetypeId}.`,
          ["slots", String(index), "archetypeId"]
        )
      );
    }
    if (slot.role === "supporting" && !pattern.supportingArchetypeIds.includes(slot.archetypeId)) {
      issues.push(
        issue(
          "COMPOSITION_PATTERN_ARCHETYPE_MISMATCH",
          `Supporting archetype ${slot.archetypeId} is not declared by Pattern ${pattern.patternId}.`,
          ["slots", String(index), "archetypeId"]
        )
      );
    }

    const packValidation = validatePackConfig(slot.packConfig);
    if (!packValidation.ok) {
      issues.push(
        issue(
          "COMPOSITION_PACK_CONFIG_INVALID",
          `Pack Config ${slot.packConfigId} failed validation: ${packValidation.issues
            .filter((packIssue) => packIssue.severity === "error")
            .map((packIssue) => packIssue.code)
            .join(", ")}.`,
          ["slots", String(index), "packConfig"]
        )
      );
    }
    if (slot.packConfig.packConfigId !== slot.packConfigId) {
      issues.push(
        issue(
          "COMPOSITION_PACK_CONFIG_INVALID",
          `Slot Pack Config ID ${slot.packConfigId} does not match embedded Pack Config ${slot.packConfig.packConfigId}.`,
          ["slots", String(index), "packConfigId"]
        )
      );
    }
    if (slot.packConfig.archetypeId !== slot.archetypeId) {
      issues.push(
        issue(
          "COMPOSITION_PACK_CONFIG_ARCHETYPE_MISMATCH",
          `Pack Config archetype ${slot.packConfig.archetypeId} does not match slot archetype ${slot.archetypeId}.`,
          ["slots", String(index), "packConfig", "archetypeId"]
        )
      );
    }
    if (slot.packConfig.adapters.some((adapter) => adapter.mode !== "mock")) {
      issues.push(
        issue(
          "COMPOSITION_PUBLIC_BOUNDARY_INVALID",
          `Public demo slot ${slot.slotId} must use mock adapters only.`,
          ["slots", String(index), "packConfig", "adapters"]
        )
      );
    }
  }

  const actualSupporting = plan.slots.filter((slot) => slot.role === "supporting").map((slot) => slot.archetypeId);
  if (!exactSetMatch(actualSupporting, pattern.supportingArchetypeIds)) {
    issues.push(
      issue(
        "COMPOSITION_PATTERN_ARCHETYPE_MISMATCH",
        `Supporting slots must exactly match Pattern ${pattern.patternId}.`,
        ["slots"]
      )
    );
  }

  for (const [index, overlay] of plan.crossCuttingOverlays.entries()) {
    const manifest = archetypeRegistry.get(overlay.archetypeId);
    if (!manifest || manifest.taxonomy.layer !== "cross_cutting_archetype") {
      issues.push(
        issue(
          "COMPOSITION_OVERLAY_LAYER_MISMATCH",
          `Overlay ${overlay.overlayId} must reference a Cross-cutting Archetype.`,
          ["crossCuttingOverlays", String(index), "archetypeId"]
        )
      );
    }
    if (!pattern.crossCuttingArchetypeIds.includes(overlay.archetypeId)) {
      issues.push(
        issue(
          "COMPOSITION_PATTERN_ARCHETYPE_MISMATCH",
          `Cross-cutting archetype ${overlay.archetypeId} is not declared by Pattern ${pattern.patternId}.`,
          ["crossCuttingOverlays", String(index), "archetypeId"]
        )
      );
    }
    for (const [scopeIndex, scope] of overlay.scopes.entries()) {
      if (scope.type === "slot" && !slotIds.has(scope.slotId)) {
        issues.push(
          issue(
            "COMPOSITION_SCOPE_TARGET_NOT_FOUND",
            `Overlay scope references unknown slot ${scope.slotId}.`,
            ["crossCuttingOverlays", String(index), "scopes", String(scopeIndex)]
          )
        );
      }
      if (scope.type === "route" && !plan.routes.some((route) => route.routeId === scope.routeId)) {
        issues.push(
          issue(
            "COMPOSITION_SCOPE_TARGET_NOT_FOUND",
            `Overlay scope references unknown route ${scope.routeId}.`,
            ["crossCuttingOverlays", String(index), "scopes", String(scopeIndex)]
          )
        );
      }
    }
  }
  const actualCrossCutting = plan.crossCuttingOverlays.map((overlay) => overlay.archetypeId);
  if (!exactSetMatch(actualCrossCutting, pattern.crossCuttingArchetypeIds)) {
    issues.push(
      issue(
        "COMPOSITION_PATTERN_ARCHETYPE_MISMATCH",
        `Cross-cutting overlays must exactly match Pattern ${pattern.patternId}.`,
        ["crossCuttingOverlays"]
      )
    );
  }

  for (const [index, route] of plan.routes.entries()) {
    if (!slotIds.has(route.fromSlotId)) {
      issues.push(
        issue("COMPOSITION_ROUTE_SOURCE_NOT_FOUND", `Route source ${route.fromSlotId} was not found.`, ["routes", String(index), "fromSlotId"])
      );
    }
    if (!slotIds.has(route.toSlotId) && !TERMINAL_ROUTE_TARGETS.has(route.toSlotId)) {
      issues.push(
        issue("COMPOSITION_ROUTE_TARGET_NOT_FOUND", `Route target ${route.toSlotId} was not found.`, ["routes", String(index), "toSlotId"])
      );
    }
    if (route.fromSlotId === route.toSlotId) {
      issues.push(
        issue("COMPOSITION_ROUTE_SELF_REFERENCE", `Route ${route.routeId} cannot directly target its source slot.`, ["routes", String(index)])
      );
    }
  }

  for (const [index, binding] of plan.dataBindings.entries()) {
    if (!slotIds.has(binding.fromSlotId)) {
      issues.push(
        issue(
          "COMPOSITION_BINDING_SOURCE_NOT_FOUND",
          `Binding source ${binding.fromSlotId} was not found.`,
          ["dataBindings", String(index), "fromSlotId"]
        )
      );
    }
    if (!slotIds.has(binding.toSlotId)) {
      issues.push(
        issue(
          "COMPOSITION_BINDING_TARGET_NOT_FOUND",
          `Binding target ${binding.toSlotId} was not found.`,
          ["dataBindings", String(index), "toSlotId"]
        )
      );
    }
  }

  if (!hasCompleteCompositionPrecedence(plan.precedencePolicy)) {
    issues.push(
      issue(
        "COMPOSITION_PRECEDENCE_INCOMPLETE",
        "Precedence policy must contain the complete ordered fail-closed rule set.",
        ["precedencePolicy", "rules"]
      )
    );
  }

  return { ok: issues.length === 0, issues };
}
