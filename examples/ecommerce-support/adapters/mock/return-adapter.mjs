export async function checkReturnEligibility(order, input = {}) {
  const returnWindowDays = Number(input.policyParams?.returnWindowDays ?? 7);
  const requireHumanForDamagedGoods = input.policyParams?.requireHumanForDamagedGoods === true;

  if (!order?.found) {
    return {
      eligible: false,
      reason_code: "order_not_found",
      reason: "Order does not exist.",
      next_step: "handoff"
    };
  }

  if (order.missing_required_info === true) {
    return {
      eligible: false,
      reason_code: "missing_required_info",
      reason: "Missing required fields for return eligibility.",
      next_step: "handoff"
    };
  }

  if (order.damaged_goods === true && requireHumanForDamagedGoods) {
    return {
      eligible: false,
      reason_code: "damaged_goods_manual_review",
      reason: "Damaged goods require human verification.",
      next_step: "handoff"
    };
  }

  if (order.return_window_expired === true) {
    return {
      eligible: false,
      reason_code: "return_window_expired",
      reason: `Return window (${returnWindowDays} days) has expired.`,
      next_step: "inform_policy"
    };
  }

  return {
    eligible: true,
    reason_code: "return_eligible",
    reason: "Return is within supported policy window.",
    next_step: "create_return_request"
  };
}

export async function createReturnRequest(order, reason = "customer_request") {
  const orderId = String(order?.order_id ?? "unknown-order");
  return {
    eligible: true,
    reason_code: "return_ticket_created",
    reason: "Return request has been created.",
    request_id: `RET-${orderId}`,
    next_step: "resolved",
    metadata: {
      reason
    }
  };
}
