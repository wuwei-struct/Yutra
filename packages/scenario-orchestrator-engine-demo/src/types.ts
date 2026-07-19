import type {
  ScenarioOrchestratorDocument,
  ScenarioOrchestratorRoute
} from "@yutra/scenario-orchestrator-core";
import type { ScenarioOrchestratorCompileResult } from "@yutra/scenario-orchestrator-compiler";
import type {
  RuntimeCompatibilityInput,
  ScenarioOrchestratorRuntimeAdapter,
  ScenarioSideEffectLevel
} from "@yutra/scenario-orchestrator-runtime-contract";
import type { InMemorySlotArtifactStore } from "@yutra/scenario-orchestrator-runtime-demo";

export type ScenarioRunStatus = "completed" | "handoff_required" | "failed";
export type ScenarioTerminalId =
  | "$scenario_done"
  | "$human_handoff"
  | "$fail_closed";

export type ScenarioRunRequest = {
  schemaVersion: "1.0.0-preview";
  orchestratorRunId: string;
  idempotencyKey: string;
  orchestratorId: string;
  compositionId: string;
  previewBundleHash: string;
  input: {
    namespace: "scenario.input";
    value: unknown;
    byteLength: number;
    redactionApplied: true;
  };
  sideEffectPolicy: {
    maximumAllowedLevel: Extract<ScenarioSideEffectLevel, "none" | "read">;
  };
  budget?: {
    maxSlotInvocations?: number;
    maxRouteEvaluations?: number;
    maxBindingApplications?: number;
    timeoutMsPerSlot?: number;
  };
};

export type ScenarioSlotInvocationSummary = {
  invocationIndex: number;
  invocationId: string;
  slotId: string;
  runtimeStatus: string;
  runtimeFinalState?: string;
  semanticOutcome?: string;
  projectionId?: string;
  runtimeRunId?: string;
  traceReference?: unknown;
  auditReference?: unknown;
};

export type ScenarioBudgetUsage = {
  slotInvocations: number;
  routeEvaluations: number;
  bindingApplications: number;
};

export type ScenarioRunResult = {
  schemaVersion: "1.0.0-preview";
  orchestratorRunId: string;
  orchestratorId: string;
  compositionId: string;
  status: ScenarioRunStatus;
  terminalId: ScenarioTerminalId;
  scenarioCompleted: boolean;
  output?: {
    namespace: "scenario.output";
    value: unknown;
    byteLength: number;
    redactionApplied: true;
  };
  error?: {
    code: string;
    safeMessage: string;
    retryable: false;
  };
  slotInvocations: ScenarioSlotInvocationSummary[];
  traceSummary: {
    eventCount: number;
    firstSequence: number;
    lastSequence: number;
    terminalEventType: string;
  };
  auditReference: {
    orchestratorRunId: string;
    status: "available";
    redacted: true;
  };
  budgetUsage: ScenarioBudgetUsage;
};

export type ScenarioRouteConditionContext = {
  scenarioInput: unknown;
  activeSlotId: string;
  semanticOutcome: string;
  slotOutput: unknown;
  callerSlotId?: string;
  invocationIndex: number;
};

export type ExplicitScenarioRouteConditionRegistry = Readonly<
  Record<string, (context: ScenarioRouteConditionContext) => boolean>
>;

export type ScenarioOverlayDecision = "allow" | "deny" | "handoff";
export type ScenarioOverlayEvaluationContext = {
  stage: "scenario_start" | "slot_before" | "route_before" | "terminal_before";
  overlayId: string;
  activeSlotId?: string;
  routeId?: string;
  scenarioInput: unknown;
  adapterId: string;
  adapterMode: "demo_only" | "contract_only";
  auditAvailable?: boolean;
};
export type ExplicitScenarioOverlayEvaluatorRegistry = Readonly<
  Record<
    string,
    (context: ScenarioOverlayEvaluationContext) => ScenarioOverlayDecision
  >
>;

export type ExplicitScenarioSlotInputRegistry = Readonly<
  Record<
    string,
    (context: {
      scenarioInput: unknown;
      route: ScenarioOrchestratorRoute;
      callerSlotId: string;
      targetSlotId: string;
    }) => unknown
  >
>;

export type EngineCompatibilityBindings = Pick<
  RuntimeCompatibilityInput,
  "agentDslVersionsBySlot" | "actionClosureBySlot"
>;

export type EngineOptions = {
  compileResult: ScenarioOrchestratorCompileResult;
  runtimeAdapter: ScenarioOrchestratorRuntimeAdapter;
  artifactStore: InMemorySlotArtifactStore;
  routeConditions: ExplicitScenarioRouteConditionRegistry;
  overlayEvaluators: ExplicitScenarioOverlayEvaluatorRegistry;
  slotInputResolvers: ExplicitScenarioSlotInputRegistry;
  compatibility: EngineCompatibilityBindings;
  now?: () => number;
  createId?: () => string;
};

export type ScenarioOrchestratorEngine = {
  readonly document: ScenarioOrchestratorDocument;
  runScenario(request: ScenarioRunRequest): Promise<ScenarioRunResult>;
  trace(runId: string): OrchestratorTraceEvent[];
  audit(runId: string): OrchestratorAuditSummary | undefined;
};

export type OrchestratorTraceEvent = {
  sequence: number;
  type: string;
  orchestratorRunId: string;
  orchestratorId: string;
  compositionId: string;
  planHash: string;
  bundleHash: string;
  orchestratorHash: string;
  details: Readonly<Record<string, string | number | boolean | undefined>>;
};

export type OrchestratorAuditSummary = {
  orchestratorRunId: string;
  orchestratorId: string;
  compositionId: string;
  status: ScenarioRunStatus;
  terminalId: ScenarioTerminalId;
  redacted: true;
  planHash: string;
  bundleHash: string;
  orchestratorHash: string;
  slotInvocationReferences: Array<{ slotId: string; runtimeRunId?: string }>;
  projectionSummaries: Array<{
    slotId: string;
    semanticOutcome?: string;
    projectionId?: string;
  }>;
  traceSummary: ScenarioRunResult["traceSummary"];
  budgetUsage: ScenarioBudgetUsage;
  sideEffectSummary: {
    externalEffectsOccurred: false;
  };
};
