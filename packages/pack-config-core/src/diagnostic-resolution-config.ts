import type { FieldDefinition } from "./field-types";

function option(value: string, en: string, zhCN: string) {
  return { value, label: { en, zhCN } };
}

export const DIAGNOSTIC_RESOLUTION_DEMO_SIGNAL_IDS = [
  "symptom_summary",
  "environment_hint",
  "observed_behavior"
] as const;

export const DIAGNOSTIC_RESOLUTION_FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    fieldId: "capabilities.signalCollection",
    type: "boolean",
    label: { en: "Signal collection", zhCN: "信号采集" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.diagnosticChecks",
    type: "boolean",
    label: { en: "Diagnostic checks", zhCN: "诊断检查" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.branchDiagnosis",
    type: "boolean",
    label: { en: "Branch diagnosis", zhCN: "分支诊断" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.remediationSuggestion",
    type: "boolean",
    label: { en: "Remediation suggestion", zhCN: "处置建议" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.safeMockRemediation",
    type: "boolean",
    label: { en: "Safe mock remediation", zhCN: "安全模拟处置" },
    defaultValue: true
  },
  {
    fieldId: "capabilities.resolutionVerification",
    type: "boolean",
    label: { en: "Resolution verification", zhCN: "处置结果验证" },
    required: true,
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
    fieldId: "rules.diagnosticPolicy.requiredSignals",
    type: "multi_select",
    label: { en: "Required demo signals", zhCN: "必需演示信号" },
    required: true,
    defaultValue: ["symptom_summary", "observed_behavior"]
  },
  {
    fieldId: "rules.diagnosticPolicy.maxDiagnosticRounds",
    type: "number",
    label: { en: "Maximum diagnostic rounds", zhCN: "最大诊断轮次" },
    required: true,
    defaultValue: 3,
    min: 1,
    max: 8
  },
  {
    fieldId: "rules.diagnosticPolicy.inconclusiveStrategy",
    type: "enum",
    label: { en: "Inconclusive strategy", zhCN: "无法判定策略" },
    required: true,
    defaultValue: "ask_more_signals",
    enumOptions: [
      option("ask_more_signals", "Ask for more signals", "请求补充信号"),
      option("handoff", "Handoff", "转人工"),
      option("stop_with_reason", "Stop with reason", "说明原因后停止")
    ]
  },
  {
    fieldId: "rules.diagnosticPolicy.checkFailureStrategy",
    type: "enum",
    label: { en: "Check failure strategy", zhCN: "检查失败策略" },
    required: true,
    defaultValue: "retry",
    enumOptions: [
      option("retry", "Retry", "重试"),
      option("handoff", "Handoff", "转人工"),
      option("stop_with_reason", "Stop with reason", "说明原因后停止")
    ]
  },
  {
    fieldId: "rules.diagnosticPolicy.remediationStrategy",
    type: "enum",
    label: { en: "Remediation strategy", zhCN: "处置策略" },
    required: true,
    defaultValue: "suggest_only",
    enumOptions: [
      option("suggest_only", "Suggest only", "仅提供建议"),
      option("mock_safe_attempt", "Mock safe attempt", "安全模拟尝试"),
      option("handoff", "Handoff", "转人工")
    ]
  },
  {
    fieldId: "rules.diagnosticPolicy.maxRemediationAttempts",
    type: "number",
    label: { en: "Maximum remediation attempts", zhCN: "最大处置尝试次数" },
    required: true,
    defaultValue: 1,
    min: 0,
    max: 3
  },
  {
    fieldId: "rules.validationPolicy.requireEvidenceBeforeDiagnosis",
    type: "boolean",
    label: { en: "Require evidence before diagnosis", zhCN: "诊断前要求证据" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "rules.validationPolicy.rejectUnknownSignals",
    type: "boolean",
    label: { en: "Reject unknown signals", zhCN: "拒绝未知信号" },
    defaultValue: true
  },
  {
    fieldId: "rules.validationPolicy.requireVerificationBeforeComplete",
    type: "boolean",
    label: { en: "Require verification before completion", zhCN: "完成前要求验证" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "rules.responseStyle.tone",
    type: "enum",
    label: { en: "Response tone", zhCN: "回复语气" },
    defaultValue: "calm_technical",
    enumOptions: [
      option("calm_technical", "Calm technical", "冷静专业"),
      option("neutral", "Neutral", "中性"),
      option("concise", "Concise", "简洁")
    ]
  },
  {
    fieldId: "rules.responseStyle.includeDiagnosisReason",
    type: "boolean",
    label: { en: "Include diagnosis reason", zhCN: "包含诊断理由" },
    defaultValue: true
  },
  {
    fieldId: "rules.responseStyle.includeCheckSummary",
    type: "boolean",
    label: { en: "Include check summary", zhCN: "包含检查摘要" },
    defaultValue: true
  },
  {
    fieldId: "rules.responseStyle.includeNextSteps",
    type: "boolean",
    label: { en: "Include next steps", zhCN: "包含下一步" },
    defaultValue: true
  }
];

export const DIAGNOSTIC_RESOLUTION_FIELD_IDS = DIAGNOSTIC_RESOLUTION_FIELD_DEFINITIONS.map(
  (field) => field.fieldId
);
