function renderText(templateKey, variables = {}) {
  const orderId = String(variables.order_id ?? "unknown-order");
  const reason = String(variables.handoff_reason ?? "manual review required");
  const shippingStatus = String(variables.shipping_status ?? "unknown");
  const refundStatus = String(variables.refund_status ?? "processing");

  switch (templateKey) {
    case "shipping":
      return `Order ${orderId} shipping status: ${shippingStatus}.`;
    case "return":
      return `Order ${orderId} return request has been received.`;
    case "refund":
      return `Order ${orderId} refund status: ${refundStatus}.`;
    case "handoff":
      return `Order ${orderId} requires human follow-up (${reason}).`;
    default:
      return `Order ${orderId} request has been processed.`;
  }
}

export function renderResponseTemplateToChannelMessage(input) {
  const channel = input?.channel ?? "generic";
  const templateKey = input?.templateKey ?? "default";
  const text = renderText(templateKey, input?.variables ?? {});
  const message_type = templateKey === "handoff" ? "handoff_notice" : "text";

  return {
    channel,
    message_type,
    text,
    metadata: {
      template_key: templateKey,
      run_id: input?.runId,
      state: input?.state
    }
  };
}
