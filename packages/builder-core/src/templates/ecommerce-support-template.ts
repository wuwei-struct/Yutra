import type { AgentTemplateConfig } from "../types";

export const ecommerceSupportTemplate: AgentTemplateConfig = {
  templateId: "ecommerce-support",
  name: "E-commerce Support",
  description: "Skill-based e-commerce support template for shipping, return, refund, and handoff flows.",
  domain: "ecommerce-support",
  supportedIntents: [
    { id: "shipping_query", label: "物流查询", description: "查询订单物流状态", entryState: "triage" },
    { id: "return_request", label: "退货申请", description: "创建退货请求", entryState: "triage" },
    { id: "refund_request", label: "退款申请", description: "创建退款请求，必要时转人工", entryState: "triage" },
    { id: "handoff", label: "转人工", description: "创建客服工单并移交人工", entryState: "triage" }
  ],
  availableSkills: [
    {
      name: "query_order",
      label: "查询订单",
      description: "查询订单基础信息",
      defaultSelected: true,
      sideEffect: "read",
      riskLevel: "low",
      requiresApproval: false
    },
    {
      name: "query_shipping_status",
      label: "查询物流状态",
      description: "查询物流轨迹与状态",
      defaultSelected: true,
      sideEffect: "read",
      riskLevel: "low",
      requiresApproval: false
    },
    {
      name: "create_return_request",
      label: "创建退货请求",
      description: "创建退货单",
      sideEffect: "write",
      riskLevel: "medium",
      requiresApproval: false
    },
    {
      name: "create_refund_request",
      label: "创建退款请求",
      description: "创建退款单",
      sideEffect: "write",
      riskLevel: "high",
      requiresApproval: true
    },
    {
      name: "create_support_ticket",
      label: "创建人工工单",
      description: "转人工时创建支持工单",
      sideEffect: "external",
      riskLevel: "medium",
      requiresApproval: false
    }
  ],
  defaultContextFields: [
    { name: "order_id", type: "string", required: true },
    { name: "customer_id", type: "string" },
    { name: "issue_type", type: "string" },
    { name: "order", type: "object" },
    { name: "shipping", type: "object" },
    { name: "return_request", type: "object" },
    { name: "refund_request", type: "object" },
    { name: "handoff_ticket", type: "object" },
    { name: "risk_level", type: "string", default: "low" },
    { name: "missing_info", type: "array", default: [] }
  ],
  defaultStates: [
    { name: "triage", label: "分流" },
    { name: "query_order", label: "查询订单" },
    { name: "query_shipping", label: "查询物流" },
    { name: "handle_return", label: "处理退货" },
    { name: "handle_refund", label: "处理退款" },
    { name: "create_handoff_ticket", label: "创建转人工工单" },
    { name: "resolved", label: "已解决", final: true },
    { name: "handoff_human", label: "人工接管", handoff: true }
  ],
  defaultRules: {
    delayedShipmentThresholdHours: 48,
    returnWindowDays: 30,
    highRiskAmountThreshold: 1000,
    requireHumanForRefundAfterDelivery: true,
    requireHumanForDamagedGoods: true
  },
  metadata: {
    sourcePack: "examples/ecommerce-support",
    phase: "P5-01"
  }
};
