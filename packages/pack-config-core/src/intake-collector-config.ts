import type { FieldDefinition } from "./field-types";

function option(value: string, en: string, zhCN: string) {
  return { value, label: { en, zhCN } };
}

export const INTAKE_COLLECTOR_FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    fieldId: "capabilities.fieldCollection",
    type: "boolean",
    label: { en: "Field collection", zhCN: "字段采集" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.fieldValidation",
    type: "boolean",
    label: { en: "Field validation", zhCN: "字段校验" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.missingFieldDetection",
    type: "boolean",
    label: { en: "Missing-field detection", zhCN: "缺失字段检测" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.duplicateCheck",
    type: "boolean",
    label: { en: "Duplicate check", zhCN: "重复检查" },
    defaultValue: true
  },
  {
    fieldId: "capabilities.confirmation",
    type: "boolean",
    label: { en: "Record confirmation", zhCN: "采集结果确认" },
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
    fieldId: "rules.intakePolicy.requiredFields",
    type: "multi_select",
    label: { en: "Required demo fields", zhCN: "必填演示字段" },
    required: true,
    defaultValue: ["topic", "request_summary"]
  },
  {
    fieldId: "rules.intakePolicy.maxClarificationRounds",
    type: "number",
    label: { en: "Maximum clarification rounds", zhCN: "最大补问轮次" },
    required: true,
    defaultValue: 2,
    min: 0,
    max: 5
  },
  {
    fieldId: "rules.intakePolicy.incompleteStrategy",
    type: "enum",
    label: { en: "Incomplete intake strategy", zhCN: "采集不完整策略" },
    required: true,
    defaultValue: "ask_missing_fields",
    enumOptions: [
      option("ask_missing_fields", "Ask missing fields", "补问缺失字段"),
      option("handoff", "Handoff", "转人工"),
      option("stop_with_reason", "Stop with reason", "说明原因后停止")
    ]
  },
  {
    fieldId: "rules.intakePolicy.invalidFieldStrategy",
    type: "enum",
    label: { en: "Invalid field strategy", zhCN: "非法字段策略" },
    required: true,
    defaultValue: "ask_correction",
    enumOptions: [
      option("ask_correction", "Ask correction", "请求修正"),
      option("handoff", "Handoff", "转人工")
    ]
  },
  {
    fieldId: "rules.intakePolicy.duplicateStrategy",
    type: "enum",
    label: { en: "Duplicate strategy", zhCN: "重复记录策略" },
    required: true,
    defaultValue: "warn_and_confirm",
    enumOptions: [
      option("warn_and_confirm", "Warn and confirm", "提示并确认"),
      option("handoff", "Handoff", "转人工"),
      option("reject_duplicate", "Reject duplicate", "拒绝重复记录")
    ]
  },
  {
    fieldId: "rules.validationPolicy.requireConfirmationBeforeComplete",
    type: "boolean",
    label: { en: "Require confirmation before completion", zhCN: "完成前要求确认" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "rules.validationPolicy.rejectUnknownFields",
    type: "boolean",
    label: { en: "Reject unknown fields", zhCN: "拒绝未知字段" },
    defaultValue: true
  },
  {
    fieldId: "rules.validationPolicy.trimTextFields",
    type: "boolean",
    label: { en: "Trim text fields", zhCN: "清理文本空白" },
    defaultValue: true
  },
  {
    fieldId: "rules.validationPolicy.allowPartialDraft",
    type: "boolean",
    label: { en: "Allow partial draft", zhCN: "允许部分草稿" },
    defaultValue: false
  },
  {
    fieldId: "rules.responseStyle.tone",
    type: "enum",
    label: { en: "Response tone", zhCN: "回复语气" },
    defaultValue: "neutral",
    enumOptions: [
      option("neutral", "Neutral", "中性"),
      option("warm_professional", "Warm professional", "温和专业"),
      option("concise", "Concise", "简洁")
    ]
  },
  {
    fieldId: "rules.responseStyle.includeMissingFieldList",
    type: "boolean",
    label: { en: "Include missing-field list", zhCN: "包含缺失字段列表" },
    defaultValue: true
  },
  {
    fieldId: "rules.responseStyle.includeValidationReason",
    type: "boolean",
    label: { en: "Include validation reason", zhCN: "包含校验原因" },
    defaultValue: true
  },
  {
    fieldId: "rules.responseStyle.includeNextSteps",
    type: "boolean",
    label: { en: "Include next steps", zhCN: "包含下一步" },
    defaultValue: true
  }
];

export const INTAKE_COLLECTOR_FIELD_IDS = INTAKE_COLLECTOR_FIELD_DEFINITIONS.map(
  (field) => field.fieldId
);
