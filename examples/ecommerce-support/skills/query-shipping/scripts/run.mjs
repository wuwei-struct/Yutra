import { getShippingStatus } from "../../../adapters/shipping-adapter.mjs";

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
  const shipping = await getShippingStatus(
    {
      shipment_status: input?.shipment_status ?? ctx?.context?.shipping_status,
      delayed_days: input?.delayed_days ?? ctx?.context?.shipping_delay_days,
      tracking_number:
        input?.tracking_no ??
        (ctx?.context?.tracking_number_found === false ? null : String(ctx?.context?.tracking_number ?? "TRACK-PLACEHOLDER"))
    },
    adapterOptionsFromContext(ctx?.context)
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
      tracking_no: shipping.tracking_no ?? "",
      shipping_status: String(shipping.shipping_status ?? "unknown"),
      carrier: String(shipping.carrier ?? "unknown"),
      is_delayed: shipping.is_delayed === true,
      is_exception: shipping.is_exception === true,
      latest_event: String(shipping.latest_event ?? ""),
      estimated_delivery_at: shipping.estimated_delivery_at ? String(shipping.estimated_delivery_at) : ""
    },
    contextPatch: compactPatch({
      shipping_note: shipping.latest_event,
      shipping_status: String(shipping.shipping_status ?? "unknown"),
      requires_human: requiresHuman,
      handoff_reason: handoffReason
    }),
    meta: {
      adapter: "shipping-adapter",
      contractVersion: "v0.1"
    }
  };
}
