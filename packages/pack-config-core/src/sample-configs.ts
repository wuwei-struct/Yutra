import type { PackConfig } from "./pack-config-schema";
import { APPROVAL_DECISION_BASIC_CONFIG_ID, REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG_ID } from "./ids";

export const REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG: PackConfig = {
  packConfigId: REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG_ID,
  packConfigVersion: "0.1.0",
  archetypeId: "request-resolution",
  archetypeVersion: "0.1.0",
  variantId: "ecommerce-basic-demo",
  variantVersion: "0.1.0",
  locale: "en",
  capabilities: {
    orderLookup: { value: true, source: "confirmedByUser", required: true },
    shippingLookup: { value: true, source: "confirmedByUser" },
    refundRequest: { value: true, source: "confirmedByUser" },
    returnRequest: { value: true, source: "confirmedByUser" },
    handoff: { value: true, source: "confirmedByUser", required: true }
  },
  businessObjects: [
    { objectId: "order", label: { en: "Order", zhCN: "订单" }, fields: ["order_id", "status", "amount"] },
    { objectId: "request", label: { en: "Request", zhCN: "请求" }, fields: ["request_type", "reason"] }
  ],
  rules: {
    "refundPolicy.autoRefundWhenNotShipped": {
      value: true,
      source: "defaultFromPack",
      label: { en: "Auto refund when not shipped", zhCN: "未发货自动退款" }
    },
    "refundPolicy.autoRefundMaxAmount": {
      value: 300,
      source: "defaultFromPack",
      label: { en: "Demo auto refund max amount", zhCN: "演示自动退款金额上限" },
      description: { en: "Demo value only. Replace in private implementation.", zhCN: "仅演示值，私有实施时替换。" }
    },
    "refundPolicy.shippedOrderStrategy": { value: "require_return_first", source: "confirmedByUser" },
    "refundPolicy.expiredAfterSaleStrategy": { value: "ask_for_more_info", source: "confirmedByUser" },
    "refundPolicy.apiFailureStrategy": { value: "retry_then_handoff", source: "confirmedByUser" },
    "handoffPolicy.highValueRefund": { value: true, source: "confirmedByUser" },
    "handoffPolicy.complaint": { value: true, source: "confirmedByUser" },
    "handoffPolicy.orderNotFound": { value: true, source: "confirmedByUser" },
    "handoffPolicy.ruleConflict": { value: true, source: "confirmedByUser" },
    "handoffPolicy.maxUserRetryCount": { value: 2, source: "defaultFromPack" },
    "responseStyle.tone": { value: "warm_professional", source: "confirmedByUser" },
    "responseStyle.includeReason": { value: true, source: "confirmedByUser" },
    "responseStyle.includeHumanSupportEntry": { value: true, source: "confirmedByUser" }
  },
  policies: {
    "publish.requiresHumanReview": { value: true, source: "defaultFromPack" }
  },
  adapters: [
    {
      adapterId: "order-adapter",
      mode: "mock",
      contractRef: "contracts/order-contract.md",
      fieldMappings: { orderId: "order_id" },
      containsRealEndpoint: false,
      containsSecret: false
    },
    {
      adapterId: "escalation-adapter",
      mode: "mock",
      contractRef: "contracts/escalation-contract.md",
      fieldMappings: { reasonCode: "reason_code" },
      containsRealEndpoint: false,
      containsSecret: false
    }
  ],
  templates: [
    {
      templateId: "response.default.demo",
      purpose: "demo response",
      locale: "en",
      text: {
        value: "Demo response template. Replace with private brand-approved copy during implementation.",
        source: "defaultFromPack"
      }
    }
  ],
  tests: [
    {
      testCaseId: "happy-path-demo",
      title: "Happy path demo",
      input: { request_type: "demo_request", order_id: "DEMO-ORDER" },
      expectedPath: ["triage", "resolve", "respond"],
      expectedOutcome: "completed",
      tags: ["demo", "mock"]
    }
  ],
  governance: {
    environment: "demo",
    publishable: true,
    requiresHumanReview: true,
    unconfirmedFieldPolicy: "block_publish",
    missingFieldPolicy: "block_compile",
    sideEffectPolicy: {
      maxAutoSideEffect: "read",
      requiresPolicyGuardFrom: "write"
    }
  },
  metadata: {
    publicDemo: true,
    containsCustomerData: false
  }
};

export const APPROVAL_DECISION_BASIC_CONFIG: PackConfig = {
  packConfigId: APPROVAL_DECISION_BASIC_CONFIG_ID,
  packConfigVersion: "0.1.0",
  archetypeId: "approval-decision",
  archetypeVersion: "0.1.0",
  variantId: "approval-basic-demo",
  variantVersion: "0.1.0",
  locale: "en",
  capabilities: {
    requestIntake: { value: true, source: "confirmedByUser", required: true },
    evidenceCollection: { value: true, source: "confirmedByUser" },
    eligibilityCheck: { value: true, source: "confirmedByUser" },
    riskReview: { value: true, source: "confirmedByUser" },
    approvalDecision: { value: true, source: "confirmedByUser" },
    handoff: { value: true, source: "confirmedByUser", required: true }
  },
  businessObjects: [
    { objectId: "approval_request", label: { en: "Approval request", zhCN: "审批请求" }, fields: ["request_id", "amount", "risk_level"] },
    { objectId: "evidence", label: { en: "Evidence", zhCN: "证明材料" }, fields: ["evidence_id", "evidence_type", "is_complete"] }
  ],
  rules: {
    "approvalPolicy.autoApproveLowRisk": {
      value: true,
      source: "defaultFromPack",
      label: { en: "Demo low-risk auto approval", zhCN: "演示低风险自动通过" }
    },
    "approvalPolicy.lowRiskMaxAmount": {
      value: 300,
      source: "defaultFromPack",
      label: { en: "Demo low-risk max amount", zhCN: "演示低风险金额上限" },
      description: { en: "Demo value only. Replace in private implementation.", zhCN: "仅演示值，私有实施时替换。" }
    },
    "approvalPolicy.missingEvidenceStrategy": { value: "ask_for_more_info", source: "confirmedByUser" },
    "approvalPolicy.highRiskStrategy": { value: "require_human_approval", source: "confirmedByUser" },
    "approvalPolicy.policyConflictStrategy": { value: "handoff", source: "confirmedByUser" },
    "approvalPolicy.timeoutStrategy": { value: "remind_reviewer", source: "confirmedByUser" },
    "riskPolicy.requireHumanForHighRisk": { value: true, source: "confirmedByUser" },
    "riskPolicy.requireEvidenceBeforeDecision": { value: true, source: "confirmedByUser" },
    "riskPolicy.requireReasonForRejection": { value: true, source: "confirmedByUser" },
    "riskPolicy.maxUserRetryCount": { value: 2, source: "defaultFromPack" },
    "responseStyle.tone": { value: "neutral", source: "confirmedByUser" },
    "responseStyle.includeDecisionReason": { value: true, source: "confirmedByUser" },
    "responseStyle.includeNextSteps": { value: true, source: "confirmedByUser" },
    "responseStyle.includeHumanReviewEntry": { value: true, source: "confirmedByUser" }
  },
  policies: {
    "publish.requiresHumanReview": { value: true, source: "defaultFromPack" }
  },
  adapters: [
    {
      adapterId: "approval-record-adapter",
      mode: "mock",
      contractRef: "contracts/approval-record-demo-contract.md",
      fieldMappings: { requestId: "request_id", decisionStatus: "decision_status" },
      containsRealEndpoint: false,
      containsSecret: false
    },
    {
      adapterId: "reviewer-queue-adapter",
      mode: "mock",
      contractRef: "contracts/reviewer-queue-demo-contract.md",
      fieldMappings: { reviewReason: "review_reason" },
      containsRealEndpoint: false,
      containsSecret: false
    }
  ],
  templates: [
    {
      templateId: "approval.response.default.demo",
      purpose: "demo approval response",
      locale: "en",
      text: {
        value: "Demo approval response template. Replace with private approved copy during implementation.",
        source: "defaultFromPack"
      }
    }
  ],
  tests: [
    {
      testCaseId: "approval-low-risk-demo",
      title: "Low-risk approval demo",
      input: { request_type: "demo_approval", request_id: "DEMO-APPROVAL", amount: 100 },
      expectedPath: ["collect_request", "evaluate_policy", "auto_approved"],
      expectedOutcome: "approved",
      tags: ["demo", "mock"]
    }
  ],
  governance: {
    environment: "demo",
    publishable: true,
    requiresHumanReview: true,
    unconfirmedFieldPolicy: "block_publish",
    missingFieldPolicy: "block_compile",
    sideEffectPolicy: {
      maxAutoSideEffect: "read",
      requiresPolicyGuardFrom: "write"
    }
  },
  metadata: {
    publicDemo: true,
    containsCustomerData: false,
    containsOrganizationData: false
  }
};

export const KNOWLEDGE_ANSWERING_BASIC_CONFIG: PackConfig = {
  packConfigId: "knowledge-answering:basic-demo",
  packConfigVersion: "0.1.0",
  archetypeId: "knowledge-answering",
  archetypeVersion: "0.1.0",
  variantId: "basic-demo",
  variantVersion: "0.1.0",
  locale: "en",
  capabilities: {
    questionIntake: { value: true, source: "confirmedByUser", required: true },
    knowledgeRetrieval: { value: true, source: "confirmedByUser", required: true },
    confidenceEvaluation: { value: true, source: "confirmedByUser", required: true },
    sourceCitation: { value: true, source: "confirmedByUser" },
    answerGeneration: { value: true, source: "confirmedByUser", required: true },
    clarification: { value: true, source: "confirmedByUser" },
    handoff: { value: true, source: "confirmedByUser", required: true }
  },
  businessObjects: [
    {
      objectId: "question",
      label: { en: "Question", zhCN: "问题" },
      fields: ["question_id", "question_text", "topic"]
    },
    {
      objectId: "demo_knowledge_snippet",
      label: { en: "Demo knowledge snippet", zhCN: "演示知识片段" },
      fields: ["demo_snippet_id", "demo_title", "freshness_label"]
    }
  ],
  rules: {
    "knowledgePolicy.minConfidence": {
      value: 0.72,
      source: "defaultFromPack",
      required: true,
      label: { en: "Minimum confidence", zhCN: "最低置信度" }
    },
    "knowledgePolicy.lowConfidenceStrategy": {
      value: "ask_clarification",
      source: "defaultFromPack",
      required: true,
      label: { en: "Low confidence strategy", zhCN: "低置信度策略" }
    },
    "knowledgePolicy.noAnswerStrategy": {
      value: "no_answer_with_reason",
      source: "defaultFromPack",
      required: true,
      label: { en: "No answer strategy", zhCN: "无答案策略" }
    },
    "knowledgePolicy.staleKnowledgeStrategy": {
      value: "warn_user",
      source: "defaultFromPack",
      required: true,
      label: { en: "Stale knowledge strategy", zhCN: "过期知识策略" }
    },
    "knowledgePolicy.sensitiveQuestionStrategy": {
      value: "handoff",
      source: "defaultFromPack",
      required: true,
      label: { en: "Sensitive question strategy", zhCN: "敏感问题策略" }
    },
    "sourcePolicy.requireSourceCitation": {
      value: true,
      source: "defaultFromPack",
      required: true,
      label: { en: "Require source citation", zhCN: "要求来源引用" }
    },
    "sourcePolicy.minSourceCount": {
      value: 1,
      source: "defaultFromPack",
      required: true,
      label: { en: "Minimum source count", zhCN: "最低来源数量" }
    },
    "sourcePolicy.allowUnverifiedAnswer": {
      value: false,
      source: "defaultFromPack",
      required: true,
      label: { en: "Allow unverified answer", zhCN: "允许未验证回答" }
    },
    "sourcePolicy.showSourceSummary": {
      value: true,
      source: "defaultFromPack",
      required: false,
      label: { en: "Show source summary", zhCN: "显示来源摘要" }
    },
    "responseStyle.tone": {
      value: "neutral",
      source: "defaultFromPack",
      required: true,
      label: { en: "Response tone", zhCN: "回答语气" }
    },
    "responseStyle.includeSources": {
      value: true,
      source: "defaultFromPack",
      required: false,
      label: { en: "Include sources", zhCN: "包含来源" }
    },
    "responseStyle.includeUncertainty": {
      value: true,
      source: "defaultFromPack",
      required: false,
      label: { en: "Include uncertainty", zhCN: "包含不确定性说明" }
    },
    "responseStyle.includeNextSteps": {
      value: true,
      source: "defaultFromPack",
      required: false,
      label: { en: "Include next steps", zhCN: "包含下一步" }
    }
  },
  policies: {
    "knowledgeAnswering.failClosed": {
      value: true,
      source: "defaultFromPack",
      label: { en: "Knowledge-answering fail-closed", zhCN: "知识回答 fail-closed" }
    },
    "sourceCitation.required": {
      value: true,
      source: "defaultFromPack",
      label: { en: "Source citation required", zhCN: "要求来源引用" }
    }
  },
  adapters: [
    {
      adapterId: "demo-knowledge-provider",
      mode: "mock",
      contractRef: "contracts/demo-knowledge-provider-contract.md",
      fieldMappings: {
        questionText: "question_text",
        demoSnippetId: "demo_snippet_id",
        demoTitle: "demo_title"
      },
      containsRealEndpoint: false,
      containsSecret: false
    },
    {
      adapterId: "demo-citation-store",
      mode: "mock",
      contractRef: "contracts/demo-citation-store-contract.md",
      fieldMappings: {
        requiredSourceCount: "min_source_count",
        sourceSummary: "demo_source_summary"
      },
      containsRealEndpoint: false,
      containsSecret: false
    }
  ],
  templates: [
    {
      templateId: "answer_with_sources",
      purpose: "Render a generic demo answer with source placeholders.",
      text: {
        value: "Demo answer template with source placeholders.",
        source: "defaultFromPack"
      }
    },
    {
      templateId: "low_confidence_clarification",
      purpose: "Ask a generic clarification when answer confidence is too low.",
      text: {
        value: "Demo clarification template for low confidence.",
        source: "defaultFromPack"
      }
    },
    {
      templateId: "no_answer_with_reason",
      purpose: "Explain that the demo flow cannot answer safely.",
      text: {
        value: "Demo no-answer template for governed fallback.",
        source: "defaultFromPack"
      }
    }
  ],
  tests: [
    {
      testCaseId: "known_question_answer_with_sources",
      title: "Known question answer with sources",
      input: {
        question_id: "DEMO-Q-KNOWN",
        question_text: "demo governed answer question",
        confidence_score: 0.86,
        demo_source_count: 1
      },
      expectedOutcome: "answer_with_sources"
    },
    {
      testCaseId: "low_confidence_asks_clarification",
      title: "Low confidence asks clarification",
      input: {
        question_id: "DEMO-Q-LOW",
        question_text: "demo ambiguous question",
        confidence_score: 0.41,
        demo_source_count: 1
      },
      expectedOutcome: "ask_clarification"
    }
  ],
  governance: {
    environment: "demo",
    publishable: false,
    requiresHumanReview: true,
    unconfirmedFieldPolicy: "block_publish",
    missingFieldPolicy: "block_compile",
    sideEffectPolicy: {
      maxAutoSideEffect: "read",
      requiresPolicyGuardFrom: "write"
    }
  },
  metadata: {
    publicDemo: true,
    containsCustomerData: false,
    containsRealKnowledgeAssets: false,
    containsRealProviderConfig: false
  }
};
