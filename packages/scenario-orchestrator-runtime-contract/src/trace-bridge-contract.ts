import type {
  ScenarioSlotAuditBridge,
  ScenarioSlotInvocationRequest,
  ScenarioSlotInvocationResult,
  ScenarioSlotTraceCorrelation
} from "./types";

export const ORCHESTRATOR_SLOT_INVOCATION_EVENT_TYPES = [
  "orchestrator.slot.invocation.started",
  "orchestrator.slot.invocation.completed",
  "orchestrator.slot.invocation.failed"
] as const;

export const RUNTIME_ADAPTER_FORBIDDEN_ORCHESTRATOR_EVENTS = [
  "orchestrator.route.selected",
  "orchestrator.binding.applied"
] as const;

export const SLOT_TRACE_CORRELATION_FIELDS = [
  "orchestratorRunId",
  "orchestratorId",
  "compositionId",
  "slotId",
  "invocationId",
  "parentSpanId",
  "invocationIndex",
  "agentArtifactHash",
  "configHash"
] as const satisfies readonly (keyof ScenarioSlotTraceCorrelation)[];

export function createSlotTraceCorrelation(
  request: ScenarioSlotInvocationRequest
): ScenarioSlotTraceCorrelation {
  return {
    orchestratorRunId: request.orchestratorRunId,
    orchestratorId: request.orchestratorId,
    compositionId: request.compositionId,
    slotId: request.slotId,
    invocationId: request.invocationId,
    parentSpanId: request.traceParent.parentSpanId,
    invocationIndex: request.invocationIndex,
    agentArtifactHash: request.artifactRef.agentArtifactHash,
    configHash: request.artifactRef.configHash
  };
}

export function createSlotAuditBridge(
  request: ScenarioSlotInvocationRequest,
  result: ScenarioSlotInvocationResult
): ScenarioSlotAuditBridge {
  return {
    runtimeRunId: result.runtimeRunId,
    auditAvailable: result.auditReference.status === "available",
    redacted: true,
    agentArtifactHash: request.artifactRef.agentArtifactHash,
    configHash: request.artifactRef.configHash,
    sideEffectSummary: structuredClone(result.sideEffectSummary)
  };
}
