import {
  baseHeaders,
  dryRunMeta,
  ensureRequiredFields,
  requestWithRetry,
  resolveRealAdapterConfig
} from "./common.mjs";

function mapShippingResponse(raw) {
  const mapped = {
    tracking_no: raw.tracking_no ?? null,
    shipping_status: String(raw.shipping_status ?? "unknown"),
    carrier: String(raw.carrier ?? "unknown"),
    estimated_delivery_at: raw.estimated_delivery_at ?? null,
    latest_event: String(raw.latest_event ?? "No latest event."),
    is_delayed: raw.is_delayed === true,
    is_exception: raw.is_exception === true
  };

  ensureRequiredFields(["shipping_status", "carrier", "latest_event", "is_delayed", "is_exception"], mapped, "shipping");
  return mapped;
}

export async function getShippingStatus(input, options = {}) {
  const config = resolveRealAdapterConfig("shipping", options);

  if (config.dryRun) {
    const shipmentStatus = String(input?.shipment_status ?? "unknown");
    const delayedDays = Number(input?.delayed_days ?? 0);
    const delayedThreshold = Number(options.policyParams?.delayedShipmentThresholdDays ?? 3);

    return {
      ...mapShippingResponse({
        tracking_no: input?.tracking_number ?? null,
        shipping_status: shipmentStatus,
        carrier: "dryrun-carrier",
        estimated_delivery_at: shipmentStatus === "exception" ? null : "2026-02-01T10:00:00.000Z",
        latest_event:
          shipmentStatus === "exception"
            ? "Carrier exception detected"
            : delayedDays > delayedThreshold
              ? `Delayed by ${delayedDays} day(s)`
              : "In transit",
        is_delayed: delayedDays > delayedThreshold,
        is_exception: shipmentStatus === "exception"
      }),
      adapter_meta: dryRunMeta(config)
    };
  }

  const trackingRef = input?.tracking_number ?? input?.order_id;
  const url = `${config.baseUrl}/shipping/status/${encodeURIComponent(String(trackingRef ?? ""))}`;
  const response = await requestWithRetry(
    url,
    {
      method: "GET",
      headers: baseHeaders(config)
    },
    config
  );

  const json = await response.json();
  return mapShippingResponse(json);
}
