import { dryRunMeta, resolveRealAdapterConfig } from "./common.mjs";

function renderTemplateText(templateKey, variables = {}) {
  const orderId = String(variables.order_id ?? "unknown-order");
  const handoffReason = String(variables.handoff_reason ?? "manual review required");
  const shippingStatus = String(variables.shipping_status ?? "unknown");
  const refundStatus = String(variables.refund_status ?? "processing");

  switch (templateKey) {
    case "shipping":
      return `Order ${orderId} shipping status: ${shippingStatus}.`;
    case "refund":
      return `Order ${orderId} refund status: ${refundStatus}.`;
    case "return":
      return `Order ${orderId} return request has been accepted.`;
    case "handoff":
      return `Order ${orderId} requires human handoff (${handoffReason}).`;
    default:
      return `Order ${orderId} request has been processed.`;
  }
}

export function renderResponseTemplateToChannelMessage(input, options = {}) {
  const config = resolveRealAdapterConfig("channel", options);
  const templateKey = input?.templateKey ?? "default";

  const text = renderTemplateText(templateKey, input?.variables ?? {});
  const messageType = templateKey === "handoff" ? "handoff_notice" : "text";

  return {
    channel: input?.channel ?? "generic",
    message_type: messageType,
    text,
    metadata: {
      template_key: templateKey,
      run_id: input?.runId,
      state: input?.state,
      real_adapter_mode: true,
      ...dryRunMeta(config)
    }
  };
}
