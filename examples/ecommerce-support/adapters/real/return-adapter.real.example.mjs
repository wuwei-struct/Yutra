import {
  baseHeaders,
  dryRunMeta,
  ensureRequiredFields,
  requestWithRetry,
  resolveRealAdapterConfig
} from "./common.mjs";

function mapReturnDecision(raw) {
  const mapped = {
    eligible: raw.eligible === true,
    reason_code: String(raw.reason_code ?? "unknown"),
    reason: String(raw.reason ?? ""),
    request_id: raw.request_id ? String(raw.request_id) : undefined,
    next_step: String(raw.next_step ?? "inform_policy")
  };
  ensureRequiredFields(["eligible", "reason_code", "reason", "next_step"], mapped, "return");
  return mapped;
}

export async function checkReturnEligibility(order, input = {}) {
  const config = resolveRealAdapterConfig("return", input);

  if (config.dryRun) {
    return {
      ...mapReturnDecision(
        order?.found === false
          ? {
              eligible: false,
              reason_code: "order_not_found",
              reason: "Order not found in upstream system.",
              next_step: "handoff"
            }
          : order?.damaged_goods === true
            ? {
                eligible: false,
                reason_code: "damaged_goods_manual_review",
                reason: "Damaged goods require manual review.",
                next_step: "handoff"
              }
            : {
                eligible: true,
                reason_code: "return_eligible",
                reason: "Order is eligible for return.",
                next_step: "create_return_request"
              }
      ),
      adapter_meta: dryRunMeta(config)
    };
  }

  const url = `${config.baseUrl}/returns/eligibility`;
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
  return mapReturnDecision(json);
}

export async function createReturnRequest(order, reason = "customer_request", input = {}) {
  const config = resolveRealAdapterConfig("return", input);

  if (config.dryRun) {
    return {
      ...mapReturnDecision({
        eligible: true,
        reason_code: "return_ticket_created",
        reason: "Return request created in dry-run mode.",
        request_id: `RET-${String(order?.order_id ?? "UNKNOWN")}`,
        next_step: "resolved"
      }),
      adapter_meta: dryRunMeta(config)
    };
  }

  const url = `${config.baseUrl}/returns/requests`;
  const response = await requestWithRetry(
    url,
    {
      method: "POST",
      headers: baseHeaders(config),
      body: JSON.stringify({ order, reason })
    },
    config
  );

  const json = await response.json();
  return mapReturnDecision(json);
}
