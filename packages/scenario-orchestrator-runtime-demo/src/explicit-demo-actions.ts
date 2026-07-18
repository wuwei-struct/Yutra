import type {
  ActionHandler,
  ActionHandlerResult,
  ActionRegistry,
  RuntimeRunContext
} from "@yutra/runtime";
import type { ScenarioSideEffectLevel } from "@yutra/scenario-orchestrator-runtime-contract";

export type DemoSlotOutputEnvelope = {
  slotResult: {
    semanticMarker: string;
    controlSignal?: "handoff_required" | "fail_closed";
  };
  payload?: unknown;
};

function value<T>(ctx: RuntimeRunContext, key: string, fallback: T): T {
  return Object.prototype.hasOwnProperty.call(ctx.context, key)
    ? (ctx.context[key] as T)
    : fallback;
}

function supporting(ctx: RuntimeRunContext): Record<string, unknown> {
  const candidate = ctx.context.supporting;
  return candidate && typeof candidate === "object" && !Array.isArray(candidate)
    ? (candidate as Record<string, unknown>)
    : {};
}

function success(
  contextPatch: Record<string, unknown>,
  metadata: Record<string, unknown> = {}
): ActionHandlerResult {
  return {
    ok: true,
    output: contextPatch,
    contextPatch,
    meta: {
      mode: "deterministic_fixture",
      networkAccess: false,
      externalEffectsOccurred: false,
      ...metadata
    }
  };
}

function handler(
  run: (ctx: RuntimeRunContext) => Record<string, unknown>
): ActionHandler {
  return async (ctx) => success(run(ctx));
}

function controlHandler(
  signal: "handoff_required" | "fail_closed",
  marker: string
): ActionHandler {
  return async () =>
    success(
      {
        slotResult: {
          semanticMarker: marker,
          controlSignal: signal
        }
      },
      { controlSignalOnly: true }
    );
}

function primaryMarker(ctx: RuntimeRunContext): string {
  const supportingResults = supporting(ctx);
  if (
    supportingResults.policyExplanation !== undefined ||
    supportingResults.compensationDecision !== undefined ||
    supportingResults.authorizationDecision !== undefined
  ) {
    return "primary_acceptance_satisfied";
  }
  const demoPath = value<string>(ctx, "demoPath", "complete");
  if (demoPath === "policy_explanation") return "policy_clarification_required";
  if (demoPath === "compensation") return "compensation_approval_required";
  if (demoPath === "authorization") return "authorization_required";
  return "primary_acceptance_satisfied";
}

export const EXPLICIT_DEMO_ACTION_REGISTRY: ActionRegistry = {
  ask_missing_info: handler(() => ({ missing_required_info: false })),
  classify_request: handler((ctx) => ({
    request_type: value(ctx, "request_type", "demo_request"),
    missing_required_info: value(ctx, "missing_required_info", false)
  })),
  escalate_human: controlHandler("handoff_required", "human_review_required"),
  evaluate_policy: handler((ctx) => ({
    high_risk: value(ctx, "high_risk", false),
    rule_conflict: value(ctx, "rule_conflict", false),
    requires_handoff: value(ctx, "requires_handoff", false)
  })),
  execute_resolution: handler(() => ({
    resolution_status: "demo_completed",
    api_failed: false,
    external_side_effect_executed: false
  })),
  lookup_order: handler((ctx) => ({
    order_found: value(ctx, "order_found", true),
    api_failed: value(ctx, "api_failed", false)
  })),
  notify_result: handler((ctx) => ({
    notification_mode: "demo_mock",
    slotResult: { semanticMarker: primaryMarker(ctx) }
  })),

  ask_clarifying_question: handler(() => ({
    clarification_needed: true,
    answer_mode: "clarification"
  })),
  check_source_policy: handler((ctx) => ({
    source_verified: value(ctx, "source_verified", true)
  })),
  classify_question_intent: handler((ctx) => ({
    question_intent: "knowledge_question",
    sensitive_question: value(ctx, "sensitive_question", false)
  })),
  collect_question_context: handler(() => ({
    question_id: "DEMO-KNOWLEDGE-QUESTION"
  })),
  evaluate_answer_confidence: handler((ctx) => ({
    confidence_score: value(ctx, "confidence_score", 0.91)
  })),
  render_answer_with_sources: handler(() => ({
    answer_mode: "demo_mock",
    contains_real_knowledge: false,
    slotResult: { semanticMarker: "policy_explanation_available" },
    result: { sourceConstrainedExplanation: "demo_policy_explanation" }
  })),
  render_no_answer_response: controlHandler("fail_closed", "fail_closed"),
  retrieve_demo_knowledge: handler((ctx) => ({
    knowledge_hit: value(ctx, "knowledge_hit", true),
    demo_source_count: value(ctx, "demo_source_count", 2),
    contains_real_knowledge: false
  })),

  collect_evidence: handler(() => ({ evidence_collected: true })),
  collect_request_info: handler((ctx) => ({
    request_id: "DEMO-APPROVAL-REQUEST",
    amount: value(ctx, "amount", 100)
  })),
  create_approval_record: handler(() => ({
    approval_record_mode: "demo_mock",
    external_side_effect_executed: false
  })),
  create_rejection_record: handler(() => ({
    rejection_record_mode: "demo_mock",
    external_side_effect_executed: false
  })),
  evaluate_approval_policy: handler((ctx) => {
    const highRisk = value(ctx, "high_risk", false);
    return {
      high_risk: highRisk,
      policy_conflict: value(ctx, "policy_conflict", false),
      decision_reason_required: value(ctx, "decision_reason_required", false),
      low_risk: value(ctx, "low_risk", !highRisk)
    };
  }),
  request_human_review: controlHandler("handoff_required", "human_review_required"),
  send_decision_message: handler(() => ({
    decision_message_mode: "demo_mock",
    slotResult: { semanticMarker: "authorization_decision_available" },
    result: { authorizationDecision: "demo_authorized" }
  })),
  validate_required_evidence: handler((ctx) => ({
    missing_evidence: value(ctx, "missing_evidence", false),
    evidence_valid: value(ctx, "evidence_valid", true)
  }))
};

export const EXPLICIT_DEMO_SIDE_EFFECT_LEVELS: Readonly<
  Record<string, ScenarioSideEffectLevel>
> = Object.freeze({
  ask_missing_info: "none",
  classify_request: "none",
  escalate_human: "none",
  evaluate_policy: "none",
  execute_resolution: "read",
  lookup_order: "read",
  notify_result: "none",
  ask_clarifying_question: "none",
  check_source_policy: "read",
  classify_question_intent: "read",
  collect_question_context: "read",
  evaluate_answer_confidence: "none",
  render_answer_with_sources: "none",
  render_no_answer_response: "none",
  retrieve_demo_knowledge: "read",
  collect_evidence: "none",
  collect_request_info: "none",
  create_approval_record: "none",
  create_rejection_record: "none",
  evaluate_approval_policy: "none",
  request_human_review: "none",
  send_decision_message: "none",
  validate_required_evidence: "none"
});

export function resolveExplicitDemoSideEffect(
  actionId: string
): ScenarioSideEffectLevel | undefined {
  return EXPLICIT_DEMO_SIDE_EFFECT_LEVELS[actionId];
}
