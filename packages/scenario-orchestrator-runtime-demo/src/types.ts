import type {
  ActionRegistry,
  ExecuteRunArgs,
  RuntimeResult
} from "@yutra/runtime";
import type {
  OrchestratorRuntimeCompatibilityReport,
  ScenarioOrchestratorRuntimeAdapter,
  ScenarioSideEffectLevel,
  ScenarioSlotInvocationResult,
  ScenarioSlotInvocationStatus
} from "@yutra/scenario-orchestrator-runtime-contract";

export type InMemorySlotArtifactRecord = {
  artifactPath: string;
  artifactContent: string;
  artifactHash: string;
  configHash: string;
  archetypeId: string;
  agentDslVersion: string;
};

export type StoredSlotArtifactRecord = Readonly<InMemorySlotArtifactRecord>;

export type ExistingRuntimeFactory = (
  args: ExecuteRunArgs
) => Promise<RuntimeResult>;

export type InMemoryScenarioRuntimeAdapterOptions = {
  artifactStore: {
    get(path: string): StoredSlotArtifactRecord | undefined;
  };
  actionRegistry: ActionRegistry;
  resolveSideEffectLevel: (
    actionId: string
  ) => ScenarioSideEffectLevel | undefined;
  runtimeFactory?: ExistingRuntimeFactory;
  now?: () => number;
};

export type SlotSideEffectCoverageReport = {
  referencedActionIds: string[];
  classifiedActionIds: string[];
  unclassifiedActionIds: string[];
  potentialMaximumLevel: ScenarioSideEffectLevel;
  complete: boolean;
};

export type SlotSideEffectCoverage = SlotSideEffectCoverageReport & {
  actionLevels: Readonly<Record<string, ScenarioSideEffectLevel>>;
};

export type SlotDispatchSummary = {
  highestExecutedLevel: ScenarioSideEffectLevel;
  effectCount: number;
  externalEffectsOccurred: boolean;
  invocationCounts: Readonly<Record<string, number>>;
};

export type SlotTraceParentBindingRecord = {
  invocationId: string;
  runtimeRunId: string;
  orchestratorRunId: string;
  orchestratorId: string;
  compositionId: string;
  slotId: string;
  parentSpanId: string;
  invocationIndex: number;
  agentArtifactHash: string;
  configHash: string;
};

export type DemoAdapterAuditRecord = {
  invocationId: string;
  runtimeRunId: string;
  slotId: string;
  artifactHash: string;
  configHash: string;
  status: ScenarioSlotInvocationStatus;
  redacted: true;
  sideEffectSummary: ScenarioSlotInvocationResult["sideEffectSummary"];
  traceReference: ScenarioSlotInvocationResult["traceReference"];
};

export type InMemoryInvocationLedgerRecord = {
  idempotencyKey: string;
  requestFingerprint: string;
  status: "running" | "completed" | "failed";
  result?: ScenarioSlotInvocationResult;
  runtimeInvocationCount: number;
};

export type InMemoryScenarioRuntimeAdapter =
  ScenarioOrchestratorRuntimeAdapter & {
    readonly artifactStore: InMemoryScenarioRuntimeAdapterOptions["artifactStore"];
    readonly invocationLedger: {
      get(key: string): InMemoryInvocationLedgerRecord | undefined;
      list(): InMemoryInvocationLedgerRecord[];
    };
    readonly traceParentLedger: {
      get(invocationId: string): SlotTraceParentBindingRecord | undefined;
      list(): SlotTraceParentBindingRecord[];
    };
    readonly auditLedger: {
      get(invocationId: string): DemoAdapterAuditRecord | undefined;
      list(): DemoAdapterAuditRecord[];
    };
    inspectCompatibility(
      input: Parameters<ScenarioOrchestratorRuntimeAdapter["inspectCompatibility"]>[0]
    ): OrchestratorRuntimeCompatibilityReport;
  };
