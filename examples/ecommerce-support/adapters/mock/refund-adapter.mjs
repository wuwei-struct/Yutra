export async function checkRefundEligibility(order, input = {}) {
  const autoApproveBeforeShipment = input.policyParams?.refundAutoApproveBeforeShipment !== false;
  const riskAmountThreshold = Number(input.policyParams?.highRiskAmountThreshold ?? 1000);
  const requireHumanForAfterDelivery = input.policyParams?.requireHumanForRefundAfterDelivery === true;

  if (!order?.found) {
    return {
      eligible: false,
      reason_code: "order_not_found",
      reason: "Order does not exist.",
      refund_status: "not_started",
      next_step: "handoff"
    };
  }

  if (order.missing_required_info === true) {
    return {
      eligible: false,
      reason_code: "missing_required_info",
      reason: "Missing required fields for refund decision.",
      refund_status: "not_started",
      next_step: "handoff"
    };
  }

  if (Number(order.amount ?? 0) >= riskAmountThreshold || order.high_risk_refund === true) {
    return {
      eligible: false,
      reason_code: "high_risk_refund",
      reason: "Refund amount/risk exceeds automatic threshold.",
      refund_status: "manual_review",
      next_step: "handoff"
    };
  }

  if (order.status === "unshipped") {
    return {
      eligible: autoApproveBeforeShipment,
      reason_code: autoApproveBeforeShipment ? "refund_before_shipment_auto" : "refund_before_shipment_manual",
      reason: autoApproveBeforeShipment
        ? "Refund before shipment can be auto-approved."
        : "Policy requires manual confirmation before shipment.",
      refund_status: autoApproveBeforeShipment ? "approved" : "manual_review",
      next_step: autoApproveBeforeShipment ? "create_refund_request" : "handoff"
    };
  }

  if (order.status === "delivered" && requireHumanForAfterDelivery) {
    return {
      eligible: false,
      reason_code: "refund_after_delivery_manual_review",
      reason: "Refund after delivery requires manual review.",
      refund_status: "manual_review",
      next_step: "handoff"
    };
  }

  return {
    eligible: true,
    reason_code: "refund_eligible",
    reason: "Refund request meets automatic criteria.",
    refund_status: "approved",
    next_step: "create_refund_request"
  };
}

export async function createRefundRequest(order, amount, reason = "customer_request") {
  const orderId = String(order?.order_id ?? "unknown-order");
  return {
    eligible: true,
    reason_code: "refund_request_created",
    reason: "Refund request has been created.",
    refund_request_id: `RFD-${orderId}`,
    refund_status: "processing",
    next_step: "resolved",
    metadata: {
      amount: amount ?? order?.amount,
      reason
    }
  };
}
