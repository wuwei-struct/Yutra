import {
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  ECOMMERCE_REFUND_COMPOSITION_DEMO
} from "@yutra/scenario-composition-core";
import {
  compileScenarioOrchestratorPreview,
  type ScenarioOrchestratorCompileResult
} from "@yutra/scenario-orchestrator-compiler";
import {
  createCanonicalInputHash,
  type SlotActionClosureReport
} from "@yutra/scenario-orchestrator-runtime-contract";
import {
  createInMemoryScenarioRuntimeAdapter,
  EXPLICIT_DEMO_ACTION_REGISTRY,
  InMemorySlotArtifactStore,
  inspectSlotActionClosure,
  parseAndValidateSlotAgentDsl,
  resolveExplicitDemoSideEffect
} from "@yutra/scenario-orchestrator-runtime-demo";
import { hydrateSlotArtifactsFromCompileResult } from "./artifact-hydration";
import type {
  EngineOptions,
  ExplicitScenarioOverlayEvaluatorRegistry,
  ExplicitScenarioRouteConditionRegistry,
  ExplicitScenarioSlotInputRegistry,
  ScenarioRunRequest
} from "./types";

export type BuiltinDemoCompositionId =
  | "customer-complaint-composition-demo"
  | "ecommerce-refund-composition-demo";

export const BUILTIN_DEMO_ROUTE_CONDITIONS: ExplicitScenarioRouteConditionRegistry =
  Object.freeze(
    Object.fromEntries(
      [
        "policy_clarification_required",
        "policy_explanation_available",
        "compensation_approval_required",
        "authorization_decision_available",
        "human_review_required",
        "primary_acceptance_satisfied",
        "authorization_required"
      ].map((conditionRef) => [
        conditionRef,
        (context: { semanticOutcome: string }) =>
          context.semanticOutcome === conditionRef
      ])
    )
  );

function inputFlags(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? structuredClone(value as Record<string, unknown>)
    : {};
}

export const BUILTIN_DEMO_SLOT_INPUT_RESOLVERS: ExplicitScenarioSlotInputRegistry =
  Object.freeze({
    request_policy_explanation: ({ scenarioInput }) => ({
      source_verified: true,
      knowledge_hit: true,
      demo_source_count: 2,
      demoFlags: inputFlags(scenarioInput)
    }),
    request_compensation_decision: () => ({
      high_risk: false,
      low_risk: true,
      policy_conflict: false,
      missing_evidence: false,
      evidence_valid: true
    }),
    request_refund_authorization: () => ({
      high_risk: false,
      low_risk: true,
      policy_conflict: false,
      missing_evidence: false,
      evidence_valid: true
    })
  });

function requestedOverlayDecision(
  scenarioInput: unknown,
  overlayId: string
): "allow" | "deny" | "handoff" {
  const flags = inputFlags(scenarioInput);
  if (flags.denyOverlay === overlayId) return "deny";
  if (flags.handoffOverlay === overlayId) return "handoff";
  return "allow";
}

export const BUILTIN_DEMO_OVERLAY_EVALUATORS: ExplicitScenarioOverlayEvaluatorRegistry =
  Object.freeze({
    complaint_handoff: ({ scenarioInput, overlayId }) =>
      requestedOverlayDecision(scenarioInput, overlayId),
    complaint_policy_guard: ({ scenarioInput, overlayId }) =>
      requestedOverlayDecision(scenarioInput, overlayId),
    refund_policy_guard: ({ scenarioInput, overlayId }) =>
      requestedOverlayDecision(scenarioInput, overlayId),
    refund_adapter_boundary: ({ adapterMode }) =>
      adapterMode === "demo_only" ? "allow" : "deny",
    refund_handoff: ({ scenarioInput, overlayId }) =>
      requestedOverlayDecision(scenarioInput, overlayId)
  });

export function compileBuiltinDemoScenario(
  compositionId: BuiltinDemoCompositionId
): ScenarioOrchestratorCompileResult {
  const plan =
    compositionId === "customer-complaint-composition-demo"
      ? CUSTOMER_COMPLAINT_COMPOSITION_DEMO
      : ECOMMERCE_REFUND_COMPOSITION_DEMO;
  const output = compileScenarioOrchestratorPreview({
    compositionPlan: structuredClone(plan)
  });
  if (!output.ok) throw new Error("Built-in demo Orchestrator compilation failed.");
  return output.result;
}

function compatibility(
  result: ScenarioOrchestratorCompileResult
): EngineOptions["compatibility"] {
  const agentDslVersionsBySlot: Record<string, string> = {};
  const actionClosureBySlot: Record<string, SlotActionClosureReport> = {};
  for (const slot of result.compositionResult.slots) {
    const content = slot.artifacts["agent.yutra.yaml"];
    const artifactHash = slot.artifactHashes["agent.yutra.yaml"];
    agentDslVersionsBySlot[slot.slotId] =
      parseAndValidateSlotAgentDsl(content).version;
    actionClosureBySlot[slot.slotId] = inspectSlotActionClosure({
      slotId: slot.slotId,
      agentDsl: content,
      artifactHash,
      actionRegistry: EXPLICIT_DEMO_ACTION_REGISTRY
    });
  }
  return { agentDslVersionsBySlot, actionClosureBySlot };
}

export function createBuiltinDemoEngineOptions(
  compositionId: BuiltinDemoCompositionId
): EngineOptions {
  const compileResult = compileBuiltinDemoScenario(compositionId);
  const artifactStore = hydrateSlotArtifactsFromCompileResult(
    compileResult,
    new InMemorySlotArtifactStore()
  );
  return {
    compileResult,
    artifactStore,
    runtimeAdapter: createInMemoryScenarioRuntimeAdapter({
      artifactStore,
      actionRegistry: EXPLICIT_DEMO_ACTION_REGISTRY,
      resolveSideEffectLevel: resolveExplicitDemoSideEffect
    }),
    routeConditions: BUILTIN_DEMO_ROUTE_CONDITIONS,
    overlayEvaluators: BUILTIN_DEMO_OVERLAY_EVALUATORS,
    slotInputResolvers: BUILTIN_DEMO_SLOT_INPUT_RESOLVERS,
    compatibility: compatibility(compileResult)
  };
}

export function createBuiltinScenarioRunRequest(input: {
  compileResult: ScenarioOrchestratorCompileResult;
  orchestratorRunId: string;
  value: Record<string, unknown>;
  budget?: ScenarioRunRequest["budget"];
}): ScenarioRunRequest {
  const request = {
    schemaVersion: "1.0.0-preview" as const,
    orchestratorRunId: input.orchestratorRunId,
    idempotencyKey: "",
    orchestratorId: input.compileResult.orchestratorId,
    compositionId: input.compileResult.compositionId,
    previewBundleHash: input.compileResult.previewBundleHash,
    input: {
      namespace: "scenario.input" as const,
      value: structuredClone(input.value),
      byteLength: 0,
      redactionApplied: true as const
    },
    sideEffectPolicy: { maximumAllowedLevel: "read" as const },
    ...(input.budget ? { budget: structuredClone(input.budget) } : {})
  };
  const fingerprint = {
    orchestratorRunId: request.orchestratorRunId,
    orchestratorId: request.orchestratorId,
    compositionId: request.compositionId,
    previewBundleHash: request.previewBundleHash,
    input: request.input.value,
    sideEffectPolicy: request.sideEffectPolicy,
    ...(request.budget ? { budget: request.budget } : {})
  };
  request.idempotencyKey = createCanonicalInputHash(fingerprint);
  return request;
}
