export async function getShippingStatus(input, options = {}) {
  const delayedThreshold = Number(options.policyParams?.delayedShipmentThresholdDays ?? 3);
  const delayedDays = Number(input.delayed_days ?? 0);
  const isDelayed = delayedDays > delayedThreshold;
  const isException = input.shipment_status === "exception";
  const trackingNo = input.tracking_number;

  return {
    tracking_no: trackingNo ?? null,
    shipping_status: String(input.shipment_status ?? "unknown"),
    carrier: "demo-carrier",
    estimated_delivery_at: isException ? null : "2026-01-20T10:00:00.000Z",
    latest_event: isException
      ? "Carrier reported shipment exception"
      : isDelayed
        ? `Shipment delayed by ${delayedDays} day(s)`
        : input.shipment_status === "delivered"
          ? "Shipment delivered"
          : "Shipment in transit",
    is_delayed: isDelayed,
    is_exception: isException
  };
}
