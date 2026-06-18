import type { FieldDefinition } from "./field-types";

function option(value: string, en: string, zhCN: string) {
  return { value, label: { en, zhCN } };
}

export const REQUEST_RESOLUTION_FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    fieldId: "capabilities.orderLookup",
    type: "boolean",
    label: { en: "Order lookup", zhCN: "订单查询" },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.shippingLookup",
    type: "boolean",
    label: { en: "Shipping lookup", zhCN: "物流查询" },
    defaultValue: true
  },
  {
    fieldId: "capabilities.refundRequest",
    type: "boolean",
    label: { en: "Refund request", zhCN: "退款申请" },
    defaultValue: true
  },
  {
    fieldId: "capabilities.returnRequest",
    type: "boolean",
    label: { en: "Return request", zhCN: "退货申请" },
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
    fieldId: "rules.refundPolicy.autoRefundWhenNotShipped",
    type: "boolean",
    label: { en: "Auto refund when not shipped", zhCN: "未发货自动退款" },
    defaultValue: false
  },
  {
    fieldId: "rules.refundPolicy.autoRefundMaxAmount",
    type: "number",
    label: { en: "Auto refund max amount", zhCN: "自动退款金额上限" },
    min: 0
  },
  {
    fieldId: "rules.refundPolicy.shippedOrderStrategy",
    type: "enum",
    label: { en: "Shipped order strategy", zhCN: "已发货订单策略" },
    enumOptions: [
      option("require_return_first", "Require return first", "先要求退货"),
      option("handoff", "Handoff", "转人工"),
      option("reject_with_template", "Reject with template", "按模板拒绝")
    ]
  },
  {
    fieldId: "rules.refundPolicy.expiredAfterSaleStrategy",
    type: "enum",
    label: { en: "Expired after-sale strategy", zhCN: "售后期过期策略" },
    enumOptions: [
      option("reject_with_template", "Reject with template", "按模板拒绝"),
      option("handoff", "Handoff", "转人工"),
      option("ask_for_more_info", "Ask for more info", "请求补充信息")
    ]
  },
  {
    fieldId: "rules.refundPolicy.apiFailureStrategy",
    type: "enum",
    label: { en: "API failure strategy", zhCN: "接口失败策略" },
    enumOptions: [
      option("retry_then_handoff", "Retry then handoff", "重试后转人工"),
      option("handoff", "Handoff", "转人工"),
      option("fail_closed_error", "Fail closed", "失败关闭")
    ]
  },
  {
    fieldId: "rules.handoffPolicy.highValueRefund",
    type: "boolean",
    label: { en: "Handoff high-value refund", zhCN: "高金额退款转人工" },
    defaultValue: true
  },
  {
    fieldId: "rules.handoffPolicy.complaint",
    type: "boolean",
    label: { en: "Handoff complaint", zhCN: "投诉转人工" },
    defaultValue: true
  },
  {
    fieldId: "rules.handoffPolicy.orderNotFound",
    type: "boolean",
    label: { en: "Handoff when order not found", zhCN: "订单未找到转人工" },
    defaultValue: true
  },
  {
    fieldId: "rules.handoffPolicy.ruleConflict",
    type: "boolean",
    label: { en: "Handoff rule conflict", zhCN: "规则冲突转人工" },
    defaultValue: true
  },
  {
    fieldId: "rules.handoffPolicy.maxUserRetryCount",
    type: "number",
    label: { en: "Max user retry count", zhCN: "最大用户重试次数" },
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
    fieldId: "rules.responseStyle.includeReason",
    type: "boolean",
    label: { en: "Include reason", zhCN: "包含原因说明" },
    defaultValue: true
  },
  {
    fieldId: "rules.responseStyle.includeHumanSupportEntry",
    type: "boolean",
    label: { en: "Include human support entry", zhCN: "包含人工入口" },
    defaultValue: true
  }
];

export const REQUEST_RESOLUTION_FIELD_IDS = REQUEST_RESOLUTION_FIELD_DEFINITIONS.map((field) => field.fieldId);
