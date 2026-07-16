import type { ActionHandler, ActionHandlerResult, ActionRegistry, RuntimeRunContext } from "@yutra/runtime";

function hasContextValue(ctx: RuntimeRunContext, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(ctx.context, key);
}

function contextValue<T>(ctx: RuntimeRunContext, key: string, fallback: T): T {
  return hasContextValue(ctx, key) ? (ctx.context[key] as T) : fallback;
}

function demoSuccess(contextPatch: Record<string, unknown>, output = contextPatch): ActionHandlerResult {
  return {
    ok: true,
    output,
    contextPatch,
    meta: {
      mode: "demo_mock",
      networkAccess: false,
      containsRealEndpoint: false,
      containsSecret: false
    }
  };
}

function handler(run: (ctx: RuntimeRunContext) => ActionHandlerResult): ActionHandler {
  return async (ctx) => run(ctx);
}

const sharedDemoActions: ActionRegistry = {
  notify_result: handler(() => demoSuccess({ notification_mode: "demo_mock" })),
  escalate_human: handler(() =>
    demoSuccess({ requires_handoff: true, handoff_status: "demo_queued", external_side_effect_executed: false })
  )
};

const requestResolutionDemoActions: ActionRegistry = {
  classify_request: handler((ctx) =>
    demoSuccess({
      request_type: contextValue(ctx, "request_type", contextValue(ctx, "issue_type", "demo_request")),
      missing_required_info: contextValue(ctx, "missing_required_info", false)
    })
  ),
  ask_missing_info: handler((ctx) =>
    demoSuccess({
      missing_required_info: false,
      requires_handoff: contextValue(ctx, "requires_handoff", false)
    })
  ),
  lookup_order: handler((ctx) =>
    demoSuccess({
      order_found: contextValue(ctx, "order_found", true),
      api_failed: contextValue(ctx, "api_failed", false)
    })
  ),
  evaluate_policy: handler((ctx) =>
    demoSuccess({
      high_risk: contextValue(ctx, "high_risk", false),
      rule_conflict: contextValue(ctx, "rule_conflict", false),
      requires_handoff: contextValue(ctx, "requires_handoff", false),
      resolution_ready: true
    })
  ),
  execute_resolution: handler((ctx) =>
    demoSuccess({
      api_failed: contextValue(ctx, "api_failed", false),
      resolution_status: "demo_completed",
      external_side_effect_executed: false
    })
  ),
  check_shipping: handler(() => demoSuccess({ shipping_status: "demo_in_transit" })),
  prepare_refund_request: handler(() =>
    demoSuccess({ resolution_type: "demo_refund_request", external_side_effect_executed: false })
  ),
  prepare_return_request: handler(() =>
    demoSuccess({ resolution_type: "demo_return_request", external_side_effect_executed: false })
  )
};

const approvalDecisionDemoActions: ActionRegistry = {
  collect_request_info: handler((ctx) =>
    demoSuccess({
      request_id: contextValue(ctx, "request_id", "DEMO-APPROVAL-REQUEST"),
      amount: contextValue(ctx, "amount", 100)
    })
  ),
  collect_evidence: handler(() => demoSuccess({ evidence_collected: true })),
  validate_required_evidence: handler((ctx) =>
    demoSuccess({
      missing_evidence: contextValue(ctx, "missing_evidence", false),
      evidence_valid: contextValue(ctx, "evidence_valid", true)
    })
  ),
  evaluate_approval_policy: handler((ctx) => {
    const highRisk = contextValue(ctx, "high_risk", false);
    const amount = contextValue(ctx, "amount", 100);
    return demoSuccess({
      high_risk: highRisk,
      policy_conflict: contextValue(ctx, "policy_conflict", false),
      decision_reason_required: contextValue(ctx, "decision_reason_required", false),
      low_risk: contextValue(ctx, "low_risk", !highRisk && amount <= 300)
    });
  }),
  create_approval_record: handler(() =>
    demoSuccess({ approval_record_mode: "demo_mock", external_side_effect_executed: false })
  ),
  create_rejection_record: handler(() =>
    demoSuccess({ rejection_record_mode: "demo_mock", external_side_effect_executed: false })
  ),
  request_human_review: handler(() =>
    demoSuccess({ requires_human_review: true, review_queue_mode: "demo_mock", external_side_effect_executed: false })
  ),
  send_decision_message: handler(() => demoSuccess({ decision_message_mode: "demo_mock" }))
};

export const knowledgeAnsweringDemoActions: ActionRegistry = {
  classify_question_intent: handler((ctx) =>
    demoSuccess({
      question_intent: "knowledge_question",
      sensitive_question: contextValue(ctx, "sensitive_question", false)
    })
  ),
  collect_question_context: handler((ctx) =>
    demoSuccess({
      question_id: contextValue(ctx, "question_id", "DEMO-KNOWLEDGE-QUESTION"),
      question_text: contextValue(ctx, "question_text", ctx.input.text ?? "demo governed question")
    })
  ),
  retrieve_demo_knowledge: handler((ctx) =>
    demoSuccess({
      knowledge_hit: contextValue(ctx, "knowledge_hit", true),
      demo_source_count: contextValue(ctx, "demo_source_count", 2),
      demo_source_labels: ["demo-source-a", "demo-source-b"],
      contains_real_knowledge: false
    })
  ),
  evaluate_answer_confidence: handler((ctx) =>
    demoSuccess({ confidence_score: contextValue(ctx, "confidence_score", 0.91) })
  ),
  check_source_policy: handler((ctx) =>
    demoSuccess({
      source_verified: contextValue(ctx, "source_verified", true),
      source_policy_satisfied: true
    })
  ),
  render_answer_with_sources: handler(() =>
    demoSuccess(
      {
        answer_mode: "demo_mock",
        contains_real_knowledge: false,
        external_side_effect_executed: false
      },
      {
        answerMode: "demo_mock",
        sourceLabels: ["demo-source-a", "demo-source-b"],
        containsRealKnowledge: false
      }
    )
  ),
  ask_clarifying_question: handler(() =>
    demoSuccess({ clarification_needed: true, answer_mode: "clarification", external_side_effect_executed: false })
  ),
  render_no_answer_response: handler(() =>
    demoSuccess({ answer_mode: "no_answer", fail_closed: true, external_side_effect_executed: false })
  )
};

export const creatorDemoActionRegistry: ActionRegistry = {
  ...sharedDemoActions,
  ...requestResolutionDemoActions,
  ...approvalDecisionDemoActions,
  ...knowledgeAnsweringDemoActions
};
