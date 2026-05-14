export const builderSampleInputs = {
  shippingCase: {
    context: {
      issue_type: "shipping_query",
      order_id: "ORDER-1001"
    }
  },
  refundHighRiskCase: {
    context: {
      issue_type: "refund_request",
      order_id: "ORDER-HIGH-RISK",
      amount: 999
    }
  },
  handoffCase: {
    context: {
      issue_type: "handoff",
      order_id: "ORDER-NEEDS-HUMAN",
      risk_level: "high"
    }
  }
} as const;

export type BuilderSampleInputKey = keyof typeof builderSampleInputs;
