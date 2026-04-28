import { createFunctionTool } from "@yutra/tool-core";
import { getOrderById } from "../adapters/order-adapter.mjs";

function adapterOptionsFromContext(context = {}) {
  return {
    adapterMode: context.adapter_mode,
    dryRun: context.adapter_dry_run,
    environment: context.environment
  };
}

export const lookupOrderTool = createFunctionTool({
  name: "lookup_order_tool",
  sideEffect: "read",
  description: "Order Adapter contract bridge: getOrderById(orderId).",
  handler: async (_input, ctx) => {
    const orderId = String(ctx.context.order_id ?? "");
    const order = await getOrderById(orderId, {
      policyParams: (ctx.context.policy_params ?? {}),
      ...adapterOptionsFromContext(ctx.context)
    });

    if (!order.found) {
      return {
        ok: true,
        data: {
          orderFound: false,
          orderId
        }
      };
    }

    return {
      ok: true,
      data: {
        orderFound: true,
        orderId: order.order_id,
        status: order.status,
        shippingStatus: order.shipment_status,
        returnEligible: order.return_window_expired === true ? false : true,
        refundEligible: order.status === "unshipped" || order.status === "shipped",
        delayedDays: Number(order.delayed_days ?? 0),
        delayedByThreshold: order.delayed_by_threshold === true,
        shippingException: order.shipment_status === "exception",
        trackingNumberFound: Boolean(order.tracking_number),
        returnWindowExpired: order.return_window_expired === true,
        damagedGoods: order.damaged_goods === true,
        refundAmount: Number(order.amount ?? 0),
        highRiskRefund: order.high_risk_refund === true || order.high_risk_by_amount === true,
        missingRequiredInfo: order.missing_required_info === true,
        requiresHuman: order.requires_human === true,
        handoffReason: order.handoff_reason
      }
    };
  }
});
