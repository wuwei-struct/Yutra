import type { ScenarioOrchestratorTraceEventType, ScenarioTracePolicy } from "./types";

export const SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES = [
  "orchestrator.started",
  "orchestrator.slot.invocation.started",
  "orchestrator.slot.invocation.completed",
  "orchestrator.slot.invocation.failed",
  "orchestrator.route.evaluated",
  "orchestrator.route.selected",
  "orchestrator.binding.applied",
  "orchestrator.binding.failed",
  "orchestrator.overlay.evaluated",
  "orchestrator.handoff.requested",
  "orchestrator.budget.exhausted",
  "orchestrator.completed",
  "orchestrator.failed"
] as const satisfies readonly ScenarioOrchestratorTraceEventType[];

export const DEFAULT_SCENARIO_TRACE_POLICY: ScenarioTracePolicy = {
  contractVersion: "1.0.0-preview",
  mandatoryEventTypes: [...SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES],
  eventEmissionImplemented: false,
  auditRequired: true,
  contextSnapshotRedactionRequired: true,
  provenanceRequired: true
};
