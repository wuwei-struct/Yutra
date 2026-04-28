import { createFunctionTool } from "@yutra/tool-core";
import { getShippingStatus } from "../adapters/shipping-adapter.mjs";

function adapterOptionsFromContext(context = {}) {
  return {
    adapterMode: context.adapter_mode,
    dryRun: context.adapter_dry_run,
    environment: context.environment
  };
}

export const checkShippingTool = createFunctionTool({
  name: "check_shipping_tool",
  sideEffect: "read",
  description: "Shipping Adapter contract bridge: getShippingStatus(order/tracking).",
  handler: async (_input, ctx) => {
    const shipping = await getShippingStatus(
      {
        shipment_status: ctx.context.shipping_status,
        delayed_days: ctx.context.shipping_delay_days,
        tracking_number: ctx.context.tracking_number_found === false ? null : "TRACK-PLACEHOLDER"
      },
      {
        policyParams: (ctx.context.policy_params ?? {}),
        ...adapterOptionsFromContext(ctx.context)
      }
    );

    const requiresHuman = shipping.is_exception || shipping.tracking_no === null;
    const handoffReason = shipping.is_exception
      ? "shipping_exception"
      : shipping.tracking_no === null
        ? "missing_tracking_number"
        : shipping.is_delayed
          ? "delayed_shipment"
          : undefined;

    return {
      ok: true,
      data: {
        shippingStatus: shipping.shipping_status,
        delayed: shipping.is_delayed,
        delayedDays: Number(ctx.context.shipping_delay_days ?? 0),
        shippingException: shipping.is_exception,
        trackingNumberFound: shipping.tracking_no !== null,
        requiresHuman,
        handoffReason,
        note: shipping.latest_event
      }
    };
  }
});
