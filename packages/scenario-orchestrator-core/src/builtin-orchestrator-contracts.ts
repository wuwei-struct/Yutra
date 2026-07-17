import {
  COMPOSITION_PRECEDENCE_RULES,
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  ECOMMERCE_REFUND_COMPOSITION_DEMO,
  type ScenarioCompositionPlan
} from "@yutra/scenario-composition-core";
import { DEFAULT_SCENARIO_CONTEXT_POLICY, expectedSlotNamespaces } from "./context-policy";
import {
  DEFAULT_SCENARIO_EXECUTION_POLICY,
  DEFAULT_SCENARIO_FAILURE_POLICY,
  DEFAULT_SCENARIO_HANDOFF_POLICY,
  DEFAULT_SCENARIO_TERMINALS
} from "./execution-semantics";
import { DEFAULT_SCENARIO_TRACE_POLICY } from "./trace-contract";
import type {
  ScenarioOrchestratorBinding,
  ScenarioOrchestratorDocument,
  ScenarioOrchestratorPreviewBundleReference,
  ScenarioOrchestratorRoute,
  ScenarioOrchestratorValidationContext
} from "./types";

const SLOT_ARTIFACT_FILENAMES = [
  "agent.yutra.yaml",
  "policy.yaml",
  "adapter.config.json",
  "templates.json",
  "test-cases.json",
  "trace.expectation.json"
] as const;

function demoHash(character: string): string {
  return character.repeat(64);
}

function createBundleFixture(
  plan: ScenarioCompositionPlan,
  planHash: string,
  bundleHash: string,
  slotHashCharacters: string[]
): ScenarioOrchestratorPreviewBundleReference {
  return {
    compositionId: plan.compositionId,
    compositionVersion: plan.version,
    patternId: plan.patternRef.patternId,
    executionModel: "orchestrated_subflows",
    previewOnly: true,
    runtimeExecutable: false,
    planHash,
    bundleHash,
    slots: plan.slots.map((slot, index) => {
      const character = slotHashCharacters[index] ?? "a";
      return {
        slotId: slot.slotId,
        role: slot.role,
        archetypeId: slot.archetypeId,
        packConfigId: slot.packConfigId,
        namespace: `slots/${slot.slotId}`,
        configHash: demoHash(character),
        artifactHashes: Object.fromEntries(
          SLOT_ARTIFACT_FILENAMES.map((filename, artifactIndex) => [
            filename,
            demoHash(((Number.parseInt(character, 16) + artifactIndex) % 16).toString(16))
          ])
        ) as Record<(typeof SLOT_ARTIFACT_FILENAMES)[number], string>
      };
    })
  };
}

function buildDocument(
  orchestratorId: string,
  plan: ScenarioCompositionPlan,
  bundle: ScenarioOrchestratorPreviewBundleReference,
  routes: ScenarioOrchestratorRoute[],
  orchestratorHash: string
): ScenarioOrchestratorDocument {
  const primarySlotId = plan.primarySlotId;
  const invokeCallers = new Map<string, string[]>();
  for (const route of routes) {
    if (route.effect.type !== "invoke_slot") continue;
    const callers = invokeCallers.get(route.effect.targetSlotId) ?? [];
    callers.push(route.fromSlotId);
    invokeCallers.set(route.effect.targetSlotId, callers);
  }
  const bindings: ScenarioOrchestratorBinding[] = plan.dataBindings.map((binding) => ({
    ...binding,
    provenanceRef: {
      compositionBindingId: binding.bindingId
    }
  }));

  return {
    schemaVersion: "1.0.0-preview",
    kind: "scenario_orchestrator",
    orchestratorId,
    version: "0.1.0-preview",
    compositionRef: {
      compositionId: plan.compositionId,
      compositionVersion: plan.version,
      patternId: plan.patternRef.patternId,
      planHash: bundle.planHash,
      bundleHash: bundle.bundleHash
    },
    executionModel: "single_active_slot_call_return",
    previewOnly: true,
    runtimeExecutable: false,
    entrySlotId: primarySlotId,
    slots: plan.slots.map((planSlot) => {
      const bundleSlot = bundle.slots.find((slot) => slot.slotId === planSlot.slotId);
      if (!bundleSlot) {
        throw new Error(`ORCHESTRATOR_FIXTURE_SLOT_MISSING: ${planSlot.slotId}`);
      }
      const namespaces = expectedSlotNamespaces(planSlot.slotId);
      return {
        slotId: planSlot.slotId,
        role: planSlot.role,
        archetypeId: planSlot.archetypeId,
        packConfigId: planSlot.packConfigId,
        artifactRef: {
          namespace: bundleSlot.namespace,
          agentArtifactPath: `${bundleSlot.namespace}/agent.yutra.yaml`,
          agentArtifactHash: bundleSlot.artifactHashes["agent.yutra.yaml"],
          configHash: bundleSlot.configHash
        },
        ...namespaces,
        acceptedOutcomes: routes
          .filter((route) => route.fromSlotId === planSlot.slotId)
          .map((route) => route.outcome),
        callableBySlotIds:
          planSlot.role === "primary" ? [] : [...(invokeCallers.get(planSlot.slotId) ?? [])]
      };
    }),
    routes,
    bindings,
    terminals: structuredClone(DEFAULT_SCENARIO_TERMINALS),
    contextPolicy: structuredClone(DEFAULT_SCENARIO_CONTEXT_POLICY),
    executionPolicy: structuredClone(DEFAULT_SCENARIO_EXECUTION_POLICY),
    failurePolicy: structuredClone(DEFAULT_SCENARIO_FAILURE_POLICY),
    handoffPolicy: structuredClone(DEFAULT_SCENARIO_HANDOFF_POLICY),
    tracePolicy: structuredClone(DEFAULT_SCENARIO_TRACE_POLICY),
    precedencePolicyRef: {
      conflictMode: "fail_closed",
      rules: [...COMPOSITION_PRECEDENCE_RULES]
    },
    overlayRefs: plan.crossCuttingOverlays.map((overlay) => ({
      ...structuredClone(overlay),
      provenanceRef: {
        compositionOverlayId: overlay.overlayId
      }
    })),
    provenance: {
      compositionId: plan.compositionId,
      compositionVersion: plan.version,
      patternId: plan.patternRef.patternId,
      planHash: bundle.planHash,
      bundleHash: bundle.bundleHash,
      orchestratorHash,
      slotSources: bundle.slots.map((slot) => ({
        slotId: slot.slotId,
        archetypeId: slot.archetypeId,
        packConfigId: slot.packConfigId,
        configHash: slot.configHash,
        agentArtifactHash: slot.artifactHashes["agent.yutra.yaml"]
      })),
      routeSources: routes.map((route) => ({
        routeId: route.routeId,
        compositionRouteId: route.provenanceRef.compositionRouteId
      })),
      bindingSources: bindings.map((binding) => ({
        bindingId: binding.bindingId,
        compositionBindingId: binding.provenanceRef.compositionBindingId
      })),
      overlaySources: plan.crossCuttingOverlays.map((overlay) => ({
        overlayId: overlay.overlayId,
        compositionOverlayId: overlay.overlayId
      }))
    },
    publicExposure: {
      mode: "demo_only",
      containsCustomerData: false,
      containsRealEndpoint: false,
      containsSecret: false,
      containsCustomerSop: false,
      containsCommercialDeliveryAsset: false
    }
  };
}

export const CUSTOMER_COMPLAINT_ORCHESTRATOR_BUNDLE_FIXTURE = createBundleFixture(
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  demoHash("a"),
  demoHash("b"),
  ["1", "2", "3"]
);

const customerComplaintRoutes: ScenarioOrchestratorRoute[] = [
  {
    routeId: "request_policy_explanation",
    fromSlotId: "complaint_resolution",
    outcome: "policy_clarification_required",
    conditionRef: "policy_clarification_required",
    priority: 10,
    effect: {
      type: "invoke_slot",
      targetSlotId: "policy_explanation",
      returnToSlotId: "complaint_resolution"
    },
    provenanceRef: { compositionRouteId: "request_policy_explanation" }
  },
  {
    routeId: "return_policy_explanation",
    fromSlotId: "policy_explanation",
    outcome: "policy_explanation_available",
    conditionRef: "policy_explanation_available",
    priority: 10,
    effect: { type: "resume_caller" },
    provenanceRef: { compositionRouteId: "return_policy_explanation" }
  },
  {
    routeId: "request_compensation_decision",
    fromSlotId: "complaint_resolution",
    outcome: "compensation_approval_required",
    conditionRef: "compensation_approval_required",
    priority: 20,
    effect: {
      type: "invoke_slot",
      targetSlotId: "compensation_decision",
      returnToSlotId: "complaint_resolution"
    },
    provenanceRef: { compositionRouteId: "request_compensation_decision" }
  },
  {
    routeId: "return_compensation_decision",
    fromSlotId: "compensation_decision",
    outcome: "authorization_decision_available",
    conditionRef: "authorization_decision_available",
    priority: 10,
    effect: { type: "resume_caller" },
    provenanceRef: { compositionRouteId: "return_compensation_decision" }
  },
  {
    routeId: "handoff_when_required",
    fromSlotId: "complaint_resolution",
    outcome: "human_review_required",
    conditionRef: "human_review_required",
    priority: 30,
    effect: {
      type: "request_handoff",
      terminalId: "$human_handoff"
    },
    provenanceRef: { compositionRouteId: "handoff_when_required" }
  },
  {
    routeId: "complete_from_primary",
    fromSlotId: "complaint_resolution",
    outcome: "primary_acceptance_satisfied",
    conditionRef: "primary_acceptance_satisfied",
    priority: 40,
    effect: {
      type: "terminate",
      terminalId: "$scenario_done"
    },
    provenanceRef: { compositionRouteId: "complete_from_primary" }
  }
];

export const CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT = buildDocument(
  "customer-complaint-orchestrator-contract",
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  CUSTOMER_COMPLAINT_ORCHESTRATOR_BUNDLE_FIXTURE,
  customerComplaintRoutes,
  demoHash("c")
);

export const CUSTOMER_COMPLAINT_ORCHESTRATOR_VALIDATION_CONTEXT: ScenarioOrchestratorValidationContext = {
  compositionPlan: CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  compositionBundle: CUSTOMER_COMPLAINT_ORCHESTRATOR_BUNDLE_FIXTURE
};

export const ECOMMERCE_REFUND_ORCHESTRATOR_BUNDLE_FIXTURE = createBundleFixture(
  ECOMMERCE_REFUND_COMPOSITION_DEMO,
  demoHash("d"),
  demoHash("e"),
  ["4", "5"]
);

const ecommerceRefundRoutes: ScenarioOrchestratorRoute[] = [
  {
    routeId: "request_refund_authorization",
    fromSlotId: "refund_resolution",
    outcome: "authorization_required",
    conditionRef: "authorization_required",
    priority: 10,
    effect: {
      type: "invoke_slot",
      targetSlotId: "refund_authorization",
      returnToSlotId: "refund_resolution"
    },
    provenanceRef: { compositionRouteId: "request_refund_authorization" }
  },
  {
    routeId: "return_refund_authorization",
    fromSlotId: "refund_authorization",
    outcome: "authorization_decision_available",
    conditionRef: "authorization_decision_available",
    priority: 10,
    effect: { type: "resume_caller" },
    provenanceRef: { compositionRouteId: "return_refund_authorization" }
  },
  {
    routeId: "refund_handoff_required",
    fromSlotId: "refund_resolution",
    outcome: "human_review_required",
    conditionRef: "human_review_required",
    priority: 20,
    effect: {
      type: "request_handoff",
      terminalId: "$human_handoff"
    },
    provenanceRef: { compositionRouteId: "refund_handoff_required" }
  },
  {
    routeId: "refund_complete",
    fromSlotId: "refund_resolution",
    outcome: "primary_acceptance_satisfied",
    conditionRef: "primary_acceptance_satisfied",
    priority: 30,
    effect: {
      type: "terminate",
      terminalId: "$scenario_done"
    },
    provenanceRef: { compositionRouteId: "refund_complete" }
  }
];

export const ECOMMERCE_REFUND_ORCHESTRATOR_CONTRACT = buildDocument(
  "ecommerce-refund-orchestrator-contract",
  ECOMMERCE_REFUND_COMPOSITION_DEMO,
  ECOMMERCE_REFUND_ORCHESTRATOR_BUNDLE_FIXTURE,
  ecommerceRefundRoutes,
  demoHash("f")
);

export const ECOMMERCE_REFUND_ORCHESTRATOR_VALIDATION_CONTEXT: ScenarioOrchestratorValidationContext = {
  compositionPlan: ECOMMERCE_REFUND_COMPOSITION_DEMO,
  compositionBundle: ECOMMERCE_REFUND_ORCHESTRATOR_BUNDLE_FIXTURE
};

export const BUILTIN_SCENARIO_ORCHESTRATOR_CONTRACTS = [
  CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT,
  ECOMMERCE_REFUND_ORCHESTRATOR_CONTRACT
] as const;
