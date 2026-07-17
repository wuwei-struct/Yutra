import type { CompositionSlot } from "@yutra/scenario-composition-core";
import { compilePackConfig, type RuleCompilerOutput } from "@yutra/rule-compiler";
import type { ScenarioCompositionCompileIssue } from "./errors";
import {
  SLOT_ARTIFACT_FILENAMES,
  type CompiledCompositionSlot,
  type CompiledSlotArtifacts,
  type ScenarioSlotCompiler,
  type SlotArtifactFilename
} from "./types";

type SlotCompileResult =
  | { ok: true; slot: CompiledCompositionSlot }
  | { ok: false; issues: ScenarioCompositionCompileIssue[] };

function artifactEntries(output: RuleCompilerOutput): Array<[SlotArtifactFilename, string, string]> {
  if (!output.artifacts) return [];
  const artifacts = output.artifacts as Partial<typeof output.artifacts>;
  return [
    artifacts.agent,
    artifacts.policy,
    artifacts.adapterConfig,
    artifacts.templates,
    artifacts.testCases,
    artifacts.traceExpectation
  ]
    .filter((artifact) => artifact !== undefined)
    .map((artifact) => [
      artifact.filename as SlotArtifactFilename,
      artifact.content,
      artifact.hash
    ]);
}

export function compileCompositionSlot(
  compositionId: string,
  slot: CompositionSlot,
  compiler: ScenarioSlotCompiler = compilePackConfig
): SlotCompileResult {
  const output = compiler({ config: slot.packConfig, mode: "preview", locale: slot.packConfig.locale ?? "en" });
  if (!output.ok || !output.artifacts) {
    return {
      ok: false,
      issues: [
        {
          code: "COMPOSITION_SLOT_COMPILE_FAILED",
          severity: "error",
          message: `Slot ${slot.slotId} failed Rule Compiler preview.`,
          compositionId,
          slotId: slot.slotId,
          path: ["slots", slot.slotId]
        }
      ]
    };
  }

  const entries = artifactEntries(output);
  const byFilename = new Map(entries.map(([filename, content, hash]) => [filename, { content, hash }]));
  const missing = SLOT_ARTIFACT_FILENAMES.filter((filename) => !byFilename.has(filename));
  if (missing.length > 0 || entries.length !== SLOT_ARTIFACT_FILENAMES.length) {
    return {
      ok: false,
      issues: missing.map((filename) => ({
        code: "COMPOSITION_SLOT_ARTIFACT_MISSING",
        severity: "error",
        message: `Slot ${slot.slotId} is missing canonical artifact ${filename}.`,
        compositionId,
        slotId: slot.slotId,
        path: ["slots", slot.slotId, "artifacts", filename]
      }))
    };
  }

  const artifacts = Object.fromEntries(
    SLOT_ARTIFACT_FILENAMES.map((filename) => [filename, byFilename.get(filename)!.content])
  ) as CompiledSlotArtifacts;
  const artifactHashes = Object.fromEntries(
    SLOT_ARTIFACT_FILENAMES.map((filename) => [filename, byFilename.get(filename)!.hash])
  ) as Record<SlotArtifactFilename, string>;

  return {
    ok: true,
    slot: {
      slotId: slot.slotId,
      role: slot.role,
      archetypeId: slot.archetypeId,
      packConfigId: slot.packConfigId,
      namespace: `slots/${slot.slotId}`,
      configHash: output.report.packConfigHash,
      artifactHashes,
      artifacts
    }
  };
}
