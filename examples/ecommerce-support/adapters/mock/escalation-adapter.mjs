export async function createEscalationTicket(payload) {
  const orderId = String(payload?.order_id ?? "unknown-order");
  return {
    ticket_id: `ESC-${orderId}`,
    queue: payload?.queue ?? "manual-review",
    priority: payload?.priority ?? "medium",
    handoff_status: "queued",
    next_step: "human_review",
    reason_code: payload?.reason_code ?? "manual_review_required",
    summary: payload?.summary ?? `Escalated for order ${orderId}`
  };
}
