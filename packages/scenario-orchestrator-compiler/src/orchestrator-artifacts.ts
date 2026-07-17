import {
  SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES,
  type ScenarioOrchestratorDocument
} from "@yutra/scenario-orchestrator-core";
import {
  artifactHash,
  canonicalJson,
  canonicalYaml,
  createPreviewBundleHash
} from "./orchestrator-hash";
import type {
  ScenarioOrchestratorArtifacts,
  ScenarioOrchestratorCompileReport
} from "./types";

type ArtifactBuild = {
  artifacts: ScenarioOrchestratorArtifacts;
  artifactHashes: Record<keyof ScenarioOrchestratorArtifacts, string>;
  previewBundleHash: string;
  report: ScenarioOrchestratorCompileReport;
};

export function createScenarioOrchestratorArtifacts(input: {
  document: ScenarioOrchestratorDocument;
  compilerVersion: string;
}): ArtifactBuild {
  const { document, compilerVersion } = input;
  const withoutReport = {
    "scenario.orchestrator.yaml": canonicalYaml(
      document as unknown as Record<string, unknown>
    ),
    "orchestrator.routes.json": canonicalJson({
      schemaVersion: "1.0.0",
      compositionId: document.compositionRef.compositionId,
      orchestratorId: document.orchestratorId,
      routes: document.routes
    }),
    "orchestrator.context-policy.json": canonicalJson({
      schemaVersion: "1.0.0",
      compositionId: document.compositionRef.compositionId,
      orchestratorId: document.orchestratorId,
      contextPolicy: document.contextPolicy,
      executionPolicy: document.executionPolicy,
      failurePolicy: document.failurePolicy,
      handoffPolicy: document.handoffPolicy
    }),
    "orchestrator.trace-contract.json": canonicalJson({
      schemaVersion: "1.0.0-preview",
      compositionId: document.compositionRef.compositionId,
      orchestratorId: document.orchestratorId,
      mandatoryEventTypes: [...SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES],
      commonEventFields: [
        "eventType",
        "orchestratorId",
        "compositionId",
        "runId",
        "sequence",
        "activeSlotId",
        "planHash",
        "bundleHash",
        "orchestratorHash",
        "timestamp"
      ],
      contextSnapshotRedactionRequired: true,
      secretRedactionRequired: true,
      planHash: document.compositionRef.planHash,
      bundleHash: document.compositionRef.bundleHash,
      orchestratorHash: document.provenance.orchestratorHash,
      eventsEmittedInPreview: false
    }),
    "orchestrator.provenance.json": canonicalJson({
      schemaVersion: "1.0.0",
      composition: {
        compositionId: document.compositionRef.compositionId,
        compositionVersion: document.compositionRef.compositionVersion,
        patternId: document.compositionRef.patternId,
        planHash: document.compositionRef.planHash,
        bundleHash: document.compositionRef.bundleHash
      },
      provenance: document.provenance,
      slotArtifactReferences: document.slots.map((slot) => ({
        slotId: slot.slotId,
        artifactPath: slot.artifactRef.agentArtifactPath,
        configHash: slot.artifactRef.configHash,
        agentArtifactHash: slot.artifactRef.agentArtifactHash
      })),
      routeSources: document.provenance.routeSources,
      bindingSources: document.provenance.bindingSources,
      overlaySources: document.provenance.overlaySources
    })
  };
  const hashesWithoutReport = Object.fromEntries(
    Object.entries(withoutReport).map(([filename, content]) => [
      filename,
      artifactHash(content)
    ])
  );
  const previewBundleHash = createPreviewBundleHash({
    compositionBundleHash: document.compositionRef.bundleHash,
    orchestratorHash: document.provenance.orchestratorHash,
    artifactHashesWithoutReport: hashesWithoutReport
  });
  const report: ScenarioOrchestratorCompileReport = {
    success: true,
    mode: "preview",
    compilerVersion,
    compositionId: document.compositionRef.compositionId,
    orchestratorId: document.orchestratorId,
    slotCount: document.slots.length,
    routeCount: document.routes.length,
    bindingCount: document.bindings.length,
    overlayCount: document.overlayRefs.length,
    planHash: document.compositionRef.planHash,
    compositionBundleHash: document.compositionRef.bundleHash,
    orchestratorHash: document.provenance.orchestratorHash,
    previewBundleHash,
    warnings: [],
    blockers: [],
    previewOnly: true,
    runtimeExecutable: false,
    currentRuntimeSupported: false,
    noAgentDslGenerated: true,
    noRuntimeExecution: true,
    publicBoundary: structuredClone(document.publicExposure)
  };
  const reportContent = canonicalJson(report);
  const artifacts = {
    ...withoutReport,
    "orchestrator-report.json": reportContent
  };
  const artifactHashes = {
    ...hashesWithoutReport,
    "orchestrator-report.json": artifactHash(reportContent)
  } as Record<keyof ScenarioOrchestratorArtifacts, string>;

  return {
    artifacts,
    artifactHashes,
    previewBundleHash,
    report
  };
}
