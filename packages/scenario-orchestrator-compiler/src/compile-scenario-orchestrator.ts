import {
  SLOT_ARTIFACT_FILENAMES,
  compileScenarioCompositionPreview,
  type ScenarioCompositionCompileResult
} from "@yutra/scenario-composition-compiler";
import type { ScenarioCompositionPlan } from "@yutra/scenario-composition-core";
import {
  validateScenarioOrchestrator
} from "@yutra/scenario-orchestrator-core";
import {
  getBuiltinScenarioOrchestratorCompileProfile
} from "./builtin-compile-profiles";
import {
  bindScenarioOrchestratorDocument,
  toOrchestratorBundleReference
} from "./bind-composition-bundle";
import { validateScenarioOrchestratorCompileProfile } from "./compile-profile";
import type { ScenarioOrchestratorCompileIssue } from "./errors";
import {
  artifactHash,
  canonicalJson,
  createOrchestratorHash
} from "./orchestrator-hash";
import { createScenarioOrchestratorArtifacts } from "./orchestrator-artifacts";
import type {
  ScenarioOrchestratorCompileInput,
  ScenarioOrchestratorCompileOutput
} from "./types";

export const scenarioOrchestratorCompilerVersion = "0.1.0";
const EMPTY_HASH = `sha256:${"0".repeat(64)}`;

function compositionIdOf(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const compositionId = (value as { compositionId?: unknown }).compositionId;
  return typeof compositionId === "string" ? compositionId : undefined;
}

function failure(
  code: ScenarioOrchestratorCompileIssue["code"],
  message: string,
  compositionId?: string,
  extra: Pick<ScenarioOrchestratorCompileIssue, "routeId" | "slotId"> = {}
): ScenarioOrchestratorCompileOutput {
  return {
    ok: false,
    issues: [
      {
        code,
        severity: "error",
        message,
        compositionId,
        ...extra
      },
      {
        code: "ORCHESTRATOR_PARTIAL_RESULT_NOT_ALLOWED",
        severity: "error",
        message:
          "Orchestrator compilation failed closed; no partial Preview Bundle is returned.",
        compositionId
      }
    ]
  };
}

function compositionResultsMatch(
  supplied: ScenarioCompositionCompileResult,
  canonical: ScenarioCompositionCompileResult
): boolean {
  return canonicalJson(supplied) === canonicalJson(canonical);
}

export function compileScenarioOrchestratorPreview(
  input: ScenarioOrchestratorCompileInput
): ScenarioOrchestratorCompileOutput {
  if (!input || typeof input !== "object" || !("compositionPlan" in input)) {
    return failure(
      "ORCHESTRATOR_COMPILE_INPUT_INVALID",
      "compositionPlan is required."
    );
  }

  const compositionId = compositionIdOf(input.compositionPlan);
  const compositionOutput = compileScenarioCompositionPreview(
    input.compositionPlan
  );
  if (!compositionOutput.ok) {
    return failure(
      "ORCHESTRATOR_COMPOSITION_NOT_READY",
      `Composition is not ready for Orchestrator Preview: ${compositionOutput.issues
        .map((issue) => issue.code)
        .join(", ")}.`,
      compositionId
    );
  }
  const plan = input.compositionPlan as ScenarioCompositionPlan;
  const canonicalCompositionResult = compositionOutput.result;
  if (input.compositionResult) {
    for (const slot of input.compositionResult.slots) {
      for (const filename of SLOT_ARTIFACT_FILENAMES) {
        const content = slot.artifacts[filename];
        const hash = slot.artifactHashes[filename];
        if (typeof content !== "string" || !hash) {
          return failure(
            "ORCHESTRATOR_SLOT_ARTIFACT_MISSING",
            `Slot ${slot.slotId} is missing canonical artifact ${filename}.`,
            plan.compositionId,
            { slotId: slot.slotId }
          );
        }
        if (artifactHash(content) !== hash) {
          return failure(
            "ORCHESTRATOR_SLOT_ARTIFACT_HASH_MISMATCH",
            `Slot ${slot.slotId} artifact hash does not match ${filename}.`,
            plan.compositionId,
            { slotId: slot.slotId }
          );
        }
      }
    }
  }
  if (
    input.compositionResult &&
    !compositionResultsMatch(
      input.compositionResult,
      canonicalCompositionResult
    )
  ) {
    return failure(
      "ORCHESTRATOR_COMPOSITION_RESULT_MISMATCH",
      "Supplied Composition Preview Result does not match a fresh canonical compilation of the Plan.",
      plan.compositionId
    );
  }

  const profile =
    input.compileProfile ??
    getBuiltinScenarioOrchestratorCompileProfile(plan.compositionId);
  if (!profile) {
    return failure(
      "ORCHESTRATOR_COMPILE_PROFILE_NOT_FOUND",
      `No explicit Orchestrator Compile Profile exists for ${plan.compositionId}.`,
      plan.compositionId
    );
  }
  const profileIssues = validateScenarioOrchestratorCompileProfile(
    profile,
    plan
  );
  if (profileIssues.length > 0) {
    return {
      ok: false,
      issues: [
        ...profileIssues,
        {
          code: "ORCHESTRATOR_PARTIAL_RESULT_NOT_ALLOWED",
          severity: "error",
          message:
            "Orchestrator compilation failed closed; no partial Preview Bundle is returned.",
          compositionId: plan.compositionId
        }
      ]
    };
  }

  try {
    const document = bindScenarioOrchestratorDocument({
      plan,
      result: canonicalCompositionResult,
      profile,
      orchestratorHash: EMPTY_HASH
    });
    document.provenance.orchestratorHash =
      createOrchestratorHash(document);
    const bundleReference = toOrchestratorBundleReference(
      canonicalCompositionResult
    );
    const validation = validateScenarioOrchestrator(document, {
      compositionPlan: plan,
      compositionBundle: bundleReference
    });
    if (!validation.ok) {
      return failure(
        "ORCHESTRATOR_DOCUMENT_INVALID",
        `Generated Orchestrator Document failed validation: ${validation.issues
          .map((issue) => issue.code)
          .join(", ")}.`,
        plan.compositionId
      );
    }

    const artifactBuild = createScenarioOrchestratorArtifacts({
      document,
      compilerVersion: scenarioOrchestratorCompilerVersion
    });
    if (
      createOrchestratorHash(document) !==
      document.provenance.orchestratorHash
    ) {
      return failure(
        "ORCHESTRATOR_HASH_FAILED",
        "Orchestrator hash closure validation failed.",
        plan.compositionId
      );
    }

    return {
      ok: true,
      issues: [],
      result: {
        schemaVersion: "1.0.0",
        mode: "preview",
        compositionId: plan.compositionId,
        compositionVersion: plan.version,
        patternId: plan.patternRef.patternId,
        orchestratorId: document.orchestratorId,
        orchestratorVersion: document.version,
        previewOnly: true,
        runtimeExecutable: false,
        currentRuntimeSupported: false,
        compilerVersion: scenarioOrchestratorCompilerVersion,
        planHash: canonicalCompositionResult.planHash,
        compositionBundleHash:
          canonicalCompositionResult.bundleHash,
        orchestratorHash: document.provenance.orchestratorHash,
        previewBundleHash: artifactBuild.previewBundleHash,
        compositionResult: canonicalCompositionResult,
        orchestratorDocument: document,
        orchestratorArtifacts: artifactBuild.artifacts,
        artifactHashes: artifactBuild.artifactHashes,
        compileReport: artifactBuild.report
      }
    };
  } catch {
    return failure(
      "ORCHESTRATOR_HASH_FAILED",
      `Failed to construct deterministic Orchestrator artifacts for ${plan.compositionId}.`,
      plan.compositionId
    );
  }
}
