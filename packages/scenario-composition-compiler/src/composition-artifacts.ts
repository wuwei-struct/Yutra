import type { ScenarioCompositionPlan } from "@yutra/scenario-composition-core";
import { stableJson } from "@yutra/rule-compiler";
import { createCompositionArtifactHash } from "./composition-hash";
import type {
  CompiledCompositionSlot,
  CompositionArtifacts,
  ScenarioCompositionCompileReport
} from "./types";

export type CompositionArtifactBuild = {
  contentsWithoutReport: Omit<CompositionArtifacts, "composition-report.json">;
  hashesWithoutReport: Record<string, string>;
};

export function createCompositionPreviewArtifacts(
  plan: ScenarioCompositionPlan,
  slots: CompiledCompositionSlot[],
  planHash: string,
  compilerVersion: string
): CompositionArtifactBuild {
  const contentsWithoutReport = {
    "composition.manifest.json": stableJson({
      schemaVersion: "1.0.0",
      compositionId: plan.compositionId,
      version: plan.version,
      patternRef: plan.patternRef,
      executionModel: plan.executionModel,
      primarySlotId: plan.primarySlotId,
      slots: slots.map((slot) => ({
        slotId: slot.slotId,
        role: slot.role,
        archetypeId: slot.archetypeId,
        packConfigId: slot.packConfigId,
        namespace: slot.namespace
      })),
      previewOnly: true,
      runtimeExecutable: false,
      publicExposure: plan.publicExposure,
      planHash,
      compilerVersion
    }),
    "composition.routes.json": stableJson({
      schemaVersion: "1.0.0",
      compositionId: plan.compositionId,
      routes: plan.routes
    }),
    "composition.bindings.json": stableJson({
      schemaVersion: "1.0.0",
      compositionId: plan.compositionId,
      transformPolicy: "identity_only",
      dataBindings: plan.dataBindings
    }),
    "composition.overlays.json": stableJson({
      schemaVersion: "1.0.0",
      compositionId: plan.compositionId,
      crossCuttingOverlays: plan.crossCuttingOverlays
    }),
    "composition.precedence.json": stableJson({
      schemaVersion: "1.0.0",
      compositionId: plan.compositionId,
      precedencePolicy: plan.precedencePolicy
    }),
    "composition.slot-index.json": stableJson({
      schemaVersion: "1.0.0",
      compositionId: plan.compositionId,
      slots: slots.map((slot) => ({
        slotId: slot.slotId,
        role: slot.role,
        archetypeId: slot.archetypeId,
        packConfigId: slot.packConfigId,
        namespace: slot.namespace,
        configHash: slot.configHash,
        artifactPaths: Object.keys(slot.artifacts).map((filename) => `${slot.namespace}/${filename}`),
        artifactHashes: slot.artifactHashes
      }))
    })
  } satisfies Omit<CompositionArtifacts, "composition-report.json">;

  return {
    contentsWithoutReport,
    hashesWithoutReport: Object.fromEntries(
      Object.entries(contentsWithoutReport).map(([filename, content]) => [filename, createCompositionArtifactHash(content)])
    )
  };
}

export function addCompositionReport(
  artifacts: CompositionArtifactBuild,
  report: ScenarioCompositionCompileReport
): CompositionArtifacts {
  return {
    ...artifacts.contentsWithoutReport,
    "composition-report.json": stableJson(report)
  };
}
