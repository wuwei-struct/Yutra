import type {
  CompositionSlotRole,
  CompositionSupportContext,
  ScenarioCompositionPlan
} from "@yutra/scenario-composition-core";
import type { RuleCompilerInput, RuleCompilerOutput } from "@yutra/rule-compiler";
import type { ScenarioCompositionCompileIssue } from "./errors";

export type CompositionCompileMode = "preview";

export const SLOT_ARTIFACT_FILENAMES = [
  "agent.yutra.yaml",
  "policy.yaml",
  "adapter.config.json",
  "templates.json",
  "test-cases.json",
  "trace.expectation.json"
] as const;

export type SlotArtifactFilename = (typeof SLOT_ARTIFACT_FILENAMES)[number];
export type CompiledSlotArtifacts = Record<SlotArtifactFilename, string>;

export const COMPOSITION_ARTIFACT_FILENAMES = [
  "composition.manifest.json",
  "composition.routes.json",
  "composition.bindings.json",
  "composition.overlays.json",
  "composition.precedence.json",
  "composition.slot-index.json",
  "composition-report.json"
] as const;

export type CompositionArtifactFilename = (typeof COMPOSITION_ARTIFACT_FILENAMES)[number];
export type CompositionArtifacts = Record<CompositionArtifactFilename, string>;

export type CompiledCompositionSlot = {
  slotId: string;
  role: CompositionSlotRole;
  archetypeId: string;
  packConfigId: string;
  namespace: string;
  configHash: string;
  artifactHashes: Record<SlotArtifactFilename, string>;
  artifacts: CompiledSlotArtifacts;
};

export type ScenarioCompositionCompileReport = {
  success: true;
  mode: "preview";
  compositionId: string;
  compositionVersion: string;
  patternId: string;
  planHash: string;
  bundleHash: string;
  slotCount: number;
  slotCompileSummaries: Array<{
    slotId: string;
    role: CompositionSlotRole;
    archetypeId: string;
    packConfigId: string;
    configHash: string;
    artifactHashes: Record<SlotArtifactFilename, string>;
  }>;
  compositionArtifactHashes: Record<string, string>;
  warnings: ScenarioCompositionCompileIssue[];
  blockers: string[];
  previewOnly: true;
  runtimeExecutable: false;
  publicBoundary: {
    mode: "demo_only";
    mockAdaptersOnly: true;
    containsRealEndpoint: false;
    containsSecret: false;
  };
};

export type ScenarioCompositionCompileResult = {
  schemaVersion: "1.0.0";
  mode: "preview";
  compositionId: string;
  compositionVersion: string;
  patternId: string;
  executionModel: "orchestrated_subflows";
  previewOnly: true;
  runtimeExecutable: false;
  compositionCompilerVersion: string;
  planHash: string;
  bundleHash: string;
  slots: CompiledCompositionSlot[];
  compositionArtifacts: CompositionArtifacts;
  compileReport: ScenarioCompositionCompileReport;
};

export type ScenarioSlotCompiler = (input: RuleCompilerInput) => RuleCompilerOutput;

export type ScenarioCompositionCompileOptions = {
  supportContext?: CompositionSupportContext;
  slotCompiler?: ScenarioSlotCompiler;
};

export type ScenarioCompositionCompileOutput =
  | {
      ok: true;
      result: ScenarioCompositionCompileResult;
      issues: ScenarioCompositionCompileIssue[];
    }
  | {
      ok: false;
      result?: never;
      issues: ScenarioCompositionCompileIssue[];
    };

export type ScenarioCompositionCompileInput = ScenarioCompositionPlan | unknown;
