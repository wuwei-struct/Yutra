import { getOrderByCustomer, getOrderById } from "../../../adapters/order-adapter.mjs";

function adapterOptionsFromContext(context = {}) {
  return {
    adapterMode: context.adapter_mode,
    dryRun: context.adapter_dry_run,
    environment: context.environment,
    policyParams: context.policy_params ?? {}
  };
}

function compactPatch(patch) {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

export async function run(input, ctx) {
  const orderId = String(input?.order_id ?? ctx?.context?.order_id ?? "");
  const customerId = String(input?.customer_id ?? ctx?.context?.customer_id ?? "");
  if (!orderId && !customerId) {
    return {
      ok: false,
      error: {
        code: "ORDER_IDENTIFIER_REQUIRED",
        message: "query_order requires order_id or customer_id.",
        retryable: false
      }
    };
  }

  const order = orderId
    ? await getOrderById(orderId, adapterOptionsFromContext(ctx?.context))
    : await getOrderByCustomer(customerId, orderId, adapterOptionsFromContext(ctx?.context));

  return {
    ok: true,
    data: {
      order_id: String(order.order_id ?? orderId),
      customer_id: String(order.customer_id ?? customerId),
      status: String(order.status ?? "unknown"),
      shipment_status: String(order.shipment_status ?? "unknown"),
      payment_status: String(order.payment_status ?? "unknown"),
      items: Array.isArray(order.items) ? order.items : [],
      amount: Number(order.amount ?? 0),
      currency: String(order.currency ?? "CNY"),
      tracking_number: typeof order.tracking_number === "string" ? order.tracking_number : "",
      delayed_days: Number(order.delayed_days ?? 0),
      return_window_expired: order.return_window_expired === true,
      high_risk_refund: order.high_risk_refund === true || order.high_risk_by_amount === true,
      missing_required_info: order.missing_required_info === true,
      requires_human: order.requires_human === true,
      handoff_reason: typeof order.handoff_reason === "string" ? order.handoff_reason : ""
    },
    contextPatch: compactPatch({
      order_found: order.found === true,
      order_status: String(order.status ?? "unknown"),
      shipping_status: String(order.shipment_status ?? "unknown"),
      return_eligible: order.return_window_expired === true ? false : true,
      refund_eligible: order.status === "unshipped" || order.status === "shipped",
      shipping_delay_days: Number(order.delayed_days ?? 0),
      shipping_delayed: order.delayed_by_threshold === true,
      shipping_exception: order.shipment_status === "exception",
      tracking_number_found: Boolean(order.tracking_number),
      return_window_expired: order.return_window_expired === true,
      damaged_goods: order.damaged_goods === true,
      refund_amount: Number(order.amount ?? 0),
      high_risk_refund: order.high_risk_refund === true || order.high_risk_by_amount === true,
      missing_required_info: order.missing_required_info === true,
      requires_human: order.requires_human === true,
      handoff_reason: order.handoff_reason
    }),
    meta: {
      adapter: "order-adapter",
      contractVersion: "v0.1"
    }
  };
}
