import type { FieldDefinition } from "./field-types";

function option(value: string, en: string, zhCN: string) {
  return { value, label: { en, zhCN } };
}

export const APPROVAL_DECISION_FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    fieldId: "capabilities.requestIntake",
    type: "boolean",
    label: { en: "Request intake", zhCN: "审批请求受理" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.evidenceCollection",
    type: "boolean",
    label: { en: "Evidence collection", zhCN: "材料收集" },
    defaultValue: true
  },
  {
    fieldId: "capabilities.eligibilityCheck",
    type: "boolean",
    label: { en: "Eligibility check", zhCN: "资格检查" },
    defaultValue: true
  },
  {
    fieldId: "capabilities.riskReview",
    type: "boolean",
    label: { en: "Risk review", zhCN: "风险复核" },
    defaultValue: true
  },
  {
    fieldId: "capabilities.approvalDecision",
    type: "boolean",
    label: { en: "Approval decision", zhCN: "审批决策" },
    defaultValue: true
  },
  {
    fieldId: "capabilities.handoff",
    type: "boolean",
    label: { en: "Human handoff", zhCN: "人工转接" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "rules.approvalPolicy.autoApproveLowRisk",
    type: "boolean",
    label: { en: "Auto approve low-risk requests", zhCN: "低风险请求自动通过" },
    defaultValue: false
  },
  {
    fieldId: "rules.approvalPolicy.lowRiskMaxAmount",
    type: "number",
    label: { en: "Low-risk max amount", zhCN: "低风险金额上限" },
    min: 0
  },
  {
    fieldId: "rules.approvalPolicy.missingEvidenceStrategy",
    type: "enum",
    label: { en: "Missing evidence strategy", zhCN: "材料缺失策略" },
    enumOptions: [
      option("ask_for_more_info", "Ask for more info", "请求补充材料"),
      option("handoff", "Handoff", "转人工"),
      option("reject_with_reason", "Reject with reason", "说明原因后拒绝")
    ]
  },
  {
    fieldId: "rules.approvalPolicy.highRiskStrategy",
    type: "enum",
    label: { en: "High-risk strategy", zhCN: "高风险策略" },
    enumOptions: [
      option("require_human_approval", "Require human approval", "要求人工审批"),
      option("handoff", "Handoff", "转人工"),
      option("reject_with_reason", "Reject with reason", "说明原因后拒绝")
    ]
  },
  {
    fieldId: "rules.approvalPolicy.policyConflictStrategy",
    type: "enum",
    label: { en: "Policy conflict strategy", zhCN: "规则冲突策略" },
    enumOptions: [
      option("handoff", "Handoff", "转人工"),
      option("fail_closed_error", "Fail closed", "失败关闭")
    ]
  },
  {
    fieldId: "rules.approvalPolicy.timeoutStrategy",
    type: "enum",
    label: { en: "Timeout strategy", zhCN: "超时策略" },
    enumOptions: [
      option("remind_reviewer", "Remind reviewer", "提醒审核人"),
      option("handoff", "Handoff", "转人工"),
      option("fail_closed_error", "Fail closed", "失败关闭")
    ]
  },
  {
    fieldId: "rules.riskPolicy.requireHumanForHighRisk",
    type: "boolean",
    label: { en: "Require human review for high risk", zhCN: "高风险要求人工复核" },
    defaultValue: true
  },
  {
    fieldId: "rules.riskPolicy.requireEvidenceBeforeDecision",
    type: "boolean",
    label: { en: "Require evidence before decision", zhCN: "决策前要求材料齐全" },
    defaultValue: true
  },
  {
    fieldId: "rules.riskPolicy.requireReasonForRejection",
    type: "boolean",
    label: { en: "Require rejection reason", zhCN: "拒绝时要求说明原因" },
    defaultValue: true
  },
  {
    fieldId: "rules.riskPolicy.maxUserRetryCount",
    type: "number",
    label: { en: "Max user retry count", zhCN: "最大用户补充次数" },
    min: 0,
    max: 5
  },
  {
    fieldId: "rules.responseStyle.tone",
    type: "enum",
    label: { en: "Response tone", zhCN: "回复语气" },
    enumOptions: [
      option("neutral", "Neutral", "中性"),
      option("warm_professional", "Warm professional", "温和专业"),
      option("concise", "Concise", "简洁")
    ]
  },
  {
    fieldId: "rules.responseStyle.includeDecisionReason",
    type: "boolean",
    label: { en: "Include decision reason", zhCN: "包含决策原因" },
    defaultValue: true
  },
  {
    fieldId: "rules.responseStyle.includeNextSteps",
    type: "boolean",
    label: { en: "Include next steps", zhCN: "包含后续步骤" },
    defaultValue: true
  },
  {
    fieldId: "rules.responseStyle.includeHumanReviewEntry",
    type: "boolean",
    label: { en: "Include human review entry", zhCN: "包含人工复核入口" },
    defaultValue: true
  }
];

export const APPROVAL_DECISION_FIELD_IDS = APPROVAL_DECISION_FIELD_DEFINITIONS.map((field) => field.fieldId);
