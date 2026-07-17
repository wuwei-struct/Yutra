import type { ScenarioCompositionCompileResult } from "@yutra/scenario-composition-compiler";
import type { ScenarioCompositionPlan } from "@yutra/scenario-composition-core";
import type {
  ScenarioOrchestratorDocument,
  ScenarioRouteEffect,
  ScenarioTerminalDefinition
} from "@yutra/scenario-orchestrator-core";
import type { ScenarioOrchestratorCompileIssue } from "./errors";

export type ScenarioOrchestratorCompileProfile = {
  profileId: string;
  compositionId: string;
  version: string;
  slotProfiles: Array<{
    slotId: string;
    acceptedOutcomes: string[];
    callableBySlotIds: string[];
  }>;
  routeProfiles: Array<{
    compositionRouteId: string;
    outcome: string;
    priority: number;
    effect: ScenarioRouteEffect;
  }>;
  terminalProfiles: [
    ScenarioTerminalDefinition,
    ScenarioTerminalDefinition,
    ScenarioTerminalDefinition
  ];
  publicExposure: {
    mode: "demo_only";
    containsCustomerData: false;
    containsRealEndpoint: false;
    containsSecret: false;
    containsCustomerSop: false;
    containsCommercialDeliveryAsset: false;
  };
};

export const ORCHESTRATOR_ARTIFACT_FILENAMES = [
  "scenario.orchestrator.yaml",
  "orchestrator.routes.json",
  "orchestrator.context-policy.json",
  "orchestrator.trace-contract.json",
  "orchestrator.provenance.json",
  "orchestrator-report.json"
] as const;

export type OrchestratorArtifactFilename =
  (typeof ORCHESTRATOR_ARTIFACT_FILENAMES)[number];
export type ScenarioOrchestratorArtifacts = Record<
  OrchestratorArtifactFilename,
  string
>;

export type ScenarioOrchestratorCompileReport = {
  success: true;
  mode: "preview";
  compilerVersion: string;
  compositionId: string;
  orchestratorId: string;
  slotCount: number;
  routeCount: number;
  bindingCount: number;
  overlayCount: number;
  planHash: string;
  compositionBundleHash: string;
  orchestratorHash: string;
  previewBundleHash: string;
  warnings: ScenarioOrchestratorCompileIssue[];
  blockers: string[];
  previewOnly: true;
  runtimeExecutable: false;
  currentRuntimeSupported: false;
  noAgentDslGenerated: true;
  noRuntimeExecution: true;
  publicBoundary: {
    mode: "demo_only";
    containsCustomerData: false;
    containsRealEndpoint: false;
    containsSecret: false;
    containsCustomerSop: false;
    containsCommercialDeliveryAsset: false;
  };
};

export type ScenarioOrchestratorCompileResult = {
  schemaVersion: "1.0.0";
  mode: "preview";
  compositionId: string;
  compositionVersion: string;
  patternId: string;
  orchestratorId: string;
  orchestratorVersion: string;
  previewOnly: true;
  runtimeExecutable: false;
  currentRuntimeSupported: false;
  compilerVersion: string;
  planHash: string;
  compositionBundleHash: string;
  orchestratorHash: string;
  previewBundleHash: string;
  compositionResult: ScenarioCompositionCompileResult;
  orchestratorDocument: ScenarioOrchestratorDocument;
  orchestratorArtifacts: ScenarioOrchestratorArtifacts;
  artifactHashes: Record<OrchestratorArtifactFilename, string>;
  compileReport: ScenarioOrchestratorCompileReport;
};

export type ScenarioOrchestratorCompileInput = {
  compositionPlan: ScenarioCompositionPlan | unknown;
  compositionResult?: ScenarioCompositionCompileResult;
  compileProfile?: ScenarioOrchestratorCompileProfile;
};

export type ScenarioOrchestratorCompileOutput =
  | {
      ok: true;
      result: ScenarioOrchestratorCompileResult;
      issues: ScenarioOrchestratorCompileIssue[];
    }
  | {
      ok: false;
      result?: never;
      issues: ScenarioOrchestratorCompileIssue[];
    };
