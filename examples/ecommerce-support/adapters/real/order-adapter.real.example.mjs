import {
  baseHeaders,
  createAdapterError,
  dryRunMeta,
  ensureRequiredFields,
  requestWithRetry,
  resolveRealAdapterConfig
} from "./common.mjs";

function mapOrderResponse(raw, fallbackOrderId) {
  const mapped = {
    found: raw.found !== false,
    order_id: String(raw.order_id ?? fallbackOrderId ?? ""),
    customer_id: String(raw.customer_id ?? ""),
    status: String(raw.status ?? "unknown"),
    shipment_status: String(raw.shipment_status ?? "unknown"),
    payment_status: String(raw.payment_status ?? "unknown"),
    created_at: String(raw.created_at ?? ""),
    delivered_at: raw.delivered_at ? String(raw.delivered_at) : undefined,
    items: Array.isArray(raw.items) ? raw.items : [],
    amount: Number(raw.amount ?? 0),
    currency: String(raw.currency ?? "CNY"),
    tracking_number: raw.tracking_number ?? null,
    delayed_days: Number(raw.delayed_days ?? 0),
    missing_required_info: raw.missing_required_info === true,
    high_risk_refund: raw.high_risk_refund === true,
    damaged_goods: raw.damaged_goods === true,
    return_window_expired: raw.return_window_expired === true
  };

  ensureRequiredFields(
    ["order_id", "customer_id", "status", "shipment_status", "payment_status", "created_at", "items", "amount", "currency"],
    mapped,
    "order"
  );

  return mapped;
}

export async function getOrderById(orderId, options = {}) {
  const config = resolveRealAdapterConfig("order", options);

  if (config.dryRun) {
    return {
      ...mapOrderResponse(
        {
          order_id: String(orderId),
          customer_id: "DRYRUN-CUSTOMER",
          status: "shipped",
          shipment_status: "in_transit",
          payment_status: "paid",
          created_at: new Date().toISOString(),
          items: [{ sku: "DRYRUN-SKU", qty: 1 }],
          amount: 199,
          currency: "CNY",
          tracking_number: "DRYRUN-TRACK-001"
        },
        orderId
      ),
      adapter_meta: dryRunMeta(config)
    };
  }

  const url = `${config.baseUrl}/orders/${encodeURIComponent(String(orderId))}`;
  const response = await requestWithRetry(
    url,
    {
      method: "GET",
      headers: baseHeaders(config)
    },
    config
  );

  const json = await response.json();
  return mapOrderResponse(json, orderId);
}

export async function getOrderByCustomer(customerId, orderId, options = {}) {
  const config = resolveRealAdapterConfig("order", options);

  if (config.dryRun) {
    if (!customerId && !orderId) {
      throw createAdapterError("ADAPTER_INPUT_INVALID", "order adapter requires customerId or orderId.", {
        retryable: false
      });
    }

    return getOrderById(orderId ?? `DRYRUN-${String(customerId)}`, options);
  }

  const query = new URLSearchParams();
  if (customerId) query.set("customer_id", String(customerId));
  if (orderId) query.set("order_id", String(orderId));

  const url = `${config.baseUrl}/orders/by-customer?${query.toString()}`;
  const response = await requestWithRetry(
    url,
    {
      method: "GET",
      headers: baseHeaders(config)
    },
    config
  );

  const json = await response.json();
  return mapOrderResponse(json, orderId);
}
