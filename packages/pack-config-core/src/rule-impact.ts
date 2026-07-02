export type RuleImpactTargetKind =
  | "guard"
  | "action"
  | "transition"
  | "policy"
  | "template"
  | "test_case"
  | "trace_expectation"
  | "adapter_config";

export type RuleImpactTarget = {
  kind: RuleImpactTargetKind;
  id: string;
  label: {
    en: string;
    zhCN: string;
  };
  description?: {
    en?: string;
    zhCN?: string;
  };
};

export type RuleImpactArtifact =
  | "agent.yutra.yaml"
  | "policy.yaml"
  | "adapter.config.json"
  | "templates.json"
  | "test-cases.json"
  | "trace.expectation.json";

export type RuleImpactDefinition = {
  fieldPath: string;
  label: {
    en: string;
    zhCN: string;
  };
  summary: {
    en: string;
    zhCN: string;
  };
  affects: RuleImpactTarget[];
  artifacts: RuleImpactArtifact[];
  safetyNotes?: {
    en?: string[];
    zhCN?: string[];
  };
};

type Locale = "en" | "zh-CN";

function target(
  kind: RuleImpactTargetKind,
  id: string,
  en: string,
  zhCN: string,
  description?: { en?: string; zhCN?: string }
): RuleImpactTarget {
  return { kind, id, label: { en, zhCN }, description };
}

function impact(definition: RuleImpactDefinition): RuleImpactDefinition {
  return definition;
}

const failClosedNotes = {
  en: ["Unsafe or ambiguous outcomes should route to handoff or fail-closed behavior in this public demo metadata."],
  zhCN: ["不安全或不明确的结果应进入人工处理或 fail-closed 路径；这里仅定义公开 demo 级解释元数据。"]
};

export const REQUEST_RESOLUTION_RULE_IMPACTS: RuleImpactDefinition[] = [
  impact({
    fieldPath: "capabilities.orderLookup",
    label: { en: "Order lookup", zhCN: "订单查询" },
    summary: {
      en: "Enables the order lookup action and the order-found guard path.",
      zhCN: "启用订单查询动作，并影响订单是否存在的 Guard 路径。"
    },
    affects: [
      target("action", "lookup_order", "Lookup order", "查询订单"),
      target("guard", "order_found", "Order found check", "订单存在检查"),
      target("transition", "check_order -> handoff", "Order missing fallback", "订单缺失转人工路径"),
      target("test_case", "missing order id", "Missing order test", "订单缺失测试"),
      target("trace_expectation", "transition.resolved", "Transition evidence", "转移证据")
    ],
    artifacts: ["agent.yutra.yaml", "adapter.config.json", "test-cases.json", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "capabilities.shippingLookup",
    label: { en: "Shipping lookup", zhCN: "物流查询" },
    summary: {
      en: "Adds shipping lookup as a read-only capability for request resolution.",
      zhCN: "将物流查询作为只读能力加入请求处理流程。"
    },
    affects: [
      target("action", "check_shipping", "Check shipping", "查询物流"),
      target("adapter_config", "shipping-adapter", "Shipping adapter contract", "物流 adapter contract"),
      target("test_case", "shipping lookup normal path", "Shipping normal path", "物流正常路径测试")
    ],
    artifacts: ["agent.yutra.yaml", "adapter.config.json", "test-cases.json"]
  }),
  impact({
    fieldPath: "capabilities.refundRequest",
    label: { en: "Refund request", zhCN: "退款申请" },
    summary: {
      en: "Enables refund preparation actions guarded by policy and handoff checks.",
      zhCN: "启用受策略与人工转接检查保护的退款准备动作。"
    },
    affects: [
      target("action", "prepare_refund_request", "Prepare refund request", "准备退款申请"),
      target("policy", "refund policy", "Refund policy", "退款策略"),
      target("guard", "high_value_refund", "High-value refund guard", "高金额退款 Guard"),
      target("trace_expectation", "handoff.requested", "Handoff trace expectation", "人工转接 trace 预期")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "test-cases.json", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "capabilities.returnRequest",
    label: { en: "Return request", zhCN: "退货申请" },
    summary: {
      en: "Enables return request preparation for paths that require return before refund.",
      zhCN: "启用退货申请准备，用于需要先退货再处理退款的路径。"
    },
    affects: [
      target("action", "prepare_return_request", "Prepare return request", "准备退货申请"),
      target("transition", "evaluate_rules -> execute_resolution", "Return-first resolution path", "先退货处理路径"),
      target("template", "request_received", "Request received template", "请求受理模板")
    ],
    artifacts: ["agent.yutra.yaml", "templates.json", "test-cases.json"]
  }),
  impact({
    fieldPath: "capabilities.handoff",
    label: { en: "Human handoff", zhCN: "人工转接" },
    summary: {
      en: "Enables the fail-closed handoff state used by high-risk, missing, or conflicting paths.",
      zhCN: "启用高风险、缺失信息或规则冲突路径使用的 fail-closed 人工转接状态。"
    },
    affects: [
      target("action", "escalate_human", "Escalate to human", "转人工"),
      target("transition", "evaluate_rules -> handoff", "Policy handoff transition", "策略转人工路径"),
      target("template", "handoff_required", "Handoff required template", "需要人工处理模板"),
      target("trace_expectation", "handoff.requested", "Handoff event", "人工转接事件")
    ],
    artifacts: ["agent.yutra.yaml", "templates.json", "test-cases.json", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.refundPolicy.autoRefundWhenNotShipped",
    label: { en: "Auto refund when not shipped", zhCN: "未发货自动退款" },
    summary: {
      en: "Controls whether a not-shipped refund can proceed through the normal resolution path.",
      zhCN: "控制未发货退款是否可进入普通处理路径。"
    },
    affects: [
      target("guard", "not_shipped_refund_allowed", "Not-shipped refund guard", "未发货退款 Guard"),
      target("transition", "evaluate_rules -> execute_resolution", "Allowed refund transition", "允许退款路径"),
      target("policy", "refund before shipment", "Refund-before-shipment policy", "发货前退款策略"),
      target("test_case", "refund before shipment", "Refund before shipment test", "发货前退款测试")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "test-cases.json"]
  }),
  impact({
    fieldPath: "rules.refundPolicy.autoRefundMaxAmount",
    label: { en: "Auto refund max amount", zhCN: "自动退款金额上限" },
    summary: {
      en: "Determines whether a refund amount exceeds the automatic handling threshold.",
      zhCN: "用于判断退款金额是否超过自动处理阈值。"
    },
    affects: [
      target("guard", "high_value_refund", "High-value refund guard", "高金额退款 Guard"),
      target("transition", "evaluate_rules -> handoff", "High-value handoff transition", "高金额转人工路径"),
      target("policy", "refund amount threshold", "Refund amount threshold", "退款金额阈值"),
      target("test_case", "high-value refund handoff", "High-value refund handoff", "高金额退款转人工测试"),
      target("trace_expectation", "handoff.requested", "Handoff trace expectation", "人工转接 trace 预期")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "test-cases.json", "trace.expectation.json"],
    safetyNotes: {
      en: ["Amounts above the threshold should route to human review or fail-closed behavior, not automatic high-risk action."],
      zhCN: ["超过阈值时应进入人工处理或 fail-closed 路径，不应自动执行高风险动作。"]
    }
  }),
  impact({
    fieldPath: "rules.refundPolicy.shippedOrderStrategy",
    label: { en: "Shipped order strategy", zhCN: "已发货订单策略" },
    summary: {
      en: "Controls whether shipped orders require return-first, handoff, or a policy rejection template.",
      zhCN: "控制已发货订单走先退货、转人工或策略拒绝模板。"
    },
    affects: [
      target("guard", "order_shipped", "Order shipped guard", "已发货 Guard"),
      target("transition", "evaluate_rules -> handoff", "Shipped order handoff", "已发货转人工"),
      target("template", "policy_rejected", "Policy rejected template", "策略拒绝模板"),
      target("test_case", "shipped order strategy", "Shipped order strategy test", "已发货策略测试")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "templates.json", "test-cases.json"]
  }),
  impact({
    fieldPath: "rules.refundPolicy.expiredAfterSaleStrategy",
    label: { en: "Expired after-sale strategy", zhCN: "售后期过期策略" },
    summary: {
      en: "Controls the path when the request is outside the configured support window.",
      zhCN: "控制请求超出支持窗口时的处理路径。"
    },
    affects: [
      target("guard", "after_sale_expired", "After-sale expired guard", "售后期过期 Guard"),
      target("transition", "evaluate_rules -> handoff", "Expired request fallback", "过期请求兜底路径"),
      target("template", "policy_rejected", "Policy rejected template", "策略拒绝模板")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "templates.json", "test-cases.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.refundPolicy.apiFailureStrategy",
    label: { en: "API failure strategy", zhCN: "接口失败策略" },
    summary: {
      en: "Defines fail-closed handling for upstream adapter failure in demo paths.",
      zhCN: "定义上游 adapter 失败时的 fail-closed 处理方式。"
    },
    affects: [
      target("guard", "api_failed", "API failure guard", "接口失败 Guard"),
      target("transition", "check_order -> handoff", "API failure fallback", "接口失败兜底路径"),
      target("policy", "retry / handoff strategy", "Retry or handoff policy", "重试或转人工策略"),
      target("test_case", "api failure fail-closed", "API failure fail-closed test", "接口失败 fail-closed 测试"),
      target("trace_expectation", "action.failed + handoff.requested", "Failure and handoff trace", "失败与转人工 trace")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "test-cases.json", "trace.expectation.json"],
    safetyNotes: {
      en: ["Adapter failure should not continue as if data were valid; use retry, handoff, or fail-closed error behavior."],
      zhCN: ["Adapter 失败时不应当作数据有效继续执行；应使用重试、转人工或 fail-closed 错误路径。"]
    }
  }),
  impact({
    fieldPath: "rules.handoffPolicy.highValueRefund",
    label: { en: "Handoff high-value refund", zhCN: "高金额退款转人工" },
    summary: {
      en: "Controls whether high-value refund paths require human handling.",
      zhCN: "控制高金额退款路径是否必须人工处理。"
    },
    affects: [
      target("guard", "high_value_refund", "High-value refund guard", "高金额退款 Guard"),
      target("transition", "evaluate_rules -> handoff", "High-value handoff transition", "高金额转人工路径"),
      target("trace_expectation", "handoff.requested", "Handoff trace expectation", "人工转接 trace 预期")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.handoffPolicy.complaint",
    label: { en: "Handoff complaint", zhCN: "投诉转人工" },
    summary: {
      en: "Routes complaint-like requests to human support in the public demo model.",
      zhCN: "在公开 demo 模型中，将投诉类请求路由到人工支持。"
    },
    affects: [
      target("guard", "complaint_detected", "Complaint guard", "投诉 Guard"),
      target("transition", "classify_request -> handoff", "Complaint handoff transition", "投诉转人工路径"),
      target("template", "handoff_required", "Handoff template", "转人工模板")
    ],
    artifacts: ["agent.yutra.yaml", "templates.json", "trace.expectation.json"]
  }),
  impact({
    fieldPath: "rules.handoffPolicy.orderNotFound",
    label: { en: "Handoff when order not found", zhCN: "订单未找到转人工" },
    summary: {
      en: "Controls fallback when order lookup cannot find the business object.",
      zhCN: "控制订单查询找不到业务对象时的兜底路径。"
    },
    affects: [
      target("guard", "order_found", "Order found guard", "订单存在 Guard"),
      target("transition", "check_order -> handoff", "Order missing handoff", "订单缺失转人工"),
      target("test_case", "missing order id", "Missing order test", "订单缺失测试")
    ],
    artifacts: ["agent.yutra.yaml", "test-cases.json", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.handoffPolicy.ruleConflict",
    label: { en: "Handoff rule conflict", zhCN: "规则冲突转人工" },
    summary: {
      en: "Routes conflicting policy results to a fail-closed handoff path.",
      zhCN: "将冲突的策略判断路由到 fail-closed 人工处理路径。"
    },
    affects: [
      target("guard", "rule_conflict", "Rule conflict guard", "规则冲突 Guard"),
      target("transition", "evaluate_rules -> handoff", "Conflict handoff transition", "冲突转人工路径"),
      target("trace_expectation", "handoff.requested", "Handoff trace expectation", "人工转接 trace 预期")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.handoffPolicy.maxUserRetryCount",
    label: { en: "Max user retry count", zhCN: "最大用户重试次数" },
    summary: {
      en: "Controls how many clarification attempts are allowed before fallback.",
      zhCN: "控制在进入兜底前允许多少次补充信息尝试。"
    },
    affects: [
      target("guard", "retry_limit_reached", "Retry limit guard", "重试次数 Guard"),
      target("transition", "collect_required_info -> handoff", "Retry limit fallback", "重试超限兜底"),
      target("template", "ask_missing_info", "Missing info template", "补充信息模板")
    ],
    artifacts: ["agent.yutra.yaml", "templates.json", "test-cases.json"]
  }),
  impact({
    fieldPath: "rules.responseStyle.tone",
    label: { en: "Response tone", zhCN: "回复语气" },
    summary: {
      en: "Changes the generic demo response tone only.",
      zhCN: "仅影响通用 demo 回复语气。"
    },
    affects: [target("template", "response tone", "Response tone", "回复语气")],
    artifacts: ["templates.json"]
  }),
  impact({
    fieldPath: "rules.responseStyle.includeReason",
    label: { en: "Include reason", zhCN: "包含原因说明" },
    summary: {
      en: "Controls whether generic demo templates include a reason explanation.",
      zhCN: "控制通用 demo 模板是否包含原因说明。"
    },
    affects: [target("template", "reason copy", "Reason copy", "原因说明文案")],
    artifacts: ["templates.json"]
  }),
  impact({
    fieldPath: "rules.responseStyle.includeHumanSupportEntry",
    label: { en: "Include human support entry", zhCN: "包含人工入口" },
    summary: {
      en: "Controls whether handoff-oriented templates mention human support entry.",
      zhCN: "控制转人工相关模板是否包含人工支持入口。"
    },
    affects: [
      target("template", "handoff_required", "Handoff required template", "需要人工处理模板"),
      target("trace_expectation", "handoff.requested", "Handoff trace expectation", "人工转接 trace 预期")
    ],
    artifacts: ["templates.json", "trace.expectation.json"]
  })
];

export const APPROVAL_DECISION_RULE_IMPACTS: RuleImpactDefinition[] = [
  impact({
    fieldPath: "rules.approvalPolicy.lowRiskMaxAmount",
    label: { en: "Low-risk max amount", zhCN: "低风险金额上限" },
    summary: {
      en: "Determines whether a demo approval request can follow the low-risk automatic decision path.",
      zhCN: "用于判断演示审批请求是否可进入低风险自动决策路径。"
    },
    affects: [
      target("guard", "low_risk_auto_approval", "Low-risk auto approval guard", "低风险自动审批 Guard"),
      target("guard", "high_value_review_required", "High-value review guard", "高金额复核 Guard"),
      target("transition", "evaluate_policy -> auto_approved / human_review", "Approval or review transition", "通过或人工复核路径"),
      target("policy", "approval threshold", "Approval threshold policy", "审批阈值策略"),
      target("test_case", "high-value approval requires review", "High-value approval review test", "高金额审批复核测试"),
      target("trace_expectation", "guard.evaluated + handoff.requested", "Guard and handoff evidence", "Guard 与人工转接证据")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "test-cases.json", "trace.expectation.json"],
    safetyNotes: {
      en: ["Amounts above the demo threshold should route to human review or fail-closed handling, not automatic approval."],
      zhCN: ["超过演示阈值时应进入人工复核或 fail-closed 路径，不应自动通过。"]
    }
  }),
  impact({
    fieldPath: "rules.approvalPolicy.missingEvidenceStrategy",
    label: { en: "Missing evidence strategy", zhCN: "材料缺失策略" },
    summary: {
      en: "Controls whether missing evidence asks for more information, routes to handoff, or rejects with a generic reason.",
      zhCN: "控制材料缺失时请求补充、转人工，或按通用原因拒绝。"
    },
    affects: [
      target("transition", "collect_evidence -> ask_more_info / handoff / rejected", "Missing evidence transition", "材料缺失路径"),
      target("template", "ask_missing_evidence", "Missing evidence response", "材料缺失回复"),
      target("test_case", "missing evidence path", "Missing evidence test", "材料缺失测试"),
      target("trace_expectation", "state.entered collect_evidence / transition.resolved", "Evidence state trace", "材料状态 trace")
    ],
    artifacts: ["agent.yutra.yaml", "templates.json", "test-cases.json", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.approvalPolicy.highRiskStrategy",
    label: { en: "High-risk strategy", zhCN: "高风险策略" },
    summary: {
      en: "Controls how high-risk demo approval requests route to human review, handoff, or generic rejection.",
      zhCN: "控制高风险演示审批请求进入人工复核、转人工或通用拒绝路径。"
    },
    affects: [
      target("guard", "high_risk_request", "High-risk request guard", "高风险请求 Guard"),
      target("transition", "evaluate_policy -> human_review / rejected", "High-risk routing", "高风险路由"),
      target("policy", "high risk approval handling", "High-risk handling policy", "高风险处理策略"),
      target("test_case", "high-risk handoff", "High-risk handoff test", "高风险转人工测试"),
      target("trace_expectation", "handoff.requested", "Handoff trace expectation", "人工转接 trace 预期")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "test-cases.json", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.approvalPolicy.policyConflictStrategy",
    label: { en: "Policy conflict strategy", zhCN: "规则冲突策略" },
    summary: {
      en: "Routes conflicting policy results to handoff or fail-closed behavior in the public demo compiler.",
      zhCN: "在公开 demo 编译器中，将冲突的策略结果路由到转人工或 fail-closed 路径。"
    },
    affects: [
      target("guard", "policy_conflict", "Policy conflict guard", "规则冲突 Guard"),
      target("transition", "evaluate_policy -> handoff / fail_closed", "Conflict fallback transition", "冲突兜底路径"),
      target("policy", "policy conflict handling", "Conflict handling policy", "冲突处理策略"),
      target("trace_expectation", "fail-closed marker", "Fail-closed trace marker", "fail-closed trace 标记")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.riskPolicy.requireReasonForRejection",
    label: { en: "Require rejection reason", zhCN: "拒绝时要求说明原因" },
    summary: {
      en: "Controls whether generic rejection templates and tests require a decision reason.",
      zhCN: "控制通用拒绝模板与测试是否要求决策原因。"
    },
    affects: [
      target("template", "approval_rejected", "Rejection reason template", "拒绝原因模板"),
      target("policy", "decision explanation requirement", "Decision explanation requirement", "决策解释要求"),
      target("test_case", "rejection includes reason", "Rejection reason test", "拒绝原因测试")
    ],
    artifacts: ["policy.yaml", "templates.json", "test-cases.json"]
  }),
  impact({
    fieldPath: "rules.responseStyle.tone",
    label: { en: "Response tone", zhCN: "回复语气" },
    summary: {
      en: "Changes only the generic demo approval template tone.",
      zhCN: "仅影响通用 demo 审批模板语气。"
    },
    affects: [target("template", "approval response tone", "Approval response tone", "审批回复语气")],
    artifacts: ["templates.json"]
  })
];

export const KNOWLEDGE_ANSWERING_RULE_IMPACTS: RuleImpactDefinition[] = [
  impact({
    fieldPath: "rules.knowledgePolicy.minConfidence",
    label: { en: "Minimum confidence", zhCN: "最低置信度" },
    summary: {
      en: "Defines the confidence threshold for returning a governed demo answer.",
      zhCN: "定义返回受治理 demo 回答的置信度阈值。"
    },
    affects: [
      target("guard", "confidence_threshold", "Confidence threshold guard", "置信度阈值 Guard"),
      target(
        "transition",
        "evaluate_confidence -> answer / ask_clarification / handoff",
        "Confidence decision transition",
        "置信度决策转移"
      ),
      target("policy", "minimum confidence threshold", "Minimum confidence threshold", "最低置信度阈值"),
      target("test_case", "low-confidence question path", "Low-confidence question path", "低置信度问题路径"),
      target("trace_expectation", "guard.evaluated", "Confidence guard trace", "置信度 Guard trace"),
      target("trace_expectation", "clarification.requested", "Clarification trace", "澄清请求 trace")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "test-cases.json", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.knowledgePolicy.lowConfidenceStrategy",
    label: { en: "Low confidence strategy", zhCN: "低置信度策略" },
    summary: {
      en: "Controls the fail-closed path when answer confidence is below the demo threshold.",
      zhCN: "控制回答置信度低于 demo 阈值时的 fail-closed 路径。"
    },
    affects: [
      target(
        "transition",
        "evaluate_confidence -> ask_clarification / handoff / no_answer",
        "Low confidence fallback",
        "低置信度兜底"
      ),
      target("template", "low_confidence_clarification", "Low confidence response", "低置信度回复"),
      target("test_case", "low confidence fallback", "Low confidence fallback test", "低置信度兜底测试"),
      target("trace_expectation", "transition.resolved", "Transition trace", "转移 trace")
    ],
    artifacts: ["agent.yutra.yaml", "templates.json", "test-cases.json", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.knowledgePolicy.noAnswerStrategy",
    label: { en: "No answer strategy", zhCN: "无答案策略" },
    summary: {
      en: "Controls the governed path when demo retrieval cannot support an answer.",
      zhCN: "控制 demo 检索无法支撑回答时的受治理路径。"
    },
    affects: [
      target(
        "transition",
        "retrieve_knowledge -> ask_clarification / handoff / no_answer",
        "No answer fallback",
        "无答案兜底"
      ),
      target("template", "no_answer_with_reason", "No answer response", "无答案回复"),
      target("trace_expectation", "fail_closed.no_answer", "Fail-closed no answer marker", "无答案 fail-closed 标记")
    ],
    artifacts: ["agent.yutra.yaml", "templates.json", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.knowledgePolicy.sensitiveQuestionStrategy",
    label: { en: "Sensitive question strategy", zhCN: "敏感问题策略" },
    summary: {
      en: "Controls the policy boundary for sensitive or unsafe questions.",
      zhCN: "控制敏感或不安全问题的策略边界。"
    },
    affects: [
      target("guard", "sensitive_question", "Sensitive question guard", "敏感问题 Guard"),
      target(
        "transition",
        "evaluate_policy -> handoff / no_answer / safe_answer",
        "Sensitive question policy path",
        "敏感问题策略路径"
      ),
      target("policy", "sensitive content boundary", "Sensitive content boundary", "敏感内容边界"),
      target("trace_expectation", "guard.evaluated", "Sensitive guard trace", "敏感 Guard trace")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "trace.expectation.json"],
    safetyNotes: failClosedNotes
  }),
  impact({
    fieldPath: "rules.sourcePolicy.requireSourceCitation",
    label: { en: "Require source citation", zhCN: "要求来源引用" },
    summary: {
      en: "Requires source citation metadata before a governed demo answer is rendered.",
      zhCN: "要求在渲染受治理 demo 回答前具备来源引用元数据。"
    },
    affects: [
      target("template", "source citation", "Source citation template", "来源引用模板"),
      target("policy", "citation requirement", "Citation requirement", "引用要求"),
      target("test_case", "answer includes source reference", "Source reference test", "来源引用测试"),
      target("trace_expectation", "source.checked", "Source checked trace", "来源检查 trace"),
      target("trace_expectation", "evidence.attached", "Evidence attached trace", "证据附加 trace")
    ],
    artifacts: ["policy.yaml", "templates.json", "test-cases.json", "trace.expectation.json"]
  }),
  impact({
    fieldPath: "rules.sourcePolicy.allowUnverifiedAnswer",
    label: { en: "Allow unverified answer", zhCN: "允许未验证回答" },
    summary: {
      en: "Controls whether answers without verified demo sources are blocked or marked uncertain.",
      zhCN: "控制没有验证 demo 来源的回答是被阻断还是标记为不确定。"
    },
    affects: [
      target("guard", "source_verification", "Source verification guard", "来源验证 Guard"),
      target("policy", "unverified answer boundary", "Unverified answer boundary", "未验证回答边界"),
      target("trace_expectation", "guard.evaluated", "Source verification trace", "来源验证 trace")
    ],
    artifacts: ["agent.yutra.yaml", "policy.yaml", "trace.expectation.json"],
    safetyNotes: {
      en: ["Unverified answers should be blocked or clearly marked uncertain in governed settings."],
      zhCN: ["在受治理场景中，未验证回答应被阻断或明确标记为不确定。"]
    }
  }),
  impact({
    fieldPath: "rules.responseStyle.tone",
    label: { en: "Response tone", zhCN: "回答语气" },
    summary: {
      en: "Changes only the generic demo knowledge-answering template tone.",
      zhCN: "仅影响通用 demo 知识回答模板语气。"
    },
    affects: [target("template", "knowledge response tone", "Knowledge response tone", "知识回答语气")],
    artifacts: ["templates.json"]
  })
];

const ALL_RULE_IMPACTS = [
  ...KNOWLEDGE_ANSWERING_RULE_IMPACTS,
  ...REQUEST_RESOLUTION_RULE_IMPACTS,
  ...APPROVAL_DECISION_RULE_IMPACTS
];
const impactByPath = new Map(ALL_RULE_IMPACTS.map((definition) => [definition.fieldPath, definition]));

export function getRuleImpact(fieldPath: string): RuleImpactDefinition | undefined {
  return impactByPath.get(fieldPath);
}

export function listRuleImpacts(): RuleImpactDefinition[] {
  return [...ALL_RULE_IMPACTS];
}

export function explainRuleImpact(fieldPath: string, locale: Locale = "en"): string | undefined {
  const definition = getRuleImpact(fieldPath);
  if (!definition) {
    return undefined;
  }
  const key = locale === "zh-CN" ? "zhCN" : "en";
  const lines = [
    `${definition.label[key]}`,
    definition.summary[key],
    `Affects: ${definition.affects.map((targetItem) => `${targetItem.kind}:${targetItem.id}`).join(", ")}`,
    `Artifacts: ${definition.artifacts.join(", ")}`
  ];
  const notes = definition.safetyNotes?.[key];
  if (notes?.length) {
    lines.push(`Safety: ${notes.join(" ")}`);
  }
  return lines.join("\n");
}
