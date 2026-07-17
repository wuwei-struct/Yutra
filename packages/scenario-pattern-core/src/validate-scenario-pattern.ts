import {
  createArchetypeRegistry,
  isArchetypeId,
  triggerPatternSchema,
  type ArchetypeRegistry
} from "@yutra/archetype-core";
import type { ScenarioPatternIssue } from "./errors";
import { makeScenarioPatternValidationResult, type ScenarioPatternValidationResult } from "./errors";
import { scenarioPatternManifestSchema } from "./manifest-schema";

function schemaIssues(error: { issues: Array<{ path: Array<string | number>; message: string }> }): ScenarioPatternIssue[] {
  return error.issues.map((issue) => ({
    code: "SCENARIO_PATTERN_SCHEMA_INVALID",
    severity: "error",
    message: issue.message,
    path: issue.path.map(String)
  }));
}

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
}

function hasDuplicates(values: unknown[]): boolean {
  const strings = values.filter((value): value is string => typeof value === "string");
  return new Set(strings).size !== strings.length;
}

export function validateScenarioPattern(
  input: unknown,
  archetypeRegistry: ArchetypeRegistry = createArchetypeRegistry()
): ScenarioPatternValidationResult {
  const issues: ScenarioPatternIssue[] = [];
  const candidate = asRecord(input);
  const primary = candidate.primaryArchetypeId;
  const supporting = Array.isArray(candidate.supportingArchetypeIds) ? candidate.supportingArchetypeIds : [];
  const crossCutting = Array.isArray(candidate.crossCuttingArchetypeIds) ? candidate.crossCuttingArchetypeIds : [];

  if (typeof primary !== "string" || !isArchetypeId(primary) || !archetypeRegistry.get(primary)) {
    issues.push({
      code: "SCENARIO_PATTERN_PRIMARY_ARCHETYPE_INVALID",
      severity: "error",
      message: `Unknown primary archetype ${String(primary)}.`,
      path: ["primaryArchetypeId"]
    });
  } else if (archetypeRegistry.get(primary)?.taxonomy.layer !== "product_archetype") {
    issues.push({
      code: "SCENARIO_PATTERN_PRIMARY_NOT_PRODUCT",
      severity: "error",
      message: `Primary archetype ${primary} must be a product archetype.`,
      path: ["primaryArchetypeId"]
    });
  }

  for (const value of supporting) {
    if (typeof value !== "string" || !isArchetypeId(value) || !archetypeRegistry.get(value)) {
      issues.push({
        code: "SCENARIO_PATTERN_SUPPORTING_ARCHETYPE_INVALID",
        severity: "error",
        message: `Unknown supporting archetype ${String(value)}.`,
        path: ["supportingArchetypeIds"]
      });
    } else if (archetypeRegistry.get(value)?.taxonomy.layer !== "product_archetype") {
      issues.push({
        code: "SCENARIO_PATTERN_SUPPORTING_NOT_PRODUCT",
        severity: "error",
        message: `Supporting archetype ${value} must be a product archetype.`,
        path: ["supportingArchetypeIds"]
      });
    }
  }

  for (const value of crossCutting) {
    if (typeof value !== "string" || !isArchetypeId(value) || !archetypeRegistry.get(value)) {
      issues.push({
        code: "SCENARIO_PATTERN_CROSS_CUTTING_INVALID",
        severity: "error",
        message: `Unknown cross-cutting archetype ${String(value)}.`,
        path: ["crossCuttingArchetypeIds"]
      });
    } else if (archetypeRegistry.get(value)?.taxonomy.layer !== "cross_cutting_archetype") {
      issues.push({
        code: "SCENARIO_PATTERN_CROSS_CUTTING_LAYER_MISMATCH",
        severity: "error",
        message: `Cross-cutting reference ${value} must use the cross-cutting archetype layer.`,
        path: ["crossCuttingArchetypeIds"]
      });
    }
  }

  if (typeof primary === "string" && supporting.includes(primary)) {
    issues.push({
      code: "SCENARIO_PATTERN_PRIMARY_DUPLICATED_AS_SUPPORTING",
      severity: "error",
      message: "The primary archetype must not also appear as a supporting archetype.",
      path: ["supportingArchetypeIds"]
    });
  }

  const supportingStrings = supporting.filter((value): value is string => typeof value === "string");
  const crossCuttingStrings = crossCutting.filter((value): value is string => typeof value === "string");
  const overlaps = supportingStrings.some((value) => crossCuttingStrings.includes(value));
  if (hasDuplicates(supporting) || hasDuplicates(crossCutting) || overlaps) {
    issues.push({
      code: "SCENARIO_PATTERN_DUPLICATE_ARCHETYPE",
      severity: "error",
      message: "Scenario pattern archetype references must be unique within and across composition roles.",
      path: ["supportingArchetypeIds", "crossCuttingArchetypeIds"]
    });
  }

  const publicExposure = asRecord(candidate.publicExposure);
  if (
    publicExposure.mode !== "demo_only" ||
    publicExposure.containsCustomerData !== false ||
    publicExposure.containsRealEndpoint !== false ||
    publicExposure.containsSecret !== false ||
    publicExposure.containsCustomerSop !== false ||
    publicExposure.containsCommercialDeliveryAsset !== false
  ) {
    issues.push({
      code: "SCENARIO_PATTERN_PUBLIC_BOUNDARY_INVALID",
      severity: "error",
      message: "Public scenario patterns must remain demo-only and set every exposure risk flag to false.",
      path: ["publicExposure"]
    });
  }

  if (!triggerPatternSchema.safeParse(candidate.triggerPattern).success) {
    issues.push({
      code: "SCENARIO_PATTERN_TRIGGER_INVALID",
      severity: "error",
      message: `Unsupported trigger pattern ${String(candidate.triggerPattern)}.`,
      path: ["triggerPattern"]
    });
  }

  const parsed = scenarioPatternManifestSchema.safeParse(input);
  if (!parsed.success) {
    issues.push(...schemaIssues(parsed.error));
  }

  return makeScenarioPatternValidationResult(issues);
}
