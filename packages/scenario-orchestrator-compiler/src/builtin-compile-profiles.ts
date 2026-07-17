import { DEFAULT_SCENARIO_TERMINALS } from "@yutra/scenario-orchestrator-core";
import type { ScenarioOrchestratorCompileProfile } from "./types";

function publicExposure() {
  return {
    mode: "demo_only" as const,
    containsCustomerData: false as const,
    containsRealEndpoint: false as const,
    containsSecret: false as const,
    containsCustomerSop: false as const,
    containsCommercialDeliveryAsset: false as const
  };
}

export const CUSTOMER_COMPLAINT_ORCHESTRATOR_PROFILE: ScenarioOrchestratorCompileProfile =
  {
    profileId: "customer-complaint-orchestrator-profile",
    compositionId: "customer-complaint-composition-demo",
    version: "0.1.0",
    slotProfiles: [
      {
        slotId: "complaint_resolution",
        acceptedOutcomes: [
          "policy_clarification_required",
          "compensation_approval_required",
          "human_review_required",
          "primary_acceptance_satisfied"
        ],
        callableBySlotIds: []
      },
      {
        slotId: "policy_explanation",
        acceptedOutcomes: ["policy_explanation_available"],
        callableBySlotIds: ["complaint_resolution"]
      },
      {
        slotId: "compensation_decision",
        acceptedOutcomes: ["authorization_decision_available"],
        callableBySlotIds: ["complaint_resolution"]
      }
    ],
    routeProfiles: [
      {
        compositionRouteId: "request_policy_explanation",
        outcome: "policy_clarification_required",
        priority: 10,
        effect: {
          type: "invoke_slot",
          targetSlotId: "policy_explanation",
          returnToSlotId: "complaint_resolution"
        }
      },
      {
        compositionRouteId: "return_policy_explanation",
        outcome: "policy_explanation_available",
        priority: 20,
        effect: { type: "resume_caller" }
      },
      {
        compositionRouteId: "request_compensation_decision",
        outcome: "compensation_approval_required",
        priority: 30,
        effect: {
          type: "invoke_slot",
          targetSlotId: "compensation_decision",
          returnToSlotId: "complaint_resolution"
        }
      },
      {
        compositionRouteId: "return_compensation_decision",
        outcome: "authorization_decision_available",
        priority: 40,
        effect: { type: "resume_caller" }
      },
      {
        compositionRouteId: "handoff_when_required",
        outcome: "human_review_required",
        priority: 50,
        effect: {
          type: "request_handoff",
          terminalId: "$human_handoff"
        }
      },
      {
        compositionRouteId: "complete_from_primary",
        outcome: "primary_acceptance_satisfied",
        priority: 60,
        effect: { type: "terminate", terminalId: "$scenario_done" }
      }
    ],
    terminalProfiles: structuredClone(DEFAULT_SCENARIO_TERMINALS) as ScenarioOrchestratorCompileProfile["terminalProfiles"],
    publicExposure: publicExposure()
  };

export const ECOMMERCE_REFUND_ORCHESTRATOR_PROFILE: ScenarioOrchestratorCompileProfile =
  {
    profileId: "ecommerce-refund-orchestrator-profile",
    compositionId: "ecommerce-refund-composition-demo",
    version: "0.1.0",
    slotProfiles: [
      {
        slotId: "refund_resolution",
        acceptedOutcomes: [
          "authorization_required",
          "human_review_required",
          "primary_acceptance_satisfied"
        ],
        callableBySlotIds: []
      },
      {
        slotId: "refund_authorization",
        acceptedOutcomes: ["authorization_decision_available"],
        callableBySlotIds: ["refund_resolution"]
      }
    ],
    routeProfiles: [
      {
        compositionRouteId: "request_refund_authorization",
        outcome: "authorization_required",
        priority: 10,
        effect: {
          type: "invoke_slot",
          targetSlotId: "refund_authorization",
          returnToSlotId: "refund_resolution"
        }
      },
      {
        compositionRouteId: "return_refund_authorization",
        outcome: "authorization_decision_available",
        priority: 20,
        effect: { type: "resume_caller" }
      },
      {
        compositionRouteId: "refund_handoff_required",
        outcome: "human_review_required",
        priority: 30,
        effect: {
          type: "request_handoff",
          terminalId: "$human_handoff"
        }
      },
      {
        compositionRouteId: "refund_complete",
        outcome: "primary_acceptance_satisfied",
        priority: 40,
        effect: { type: "terminate", terminalId: "$scenario_done" }
      }
    ],
    terminalProfiles: structuredClone(DEFAULT_SCENARIO_TERMINALS) as ScenarioOrchestratorCompileProfile["terminalProfiles"],
    publicExposure: publicExposure()
  };

export const BUILTIN_SCENARIO_ORCHESTRATOR_COMPILE_PROFILES = [
  CUSTOMER_COMPLAINT_ORCHESTRATOR_PROFILE,
  ECOMMERCE_REFUND_ORCHESTRATOR_PROFILE
] as const;

export function getBuiltinScenarioOrchestratorCompileProfile(
  compositionId: string
): ScenarioOrchestratorCompileProfile | undefined {
  const profile = BUILTIN_SCENARIO_ORCHESTRATOR_COMPILE_PROFILES.find(
    (candidate) => candidate.compositionId === compositionId
  );
  return profile ? structuredClone(profile) : undefined;
}
