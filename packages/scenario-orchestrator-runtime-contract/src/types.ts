import type {
  ScenarioOrchestratorDocument,
  ScenarioOrchestratorExecutionModel
} from "@yutra/scenario-orchestrator-core";

export type RuntimeAdapterImplementationStatus =
  | "contract_only"
  | "available"
  | "disabled";

export type RuntimeAdapterCapabilityId =
  | "slot_execution"
  | "agent_artifact_hash_verification"
  | "action_closure_preflight"
  | "idempotent_invocation"
  | "timeout_enforcement"
  | "cancellation"
  | "trace_parent_binding"
  | "audit_reference"
  | "side_effect_reporting"
  | "context_redaction"
  | "snapshot_resume";

export type ScenarioRuntimeAdapterDescriptor = {
  schemaVersion: "1.0.0-preview";
  adapterId: string;
  adapterVersion: string;
  protocolVersion: "1.0.0-preview";
  implementationStatus: RuntimeAdapterImplementationStatus;
  supportedOrchestratorSchemaVersions: string[];
  supportedExecutionModels: ["single_active_slot_call_return"];
  supportedAgentDslVersions: string[];
  capabilities: Record<RuntimeAdapterCapabilityId, boolean>;
  limits: {
    maxInvocationInputBytes: number;
    maxInvocationOutputBytes: number;
    maxTimeoutMs: number;
    maxConcurrentSlotInvocations: 1;
  };
  publicExposure: {
    mode: "demo_only" | "contract_only";
    containsCustomerData: false;
    containsRealEndpoint: false;
    containsSecret: false;
    containsCustomerSop: false;
    containsCommercialDeliveryAsset: false;
  };
};

export type SlotActionClosureReport = {
  slotId: string;
  artifactHash: string;
  referencedActionIds: string[];
  resolvableActionIds: string[];
  unresolvedActionIds: string[];
  complete: boolean;
};

export type RuntimeCompatibilityInput = {
  orchestratorDocument: ScenarioOrchestratorDocument;
  adapterDescriptor: ScenarioRuntimeAdapterDescriptor | unknown;
  agentDslVersionsBySlot: Record<string, string>;
  actionClosureBySlot: Record<string, SlotActionClosureReport>;
  requiredCapabilities?: RuntimeAdapterCapabilityId[];
};

export type RuntimeCompatibilityBlocker = {
  code:
    | "implementation_unavailable"
    | "protocol_unsupported"
    | "orchestrator_schema_unsupported"
    | "execution_model_unsupported"
    | "agent_dsl_version_unsupported"
    | "mandatory_capability_missing"
    | "action_closure_incomplete"
    | "artifact_hash_mismatch"
    | "slot_contract_missing";
  message: string;
  capabilityId?: RuntimeAdapterCapabilityId;
  slotId?: string;
};

export type RuntimeCompatibilityWarning = {
  code: "optional_capability_unavailable";
  message: string;
  capabilityId: RuntimeAdapterCapabilityId;
};

export type OrchestratorRuntimeCompatibilityReport = {
  compatible: boolean;
  status: "compatible" | "incompatible";
  orchestratorId: string;
  adapterId: string;
  adapterVersion: string;
  schemaVersionSupported: boolean;
  executionModelSupported: boolean;
  allAgentDslVersionsSupported: boolean;
  allMandatoryCapabilitiesSupported: boolean;
  allActionClosuresComplete: boolean;
  blockers: RuntimeCompatibilityBlocker[];
  warnings: RuntimeCompatibilityWarning[];
  currentRuntimeSupported: boolean;
};

export type ScenarioSideEffectLevel =
  | "none"
  | "read"
  | "write"
  | "external"
  | "financial"
  | "approval";

export type ScenarioSlotInvocationRequest = {
  schemaVersion: "1.0.0-preview";
  orchestratorRunId: string;
  invocationId: string;
  invocationIndex: number;
  idempotencyKey: string;
  orchestratorId: string;
  compositionId: string;
  slotId: string;
  archetypeId: string;
  artifactRef: {
    agentArtifactPath: string;
    agentArtifactHash: string;
    configHash: string;
  };
  traceParent: {
    orchestratorRunId: string;
    parentSequence: number;
    parentSpanId: string;
  };
  input: {
    namespace: string;
    value: unknown;
    byteLength: number;
    redactionApplied: boolean;
  };
  budget: {
    timeoutMs: number;
    maxRuntimeSteps: number;
  };
  sideEffectPolicy: {
    maximumAllowedLevel: ScenarioSideEffectLevel;
    requireExplicitDeclaration: true;
  };
  retryPolicy: {
    orchestratorRetryAllowed: false;
    invocationAttempt: 1;
  };
};

export type ScenarioSlotInvocationStatus =
  | "completed"
  | "handoff_required"
  | "failed"
  | "cancelled"
  | "timed_out";

export type ScenarioSlotInvocationResult = {
  schemaVersion: "1.0.0-preview";
  invocationId: string;
  idempotencyKey: string;
  runtimeRunId: string;
  status: ScenarioSlotInvocationStatus;
  outcome?: string;
  output?: {
    namespace: string;
    value: unknown;
    byteLength: number;
    redactionApplied: boolean;
  };
  error?: {
    code: string;
    safeMessage: string;
    retryable: false;
  };
  traceReference: {
    runtimeRunId: string;
    parentOrchestratorRunId: string;
    firstSequence: number;
    lastSequence: number;
    eventCount: number;
  };
  auditReference: {
    runtimeRunId: string;
    status: "available" | "unavailable";
    redacted: true;
  };
  sideEffectSummary: {
    declaredLevel: ScenarioSideEffectLevel;
    externalEffectsOccurred: boolean;
    effectCount: number;
  };
  resourceUsage: {
    runtimeSteps: number;
    elapsedMs: number;
  };
};

export type ScenarioSlotCancellationRequest = {
  schemaVersion: "1.0.0-preview";
  orchestratorRunId: string;
  invocationId: string;
  idempotencyKey: string;
  reasonCode: string;
};

export type ScenarioSlotCancellationResult = {
  schemaVersion: "1.0.0-preview";
  invocationId: string;
  status: "cancelled" | "not_cancellable" | "already_terminal";
};

export interface ScenarioOrchestratorRuntimeAdapter {
  readonly descriptor: ScenarioRuntimeAdapterDescriptor;
  inspectCompatibility(
    input: RuntimeCompatibilityInput
  ): OrchestratorRuntimeCompatibilityReport;
  invokeSlot(
    request: ScenarioSlotInvocationRequest
  ): Promise<ScenarioSlotInvocationResult>;
  cancelSlot?(
    request: ScenarioSlotCancellationRequest
  ): Promise<ScenarioSlotCancellationResult>;
}

export type ScenarioSlotTraceCorrelation = {
  orchestratorRunId: string;
  orchestratorId: string;
  compositionId: string;
  slotId: string;
  invocationId: string;
  parentSpanId: string;
  invocationIndex: number;
  agentArtifactHash: string;
  configHash: string;
};

export type ScenarioSlotAuditBridge = {
  runtimeRunId: string;
  auditAvailable: boolean;
  redacted: true;
  agentArtifactHash: string;
  configHash: string;
  sideEffectSummary: ScenarioSlotInvocationResult["sideEffectSummary"];
};

export type ScenarioRuntimeAdapterExplainLocale = "en" | "zh-CN";

export type SupportedOrchestratorExecutionModel =
  ScenarioOrchestratorExecutionModel;
