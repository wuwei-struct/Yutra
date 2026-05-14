import type { BuilderUiState } from "../types";

export const defaultBuilderUiState: BuilderUiState = {
  templateId: "ecommerce-support",
  agentName: "电商售后客服",
  version: "0.1.0",
  responseStyle: "service_oriented",
  language: "zh-CN",
  selectedIntentIds: ["shipping_query", "refund_request"],
  selectedSkillNames: ["query_order", "query_shipping_status", "create_refund_request", "create_support_ticket"],
  rules: {
    delayedShipmentThresholdHours: 48,
    returnWindowDays: 7,
    highRiskAmountThreshold: 100,
    requireHumanForRefundAfterDelivery: true,
    requireHumanForDamagedGoods: true
  }
};
