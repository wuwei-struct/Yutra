import type { CrossCuttingArchetypeId } from "@yutra/archetype-core";
import type { CompiledCompositionSlot } from "@yutra/scenario-composition-compiler";
import type {
  CompositionPrecedenceRule,
  CompositionScope,
  ScenarioCompositionPlan
} from "@yutra/scenario-composition-core";
import type { ProductArchetypeId, ScenarioPatternId } from "@yutra/scenario-pattern-core";
import type { ScenarioOrchestratorContractId } from "./ids";

export type ScenarioOrchestratorSchemaVersion = "1.0.0-preview";
export type ScenarioOrchestratorExecutionModel = "single_active_slot_call_return";

export type ScenarioOrchestratorBundleSlotReference = Pick<
  CompiledCompositionSlot,
  "slotId" | "role" | "archetypeId" | "packConfigId" | "namespace" | "configHash" | "artifactHashes"
>;

export type ScenarioOrchestratorPreviewBundleReference = {
  compositionId: string;
  compositionVersion: string;
  patternId: string;
  executionModel: "orchestrated_subflows";
  previewOnly: true;
  runtimeExecutable: false;
  planHash: string;
  bundleHash: string;
  slots: ScenarioOrchestratorBundleSlotReference[];
};

export type ScenarioOrchestratorSlot = {
  slotId: string;
  role: "primary" | "supporting";
  archetypeId: ProductArchetypeId;
  packConfigId: string;
  artifactRef: {
    namespace: string;
    agentArtifactPath: string;
    agentArtifactHash: string;
    configHash: string;
  };
  inputNamespace: string;
  stateNamespace: string;
  outputNamespace: string;
  acceptedOutcomes: string[];
  callableBySlotIds: string[];
};

export type ScenarioRouteEffect =
  | {
      type: "invoke_slot";
      targetSlotId: string;
      returnToSlotId: string;
    }
  | {
      type: "resume_caller";
    }
  | {
      type: "terminate";
      terminalId: string;
    }
  | {
      type: "request_handoff";
      terminalId: "$human_handoff";
    }
  | {
      type: "fail_closed";
      terminalId: "$fail_closed";
    };

export type ScenarioOrchestratorRoute = {
  routeId: string;
  fromSlotId: string;
  outcome: string;
  conditionRef: string;
  priority: number;
  effect: ScenarioRouteEffect;
  provenanceRef: {
    compositionRouteId: string;
  };
};

export type ScenarioOrchestratorBinding = {
  bindingId: string;
  fromSlotId: string;
  fromPath: string;
  toSlotId: string;
  toPath: string;
  required: boolean;
  transform: "identity";
  provenanceRef: {
    compositionBindingId: string;
  };
};

export type ScenarioCallFrame = {
  callerSlotId: string;
  calleeSlotId: string;
  invokedByRouteId: string;
  returnToSlotId: string;
  invocationIndex: number;
};

export type ScenarioTerminalId = "$scenario_done" | "$human_handoff" | "$fail_closed";

export type ScenarioTerminalDefinition = {
  terminalId: ScenarioTerminalId;
  status: "completed" | "handoff_required" | "failed";
  requiresAudit: true;
  primaryOutputRequired: boolean;
};

export type ScenarioContextPolicy = {
  rootNamespace: "scenario";
  sharedNamespace: "scenario.shared";
  inputNamespace: "scenario.input";
  outputNamespace: "scenario.output";
  slotNamespacePattern: "slots.<slotId>";
  writePolicy: {
    scenarioInput: "read_only_after_start";
    scenarioShared: "explicit_binding_only";
    scenarioOutput: "primary_only";
    slotContext: "own_slot_only";
  };
  implicitMergeAllowed: false;
  implicitCrossSlotReadAllowed: false;
  implicitCrossSlotWriteAllowed: false;
  secretPropagationAllowed: false;
  adapterInheritanceAllowed: false;
};

export type ScenarioExecutionPolicy = {
  scheduling: "single_active_slot";
  invocationModel: "call_return";
  parallelism: "disabled";
  recursion: "disabled";
  implicitLooping: "disabled";
  budgets: {
    maxSlotInvocations: number;
    maxRouteEvaluations: number;
    maxBindingApplications: number;
    maxCallDepth: 1;
  };
  budgetExhaustion: "fail_closed";
  ambiguousRoute: "fail_closed";
  missingRoute: "fail_closed";
};

export type ScenarioFailurePolicy = {
  slotFailure: "explicit_route_or_fail_closed";
  actionFailure: "owned_by_slot_dsl";
  bindingFailure: "fail_closed";
  routeResolutionFailure: "fail_closed";
  overlayViolation: "deny_or_handoff";
  partialScenarioSuccessAllowed: false;
  automaticRetryAtOrchestratorLevel: false;
};

export type ScenarioHandoffPolicy = {
  terminalId: "$human_handoff";
  reasonRequired: true;
  sourceSlotRequired: true;
  sourceRouteRequired: true;
  overlayRefRequiredWhenTriggeredByOverlay: true;
  contextSnapshotRequired: true;
  secretRedactionRequired: true;
  resumable: false;
};

export type ScenarioOverlayRef = {
  overlayId: string;
  archetypeId: CrossCuttingArchetypeId;
  scopes: CompositionScope[];
  enforcementMode:
    | "deny_override"
    | "require_handoff"
    | "audit_required"
    | "adapter_boundary"
    | "feedback_capture";
  provenanceRef: {
    compositionOverlayId: string;
  };
};

export type ScenarioOrchestratorTraceEventType =
  | "orchestrator.started"
  | "orchestrator.slot.invocation.started"
  | "orchestrator.slot.invocation.completed"
  | "orchestrator.slot.invocation.failed"
  | "orchestrator.route.evaluated"
  | "orchestrator.route.selected"
  | "orchestrator.binding.applied"
  | "orchestrator.binding.failed"
  | "orchestrator.overlay.evaluated"
  | "orchestrator.handoff.requested"
  | "orchestrator.budget.exhausted"
  | "orchestrator.completed"
  | "orchestrator.failed";

export type ScenarioTracePolicy = {
  contractVersion: "1.0.0-preview";
  mandatoryEventTypes: ScenarioOrchestratorTraceEventType[];
  eventEmissionImplemented: false;
  auditRequired: true;
  contextSnapshotRedactionRequired: true;
  provenanceRequired: true;
};

export type ScenarioOrchestratorTraceEventContract = {
  eventType: ScenarioOrchestratorTraceEventType;
  orchestratorId: string;
  compositionId: string;
  runId: string;
  sequence: number;
  activeSlotId: string;
  sourceSlotId?: string;
  targetSlotId?: string;
  routeId?: string;
  bindingId?: string;
  overlayId?: string;
  terminalId?: ScenarioTerminalId;
  planHash: string;
  bundleHash: string;
  orchestratorHash: string;
  timestamp: string;
};

export type ScenarioOrchestratorProvenance = {
  compositionId: string;
  compositionVersion: string;
  patternId: string;
  planHash: string;
  bundleHash: string;
  orchestratorHash: string;
  slotSources: Array<{
    slotId: string;
    archetypeId: string;
    packConfigId: string;
    configHash: string;
    agentArtifactHash: string;
  }>;
  routeSources: Array<{
    routeId: string;
    compositionRouteId: string;
  }>;
  bindingSources: Array<{
    bindingId: string;
    compositionBindingId: string;
  }>;
  overlaySources: Array<{
    overlayId: string;
    compositionOverlayId: string;
  }>;
};

export type ScenarioOrchestratorPublicExposure = {
  mode: "demo_only";
  containsCustomerData: false;
  containsRealEndpoint: false;
  containsSecret: false;
  containsCustomerSop: false;
  containsCommercialDeliveryAsset: false;
};

export type ScenarioOrchestratorDocument = {
  schemaVersion: ScenarioOrchestratorSchemaVersion;
  kind: "scenario_orchestrator";
  orchestratorId: ScenarioOrchestratorContractId | string;
  version: string;
  compositionRef: {
    compositionId: string;
    compositionVersion: string;
    patternId: ScenarioPatternId;
    planHash: string;
    bundleHash: string;
  };
  executionModel: ScenarioOrchestratorExecutionModel;
  previewOnly: true;
  runtimeExecutable: false;
  entrySlotId: string;
  slots: ScenarioOrchestratorSlot[];
  routes: ScenarioOrchestratorRoute[];
  bindings: ScenarioOrchestratorBinding[];
  terminals: ScenarioTerminalDefinition[];
  contextPolicy: ScenarioContextPolicy;
  executionPolicy: ScenarioExecutionPolicy;
  failurePolicy: ScenarioFailurePolicy;
  handoffPolicy: ScenarioHandoffPolicy;
  tracePolicy: ScenarioTracePolicy;
  precedencePolicyRef: {
    conflictMode: "fail_closed";
    rules: CompositionPrecedenceRule[];
  };
  overlayRefs: ScenarioOverlayRef[];
  provenance: ScenarioOrchestratorProvenance;
  publicExposure: ScenarioOrchestratorPublicExposure;
};

export type ScenarioOrchestratorValidationContext = {
  compositionPlan: ScenarioCompositionPlan;
  compositionBundle: ScenarioOrchestratorPreviewBundleReference;
};
