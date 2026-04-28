import {
  baseHeaders,
  dryRunMeta,
  ensureRequiredFields,
  requestWithRetry,
  resolveRealAdapterConfig
} from "./common.mjs";

function mapRefundDecision(raw) {
  const mapped = {
    eligible: raw.eligible === true,
    reason_code: String(raw.reason_code ?? "unknown"),
    reason: String(raw.reason ?? ""),
    refund_request_id: raw.refund_request_id ? String(raw.refund_request_id) : undefined,
    refund_status: String(raw.refund_status ?? "not_started"),
    next_step: String(raw.next_step ?? "handoff")
  };

  ensureRequiredFields(["eligible", "reason_code", "reason", "refund_status", "next_step"], mapped, "refund");
  return mapped;
}

export async function checkRefundEligibility(order, input = {}) {
  const config = resolveRealAdapterConfig("refund", input);

  if (config.dryRun) {
    const highRiskAmountThreshold = Number(input.policyParams?.highRiskAmountThreshold ?? 1000);
    const isHighRisk = order?.high_risk_refund === true || Number(order?.amount ?? 0) >= highRiskAmountThreshold;

    return {
      ...mapRefundDecision(
        order?.found === false
          ? {
              eligible: false,
              reason_code: "order_not_found",
              reason: "Order not found in upstream system.",
              refund_status: "not_started",
              next_step: "handoff"
            }
          : isHighRisk
            ? {
                eligible: false,
                reason_code: "high_risk_refund",
                reason: "Refund requires manual review because of risk threshold.",
                refund_status: "manual_review",
                next_step: "handoff"
              }
            : {
                eligible: true,
                reason_code: "refund_eligible",
                reason: "Refund request is eligible.",
                refund_status: "approved",
                next_step: "create_refund_request"
              }
      ),
      adapter_meta: dryRunMeta(config)
    };
  }

  const url = `${config.baseUrl}/refunds/eligibility`;
  const response = await requestWithRetry(
    url,
    {
      method: "POST",
      headers: baseHeaders(config),
      body: JSON.stringify({ order, policy_params: input.policyParams ?? {} })
    },
    config
  );

  const json = await response.json();
  return mapRefundDecision(json);
}

export async function createRefundRequest(order, amount, reason = "customer_request", input = {}) {
  const config = resolveRealAdapterConfig("refund", input);

  if (config.dryRun) {
    return {
      ...mapRefundDecision({
        eligible: true,
        reason_code: "refund_request_created",
        reason: "Refund request created in dry-run mode.",
        refund_request_id: `RFD-${String(order?.order_id ?? "UNKNOWN")}`,
        refund_status: "processing",
        next_step: "resolved"
      }),
      adapter_meta: dryRunMeta(config)
    };
  }

  const url = `${config.baseUrl}/refunds/requests`;
  const response = await requestWithRetry(
    url,
    {
      method: "POST",
      headers: baseHeaders(config),
      body: JSON.stringify({ order, amount, reason })
    },
    config
  );

  const json = await response.json();
  return mapRefundDecision(json);
}
