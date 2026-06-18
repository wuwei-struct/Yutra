import type { ArchetypeCompositionContract } from "./composition-contract";
import { compositionContractSchema, archetypeManifestSchema } from "./manifest-schema";
import type { ArchetypeManifest } from "./types";
import { isArchetypeId, isCrossCuttingArchetypeId, isMainArchetypeId } from "./ids";
import { compareSideEffectLevel } from "./side-effect";
import type { ArchetypeIssue, ArchetypeValidationResult } from "./errors";
import { makeResult } from "./errors";

function zodIssues(error: { issues: Array<{ path: Array<string | number>; message: string }> }): ArchetypeIssue[] {
  return error.issues.map((issue) => ({
    code: "ARCHETYPE_SCHEMA_INVALID",
    severity: "error",
    message: issue.message,
    path: issue.path.map(String)
  }));
}

export function validateCompositionContract(input: unknown): ArchetypeValidationResult {
  const issues: ArchetypeIssue[] = [];
  const parsed = compositionContractSchema.safeParse(input);
  if (!parsed.success) {
    return makeResult(zodIssues(parsed.error));
  }

  const contract = parsed.data as ArchetypeCompositionContract;
  if (contract.contextPolicy.writeConflicts === "last_write_wins") {
    issues.push({
      code: "ARCHETYPE_CONTEXT_POLICY_UNSAFE",
      severity: "warning",
      message: "last_write_wins is allowed but less conservative than deny or most_restrictive_wins.",
      path: ["contextPolicy", "writeConflicts"],
      hint: "Use deny for public archetype defaults."
    });
  }

  if (compareSideEffectLevel(contract.sideEffectPolicy.maxAutoSideEffect, "write") >= 0) {
    issues.push({
      code: "ARCHETYPE_SIDE_EFFECT_POLICY_UNSAFE",
      severity: "error",
      message: "Default composition contract must not allow automatic write-or-higher side effects.",
      path: ["sideEffectPolicy", "maxAutoSideEffect"]
    });
  }

  return makeResult(issues);
}

export function validateArchetypeManifest(input: unknown): ArchetypeValidationResult {
  const issues: ArchetypeIssue[] = [];
  const parsed = archetypeManifestSchema.safeParse(input);

  if (!parsed.success) {
    issues.push(...zodIssues(parsed.error));
    const maybe = input as Partial<ArchetypeManifest> | undefined;
    if (typeof maybe?.archetypeId === "string" && !isArchetypeId(maybe.archetypeId)) {
      issues.push({
        code: "ARCHETYPE_INVALID_ID",
        severity: "error",
        message: `Unknown archetype id ${maybe.archetypeId}.`,
        path: ["archetypeId"]
      });
    }
    if (
      typeof maybe?.archetypeVersion === "string" &&
      !/^\d+\.\d+\.\d+([-.][A-Za-z0-9.]+)?$/.test(maybe.archetypeVersion)
    ) {
      issues.push({
        code: "ARCHETYPE_VERSION_INVALID",
        severity: "error",
        message: `Invalid archetype version ${maybe.archetypeVersion}.`,
        path: ["archetypeVersion"]
      });
    }
    if (
      maybe?.publicExposure &&
      (maybe.publicExposure.containsCustomerAssets !== false ||
        maybe.publicExposure.containsRealEndpoints !== false ||
        maybe.publicExposure.containsCommercialSop !== false)
    ) {
      issues.push({
        code: "ARCHETYPE_PUBLIC_EXPOSURE_UNSAFE",
        severity: "error",
        message: "Public archetype manifests must not contain customer assets, real endpoints, or commercial SOP."
      });
    }
    return makeResult(issues);
  }

  const manifest = parsed.data as ArchetypeManifest;
  if (manifest.kind === "main" && !isMainArchetypeId(manifest.archetypeId)) {
    issues.push({
      code: "ARCHETYPE_KIND_MISMATCH",
      severity: "error",
      message: `Main archetype cannot use cross-cutting id ${manifest.archetypeId}.`,
      path: ["archetypeId"]
    });
  }

  if (manifest.kind === "cross_cutting" && !isCrossCuttingArchetypeId(manifest.archetypeId)) {
    issues.push({
      code: "ARCHETYPE_KIND_MISMATCH",
      severity: "error",
      message: `Cross-cutting archetype cannot use main id ${manifest.archetypeId}.`,
      path: ["archetypeId"]
    });
  }

  for (const id of manifest.compatibleCrossCutting ?? []) {
    if (!isCrossCuttingArchetypeId(id)) {
      issues.push({
        code: "ARCHETYPE_UNKNOWN_CROSS_CUTTING",
        severity: "error",
        message: `Unknown cross-cutting archetype ${id}.`,
        path: ["compatibleCrossCutting"]
      });
    }
  }

  if (compareSideEffectLevel(manifest.defaultGovernance.sideEffectPolicy.maxAutoSideEffect, "write") >= 0) {
    issues.push({
      code: "ARCHETYPE_SIDE_EFFECT_POLICY_UNSAFE",
      severity: "error",
      message: "Default governance must not allow automatic write-or-higher side effects.",
      path: ["defaultGovernance", "sideEffectPolicy", "maxAutoSideEffect"]
    });
  }

  if (manifest.defaultGovernance.failurePolicy !== "fail_closed_to_handoff") {
    issues.push({
      code: "ARCHETYPE_COMPOSITION_INVALID",
      severity: "warning",
      message: "Public builtin archetypes should prefer fail_closed_to_handoff as default failure policy.",
      path: ["defaultGovernance", "failurePolicy"]
    });
  }

  return makeResult(issues);
}

export function validateArchetypeRegistry(manifests: ArchetypeManifest[]): ArchetypeValidationResult {
  const issues: ArchetypeIssue[] = [];
  const seen = new Set<string>();

  for (const manifest of manifests) {
    if (seen.has(manifest.archetypeId)) {
      issues.push({
        code: "ARCHETYPE_DUPLICATE_ID",
        severity: "error",
        message: `Duplicate archetype id ${manifest.archetypeId}.`,
        path: [manifest.archetypeId]
      });
    }
    seen.add(manifest.archetypeId);
    issues.push(...validateArchetypeManifest(manifest).issues);
  }

  return makeResult(issues);
}
