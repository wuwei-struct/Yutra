import type { AiDraftUiState } from "../types";

export const aiDraftScenarioOptions = [
  {
    value: "ecommerce_support",
    label: "ecommerce_support",
    description: "E-commerce support workflow",
    supported: true
  },
  {
    value: "it_helpdesk",
    label: "it_helpdesk",
    description: "Coming later",
    supported: false
  },
  {
    value: "approval",
    label: "approval",
    description: "Coming later",
    supported: false
  },
  {
    value: "custom",
    label: "custom",
    description: "Coming later",
    supported: false
  }
] as const;

export const capabilityTagOptions = [
  { value: "query_order", description: "Query order basic information" },
  { value: "query_shipping_status", description: "Query shipping progress" },
  { value: "create_return_request", description: "Create return request" },
  { value: "create_refund_request", description: "Create refund request" },
  { value: "create_support_ticket", description: "Create support handoff ticket" },
  { value: "render_customer_reply", description: "Render customer-facing reply" }
] as const;

export const strategyTagOptions = [
  { value: "require_handoff_for_high_risk", description: "High-risk cases require handoff" },
  { value: "require_approval_for_refund", description: "Refund needs approval/human gate" },
  { value: "full_trace_audit", description: "Keep full trace and audit evidence" },
  { value: "ask_for_missing_info", description: "Ask for missing order info first" },
  { value: "service_oriented_response", description: "Service-oriented response style" },
  { value: "strict_policy_boundary", description: "Strict policy boundary and safe fallback" }
] as const;

export const defaultBriefText = `如果用户咨询物流，先查询订单和物流。
如果物流超过 48 小时没有更新，标记为延迟。
如果用户申请退款且金额超过 5000，必须转人工。
退货窗口为 7 天。
缺少订单号时先追问用户。`;

export const defaultAiDraftState: AiDraftUiState = {
  providerMode: "mock",
  scenario: "ecommerce_support",
  capabilities: ["query_order", "query_shipping_status", "create_refund_request", "create_support_ticket"],
  strategies: ["require_handoff_for_high_risk", "full_trace_audit", "service_oriented_response"],
  briefText: defaultBriefText,
  generating: false
};

export function toggleTag(values: string[], value: string, checked: boolean): string[] {
  if (checked) {
    return values.includes(value) ? values : [...values, value];
  }
  return values.filter((item) => item !== value);
}
