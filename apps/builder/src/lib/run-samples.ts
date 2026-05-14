export const runPreviewSamples = [
  {
    id: "shippingCase",
    label: "shippingCase",
    input: {
      context: {
        issue_type: "shipping_query",
        order_id: "ORDER-1001"
      }
    }
  },
  {
    id: "refundHighRiskCase",
    label: "refundHighRiskCase",
    input: {
      context: {
        issue_type: "refund_request",
        order_id: "ORDER-HIGH-RISK",
        amount: 999
      }
    }
  },
  {
    id: "handoffCase",
    label: "handoffCase",
    input: {
      context: {
        issue_type: "handoff",
        order_id: "ORDER-NEEDS-HUMAN",
        risk_level: "high"
      }
    }
  }
] as const;
