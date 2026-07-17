import { CROSS_CUTTING_ARCHETYPE_IDS } from "@yutra/archetype-core";
import {
  resolveCompositionReadiness,
  validateScenarioComposition,
  type CompositionSupportContext,
  type ScenarioCompositionDraft,
  type ScenarioCompositionPlan
} from "@yutra/scenario-composition-core";
import { addCompositionReport, createCompositionPreviewArtifacts } from "./composition-artifacts";
import { createCompositionBundleHash, createCompositionPlanHash } from "./composition-hash";
import type { ScenarioCompositionCompileIssue } from "./errors";
import { compileCompositionSlot } from "./slot-compiler";
import type {
  CompiledCompositionSlot,
  ScenarioCompositionCompileInput,
  ScenarioCompositionCompileOptions,
  ScenarioCompositionCompileOutput,
  ScenarioCompositionCompileReport
} from "./types";

export const compositionCompilerVersion = "0.1.0";

const DEFAULT_SUPPORT_CONTEXT: CompositionSupportContext = {
  compilerEnabledArchetypeIds: ["request-resolution", "approval-decision", "knowledge-answering"],
  workbenchEnabledArchetypeIds: ["request-resolution", "approval-decision", "knowledge-answering"],
  availableCrossCuttingArchetypeIds: [...CROSS_CUTTING_ARCHETYPE_IDS],
  compositionCompilerAvailable: true
};

function compositionIdOf(input: unknown): string | undefined {
  if (!input || typeof input !== "object") return undefined;
  const value = (input as { compositionId?: unknown }).compositionId;
  return typeof value === "string" ? value : undefined;
}

function failure(
  code: ScenarioCompositionCompileIssue["code"],
  message: string,
  input: unknown,
  path?: string[]
): ScenarioCompositionCompileOutput {
  return {
    ok: false,
    issues: [
      {
        code,
        severity: "error",
        message,
        compositionId: compositionIdOf(input),
        path
      }
    ]
  };
}

function isDraft(input: unknown): input is ScenarioCompositionDraft {
  return Boolean(
    input &&
      typeof input === "object" &&
      (input as { eligibleForCompilerInput?: unknown }).eligibleForCompilerInput === false
  );
}

function hasSafeNamespaceSegment(slotId: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(slotId);
}

function orderedSlots(plan: ScenarioCompositionPlan) {
  const primary = plan.slots.filter((slot) => slot.role === "primary");
  const supporting = plan.slots.filter((slot) => slot.role === "supporting");
  return [...primary, ...supporting];
}

export function compileScenarioCompositionPreview(
  input: ScenarioCompositionCompileInput,
  options: ScenarioCompositionCompileOptions = {}
): ScenarioCompositionCompileOutput {
  if (isDraft(input)) {
    return failure(
      "COMPOSITION_NOT_COMPILE_READY",
      `Composition ${input.compositionId} is contract-only and is not eligible for compiler input.`,
      input
    );
  }

  if (
    input &&
    typeof input === "object" &&
    (input as { executionModel?: unknown }).executionModel !== "orchestrated_subflows"
  ) {
    return failure(
      "COMPOSITION_EXECUTION_MODEL_UNSUPPORTED",
      "Only executionModel=orchestrated_subflows can be compiled.",
      input,
      ["executionModel"]
    );
  }

  if (input && typeof input === "object" && Array.isArray((input as { slots?: unknown }).slots)) {
    const slotIds = ((input as { slots: Array<{ slotId?: unknown }> }).slots)
      .map((slot) => slot.slotId)
      .filter((slotId): slotId is string => typeof slotId === "string");
    if (new Set(slotIds).size !== slotIds.length) {
      return failure(
        "COMPOSITION_SLOT_NAMESPACE_COLLISION",
        `Composition ${compositionIdOf(input) ?? "unknown"} contains duplicate Slot namespaces.`,
        input,
        ["slots"]
      );
    }
  }

  const validation = validateScenarioComposition(input);
  if (!validation.ok) {
    return failure(
      "COMPOSITION_COMPILE_INPUT_INVALID",
      `Composition input failed contract validation: ${validation.issues.map((issue) => issue.code).join(", ")}.`,
      input
    );
  }

  const plan = input as ScenarioCompositionPlan;
  const unsafeSlot = plan.slots.find((slot) => !hasSafeNamespaceSegment(slot.slotId));
  if (unsafeSlot) {
    return failure(
      "COMPOSITION_OUTPUT_PATH_UNSAFE",
      `Slot ${unsafeSlot.slotId} cannot be represented as a safe output namespace.`,
      plan,
      ["slots", unsafeSlot.slotId]
    );
  }

  const supportContext: CompositionSupportContext = {
    ...DEFAULT_SUPPORT_CONTEXT,
    ...options.supportContext
  };
  const readiness = resolveCompositionReadiness(plan, supportContext);
  if (readiness.status !== "compile_ready") {
    return failure(
      "COMPOSITION_NOT_COMPILE_READY",
      `Composition ${plan.compositionId} is ${readiness.status}: ${readiness.blockers.join(", ") || "readiness incomplete"}.`,
      plan
    );
  }
  if (!readiness.compositionCompilerAvailable) {
    return failure(
      "COMPOSITION_COMPILER_NOT_AVAILABLE",
      `Composition Compiler is not available for ${plan.compositionId}.`,
      plan
    );
  }

  const compiledSlots: CompiledCompositionSlot[] = [];
  for (const slot of orderedSlots(plan)) {
    const compiled = compileCompositionSlot(plan.compositionId, slot, options.slotCompiler);
    if (!compiled.ok) {
      return {
        ok: false,
        issues: [
          ...compiled.issues,
          {
            code: "COMPOSITION_PARTIAL_RESULT_NOT_ALLOWED",
            severity: "error",
            message: `Composition ${plan.compositionId} failed closed; no partial Bundle is returned.`,
            compositionId: plan.compositionId,
            slotId: slot.slotId
          }
        ]
      };
    }
    compiledSlots.push(compiled.slot);
  }

  try {
    const planHash = createCompositionPlanHash(plan);
    const artifactBuild = createCompositionPreviewArtifacts(plan, compiledSlots, planHash, compositionCompilerVersion);
    const bundleHash = createCompositionBundleHash({
      planHash,
      slotArtifactHashes: compiledSlots.map((slot) => ({
        slotId: slot.slotId,
        artifactHashes: slot.artifactHashes
      })),
      compositionArtifactHashes: artifactBuild.hashesWithoutReport
    });
    const compileReport: ScenarioCompositionCompileReport = {
      success: true,
      mode: "preview",
      compositionId: plan.compositionId,
      compositionVersion: plan.version,
      patternId: plan.patternRef.patternId,
      planHash,
      bundleHash,
      slotCount: compiledSlots.length,
      slotCompileSummaries: compiledSlots.map((slot) => ({
        slotId: slot.slotId,
        role: slot.role,
        archetypeId: slot.archetypeId,
        packConfigId: slot.packConfigId,
        configHash: slot.configHash,
        artifactHashes: slot.artifactHashes
      })),
      compositionArtifactHashes: artifactBuild.hashesWithoutReport,
      warnings: [],
      blockers: [],
      previewOnly: true,
      runtimeExecutable: false,
      publicBoundary: {
        mode: "demo_only",
        mockAdaptersOnly: true,
        containsRealEndpoint: false,
        containsSecret: false
      }
    };
    const compositionArtifacts = addCompositionReport(artifactBuild, compileReport);

    return {
      ok: true,
      issues: [],
      result: {
        schemaVersion: "1.0.0",
        mode: "preview",
        compositionId: plan.compositionId,
        compositionVersion: plan.version,
        patternId: plan.patternRef.patternId,
        executionModel: plan.executionModel,
        previewOnly: true,
        runtimeExecutable: false,
        compositionCompilerVersion,
        planHash,
        bundleHash,
        slots: compiledSlots,
        compositionArtifacts,
        compileReport
      }
    };
  } catch {
    return failure(
      "COMPOSITION_ARTIFACT_HASH_FAILED",
      `Failed to create deterministic composition artifact hashes for ${plan.compositionId}.`,
      plan
    );
  }
}
