const ORDER_FIXTURES = {
  "EC-SHIP-NORMAL": {
    order_id: "EC-SHIP-NORMAL",
    customer_id: "CUST-1001",
    status: "shipped",
    shipment_status: "in_transit",
    payment_status: "paid",
    created_at: "2026-01-10T08:00:00.000Z",
    delivered_at: undefined,
    items: [{ sku: "SKU-1", qty: 1 }],
    amount: 120,
    currency: "CNY",
    delayed_days: 0,
    tracking_number: "TRACK-1001"
  },
  "EC-SHIP-DELAY": {
    order_id: "EC-SHIP-DELAY",
    customer_id: "CUST-1002",
    status: "shipped",
    shipment_status: "in_transit",
    payment_status: "paid",
    created_at: "2026-01-09T08:00:00.000Z",
    delivered_at: undefined,
    items: [{ sku: "SKU-2", qty: 1 }],
    amount: 150,
    currency: "CNY",
    delayed_days: 5,
    tracking_number: "TRACK-1002"
  },
  "EC-SHIP-EXCEPTION": {
    order_id: "EC-SHIP-EXCEPTION",
    customer_id: "CUST-1003",
    status: "shipped",
    shipment_status: "exception",
    payment_status: "paid",
    created_at: "2026-01-08T08:00:00.000Z",
    delivered_at: undefined,
    items: [{ sku: "SKU-3", qty: 1 }],
    amount: 200,
    currency: "CNY",
    delayed_days: 2,
    tracking_number: "TRACK-1003"
  },
  "EC-RET-ELIGIBLE": {
    order_id: "EC-RET-ELIGIBLE",
    customer_id: "CUST-2001",
    status: "delivered",
    shipment_status: "delivered",
    payment_status: "paid",
    created_at: "2026-01-05T08:00:00.000Z",
    delivered_at: "2026-01-07T09:00:00.000Z",
    items: [{ sku: "SKU-4", qty: 1 }],
    amount: 80,
    currency: "CNY",
    return_window_expired: false,
    damaged_goods: false
  },
  "EC-RET-EXPIRED": {
    order_id: "EC-RET-EXPIRED",
    customer_id: "CUST-2002",
    status: "delivered",
    shipment_status: "delivered",
    payment_status: "paid",
    created_at: "2025-12-01T08:00:00.000Z",
    delivered_at: "2025-12-03T09:00:00.000Z",
    items: [{ sku: "SKU-5", qty: 1 }],
    amount: 95,
    currency: "CNY",
    return_window_expired: true,
    damaged_goods: false
  },
  "EC-RET-DAMAGED": {
    order_id: "EC-RET-DAMAGED",
    customer_id: "CUST-2003",
    status: "delivered",
    shipment_status: "delivered",
    payment_status: "paid",
    created_at: "2026-01-04T08:00:00.000Z",
    delivered_at: "2026-01-06T09:00:00.000Z",
    items: [{ sku: "SKU-6", qty: 1 }],
    amount: 160,
    currency: "CNY",
    return_window_expired: false,
    damaged_goods: true
  },
  "EC-RFD-BEFORE": {
    order_id: "EC-RFD-BEFORE",
    customer_id: "CUST-3001",
    status: "unshipped",
    shipment_status: "pending",
    payment_status: "paid",
    created_at: "2026-01-12T08:00:00.000Z",
    delivered_at: undefined,
    items: [{ sku: "SKU-7", qty: 1 }],
    amount: 120,
    currency: "CNY",
    high_risk_refund: false,
    missing_required_info: false
  },
  "EC-RFD-AFTER": {
    order_id: "EC-RFD-AFTER",
    customer_id: "CUST-3002",
    status: "delivered",
    shipment_status: "delivered",
    payment_status: "paid",
    created_at: "2026-01-02T08:00:00.000Z",
    delivered_at: "2026-01-04T09:00:00.000Z",
    items: [{ sku: "SKU-8", qty: 1 }],
    amount: 180,
    currency: "CNY",
    high_risk_refund: false,
    missing_required_info: false
  },
  "EC-RFD-HIGH": {
    order_id: "EC-RFD-HIGH",
    customer_id: "CUST-3003",
    status: "delivered",
    shipment_status: "delivered",
    payment_status: "paid",
    created_at: "2026-01-01T08:00:00.000Z",
    delivered_at: "2026-01-03T09:00:00.000Z",
    items: [{ sku: "SKU-9", qty: 1 }],
    amount: 2800,
    currency: "CNY",
    high_risk_refund: true,
    missing_required_info: false
  },
  "EC-MISSING-INFO": {
    order_id: "EC-MISSING-INFO",
    customer_id: "CUST-4001",
    status: "shipped",
    shipment_status: "unknown",
    payment_status: "paid",
    created_at: "2026-01-06T08:00:00.000Z",
    delivered_at: undefined,
    items: [{ sku: "SKU-10", qty: 1 }],
    amount: 60,
    currency: "CNY",
    missing_required_info: true,
    tracking_number: undefined
  },
  "EC-1001": {
    order_id: "EC-1001",
    customer_id: "CUST-LEGACY-1",
    status: "shipped",
    shipment_status: "in_transit",
    payment_status: "paid",
    created_at: "2026-01-15T08:00:00.000Z",
    delivered_at: undefined,
    items: [{ sku: "SKU-L1", qty: 1 }],
    amount: 199,
    currency: "CNY",
    delayed_days: 1,
    tracking_number: "TRACK-L1001"
  },
  "EC-1002": {
    order_id: "EC-1002",
    customer_id: "CUST-LEGACY-2",
    status: "delivered",
    shipment_status: "delivered",
    payment_status: "paid",
    created_at: "2026-01-11T08:00:00.000Z",
    delivered_at: "2026-01-13T09:00:00.000Z",
    items: [{ sku: "SKU-L2", qty: 1 }],
    amount: 89,
    currency: "CNY",
    return_window_expired: false,
    damaged_goods: false
  }
};

function withPolicyDerivations(order, policyParams = {}) {
  const delayedThreshold = Number(policyParams.delayedShipmentThresholdDays ?? 3);
  const riskAmountThreshold = Number(policyParams.highRiskAmountThreshold ?? 1000);
  const requireHumanForDamagedGoods = policyParams.requireHumanForDamagedGoods === true;
  const requireHumanForRefundAfterDelivery = policyParams.requireHumanForRefundAfterDelivery === true;

  const delayedDays = Number(order.delayed_days ?? 0);
  const highRiskByAmount = Number(order.amount ?? 0) >= riskAmountThreshold;
  const requiresHuman =
    order.shipment_status === "exception" ||
    order.missing_required_info === true ||
    (requireHumanForDamagedGoods && order.damaged_goods === true) ||
    (requireHumanForRefundAfterDelivery && order.status === "delivered") ||
    order.high_risk_refund === true ||
    highRiskByAmount;

  const handoffReason =
    order.shipment_status === "exception"
      ? "shipping_exception"
      : order.missing_required_info === true
        ? "missing_required_info"
        : requireHumanForDamagedGoods && order.damaged_goods === true
          ? "damaged_goods_manual_review"
          : requireHumanForRefundAfterDelivery && order.status === "delivered"
            ? "refund_after_delivery_manual_review"
            : order.high_risk_refund === true || highRiskByAmount
              ? "high_risk_refund"
              : delayedDays > delayedThreshold
                ? "delayed_shipment"
                : undefined;

  return {
    ...order,
    delayed_by_threshold: delayedDays > delayedThreshold,
    high_risk_by_amount: highRiskByAmount,
    requires_human: requiresHuman,
    handoff_reason: handoffReason
  };
}

export async function getOrderById(orderId, options = {}) {
  const raw = ORDER_FIXTURES[String(orderId)];
  if (!raw) {
    return {
      found: false,
      order_id: String(orderId),
      customer_id: "",
      status: "missing",
      shipment_status: "unknown",
      payment_status: "unknown",
      created_at: "",
      items: [],
      amount: 0,
      currency: "CNY"
    };
  }

  return {
    found: true,
    ...withPolicyDerivations(raw, options.policyParams)
  };
}

export async function getOrderByCustomer(customerId, orderId, options = {}) {
  if (orderId) {
    return getOrderById(orderId, options);
  }
  const match = Object.values(ORDER_FIXTURES).find((item) => item.customer_id === String(customerId));
  if (!match) {
    return {
      found: false,
      order_id: "",
      customer_id: String(customerId),
      status: "missing",
      shipment_status: "unknown",
      payment_status: "unknown",
      created_at: "",
      items: [],
      amount: 0,
      currency: "CNY"
    };
  }
  return {
    found: true,
    ...withPolicyDerivations(match, options.policyParams)
  };
}
