import type { CrossCuttingArchetypeId } from "@yutra/archetype-core";
import {
  APPROVAL_DECISION_BASIC_CONFIG,
  KNOWLEDGE_ANSWERING_BASIC_CONFIG,
  REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG,
  type PackConfig
} from "@yutra/pack-config-core";
import { getScenarioPattern } from "@yutra/scenario-pattern-core";
import { DEFAULT_COMPOSITION_PRECEDENCE_POLICY } from "./precedence";
import type {
  CompositionPublicExposure,
  ScenarioCompositionDraft,
  ScenarioCompositionPlan
} from "./types";

function clonePackConfig(config: PackConfig): PackConfig {
  return JSON.parse(JSON.stringify(config)) as PackConfig;
}

function demoExposure(): CompositionPublicExposure {
  return {
    mode: "demo_only",
    containsCustomerData: false,
    containsRealEndpoint: false,
    containsSecret: false,
    containsCustomerSop: false,
    containsCommercialDeliveryAsset: false
  };
}

function patternVersion(patternId: "ecommerce-refund-demo" | "customer-complaint-demo" | "renewal-churn-warning-demo"): string {
  const pattern = getScenarioPattern(patternId);
  if (!pattern) throw new Error(`SCENARIO_PATTERN_NOT_FOUND: ${patternId}`);
  return pattern.version;
}

export const CUSTOMER_COMPLAINT_COMPOSITION_DEMO: ScenarioCompositionPlan = {
  schemaVersion: "1.0.0",
  compositionId: "customer-complaint-composition-demo",
  version: "0.1.0",
  patternRef: {
    patternId: "customer-complaint-demo",
    version: patternVersion("customer-complaint-demo")
  },
  executionModel: "orchestrated_subflows",
  primarySlotId: "complaint_resolution",
  slots: [
    {
      slotId: "complaint_resolution",
      role: "primary",
      archetypeId: "request-resolution",
      packConfigId: REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.packConfigId,
      packConfig: clonePackConfig(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG),
      purpose: {
        en: "Own the request outcome, final acceptance decision, and outward response.",
        zhCN: "负责诉求处理结果、最终验收判定和对外响应。"
      }
    },
    {
      slotId: "policy_explanation",
      role: "supporting",
      archetypeId: "knowledge-answering",
      packConfigId: KNOWLEDGE_ANSWERING_BASIC_CONFIG.packConfigId,
      packConfig: clonePackConfig(KNOWLEDGE_ANSWERING_BASIC_CONFIG),
      purpose: {
        en: "Return a source-constrained demo policy explanation to the primary flow.",
        zhCN: "向主流程返回有来源约束的 demo 政策解释结果。"
      }
    },
    {
      slotId: "compensation_decision",
      role: "supporting",
      archetypeId: "approval-decision",
      packConfigId: APPROVAL_DECISION_BASIC_CONFIG.packConfigId,
      packConfig: clonePackConfig(APPROVAL_DECISION_BASIC_CONFIG),
      purpose: {
        en: "Return a governed authorization decision when compensation review is required.",
        zhCN: "在需要补偿审核时返回受治理的授权性决策。"
      }
    }
  ],
  crossCuttingOverlays: [
    {
      overlayId: "complaint_handoff",
      archetypeId: "human-handoff",
      scopes: [{ type: "scenario" }, { type: "route", routeId: "handoff_when_required" }],
      enforcementMode: "require_handoff"
    },
    {
      overlayId: "complaint_policy_guard",
      archetypeId: "policy-guard",
      scopes: [
        { type: "scenario" },
        { type: "slot", slotId: "compensation_decision" },
        { type: "route", routeId: "request_compensation_decision" }
      ],
      enforcementMode: "deny_override"
    }
  ],
  routes: [
    {
      routeId: "request_policy_explanation",
      fromSlotId: "complaint_resolution",
      toSlotId: "policy_explanation",
      trigger: "on_guard",
      conditionRef: "policy_clarification_required",
      returnMode: "return_to_caller"
    },
    {
      routeId: "return_policy_explanation",
      fromSlotId: "policy_explanation",
      toSlotId: "complaint_resolution",
      trigger: "on_result",
      conditionRef: "policy_explanation_available",
      returnMode: "return_to_caller"
    },
    {
      routeId: "request_compensation_decision",
      fromSlotId: "complaint_resolution",
      toSlotId: "compensation_decision",
      trigger: "on_guard",
      conditionRef: "compensation_approval_required",
      returnMode: "return_to_caller"
    },
    {
      routeId: "return_compensation_decision",
      fromSlotId: "compensation_decision",
      toSlotId: "complaint_resolution",
      trigger: "on_result",
      conditionRef: "authorization_decision_available",
      returnMode: "return_to_caller"
    },
    {
      routeId: "handoff_when_required",
      fromSlotId: "complaint_resolution",
      toSlotId: "$human_handoff",
      trigger: "on_handoff",
      conditionRef: "human_review_required",
      returnMode: "terminate_scenario"
    },
    {
      routeId: "complete_from_primary",
      fromSlotId: "complaint_resolution",
      toSlotId: "$scenario_done",
      trigger: "on_result",
      conditionRef: "primary_acceptance_satisfied",
      returnMode: "terminate_scenario"
    }
  ],
  dataBindings: [
    {
      bindingId: "policy_explanation_to_resolution",
      fromSlotId: "policy_explanation",
      fromPath: "result.sourceConstrainedExplanation",
      toSlotId: "complaint_resolution",
      toPath: "supporting.policyExplanation",
      required: true,
      transform: "identity"
    },
    {
      bindingId: "compensation_decision_to_resolution",
      fromSlotId: "compensation_decision",
      fromPath: "result.authorizationDecision",
      toSlotId: "complaint_resolution",
      toPath: "supporting.compensationDecision",
      required: true,
      transform: "identity"
    }
  ],
  precedencePolicy: {
    rules: [...DEFAULT_COMPOSITION_PRECEDENCE_POLICY.rules],
    conflictMode: "fail_closed"
  },
  publicExposure: demoExposure()
};

export const ECOMMERCE_REFUND_COMPOSITION_DEMO: ScenarioCompositionPlan = {
  schemaVersion: "1.0.0",
  compositionId: "ecommerce-refund-composition-demo",
  version: "0.1.0",
  patternRef: {
    patternId: "ecommerce-refund-demo",
    version: patternVersion("ecommerce-refund-demo")
  },
  executionModel: "orchestrated_subflows",
  primarySlotId: "refund_resolution",
  slots: [
    {
      slotId: "refund_resolution",
      role: "primary",
      archetypeId: "request-resolution",
      packConfigId: REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.packConfigId,
      packConfig: clonePackConfig(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG),
      purpose: {
        en: "Own the demo refund request result and final response.",
        zhCN: "负责 demo 退款请求结果和最终响应。"
      }
    },
    {
      slotId: "refund_authorization",
      role: "supporting",
      archetypeId: "approval-decision",
      packConfigId: APPROVAL_DECISION_BASIC_CONFIG.packConfigId,
      packConfig: clonePackConfig(APPROVAL_DECISION_BASIC_CONFIG),
      purpose: {
        en: "Return an authorization decision for guarded demo cases.",
        zhCN: "为受 Guard 约束的 demo 情况返回授权性决策。"
      }
    }
  ],
  crossCuttingOverlays: [
    {
      overlayId: "refund_policy_guard",
      archetypeId: "policy-guard",
      scopes: [{ type: "scenario" }],
      enforcementMode: "deny_override"
    },
    {
      overlayId: "refund_adapter_boundary",
      archetypeId: "adapter-connector",
      scopes: [{ type: "slot", slotId: "refund_resolution" }],
      enforcementMode: "adapter_boundary"
    },
    {
      overlayId: "refund_handoff",
      archetypeId: "human-handoff",
      scopes: [{ type: "route", routeId: "refund_handoff_required" }],
      enforcementMode: "require_handoff"
    }
  ],
  routes: [
    {
      routeId: "request_refund_authorization",
      fromSlotId: "refund_resolution",
      toSlotId: "refund_authorization",
      trigger: "on_guard",
      conditionRef: "authorization_required",
      returnMode: "return_to_caller"
    },
    {
      routeId: "return_refund_authorization",
      fromSlotId: "refund_authorization",
      toSlotId: "refund_resolution",
      trigger: "on_result",
      conditionRef: "authorization_decision_available",
      returnMode: "return_to_caller"
    },
    {
      routeId: "refund_handoff_required",
      fromSlotId: "refund_resolution",
      toSlotId: "$human_handoff",
      trigger: "on_handoff",
      conditionRef: "human_review_required",
      returnMode: "terminate_scenario"
    },
    {
      routeId: "refund_complete",
      fromSlotId: "refund_resolution",
      toSlotId: "$scenario_done",
      trigger: "on_result",
      conditionRef: "primary_acceptance_satisfied",
      returnMode: "terminate_scenario"
    }
  ],
  dataBindings: [
    {
      bindingId: "refund_authorization_to_resolution",
      fromSlotId: "refund_authorization",
      fromPath: "result.authorizationDecision",
      toSlotId: "refund_resolution",
      toPath: "supporting.authorizationDecision",
      required: true,
      transform: "identity"
    }
  ],
  precedencePolicy: {
    rules: [...DEFAULT_COMPOSITION_PRECEDENCE_POLICY.rules],
    conflictMode: "fail_closed"
  },
  publicExposure: demoExposure()
};

export const RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT: ScenarioCompositionDraft = {
  schemaVersion: "1.0.0",
  compositionId: "renewal-churn-warning-composition-demo",
  patternRef: {
    patternId: "renewal-churn-warning-demo",
    version: patternVersion("renewal-churn-warning-demo")
  },
  executionModel: "orchestrated_subflows",
  primaryArchetypeId: "monitoring-response",
  supportingArchetypeIds: ["data-insight", "lead-engagement"],
  crossCuttingArchetypeIds: ["human-handoff", "feedback-optimization"] as CrossCuttingArchetypeId[],
  status: "contract_only",
  eligibleForCompilerInput: false,
  blockers: [
    "monitoring-response Pack Config and compiler are unavailable",
    "data-insight Pack Config and compiler are unavailable",
    "lead-engagement Pack Config and compiler are unavailable"
  ],
  publicExposure: demoExposure()
};

export const BUILTIN_SCENARIO_COMPOSITION_PLANS: ScenarioCompositionPlan[] = [
  ECOMMERCE_REFUND_COMPOSITION_DEMO,
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO
];
