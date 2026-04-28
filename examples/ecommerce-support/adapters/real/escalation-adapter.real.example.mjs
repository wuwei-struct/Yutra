import {
  baseHeaders,
  dryRunMeta,
  ensureRequiredFields,
  requestWithRetry,
  resolveRealAdapterConfig
} from "./common.mjs";

function mapEscalation(raw) {
  const mapped = {
    ticket_id: String(raw.ticket_id ?? ""),
    queue: String(raw.queue ?? "manual-review"),
    priority: String(raw.priority ?? "medium"),
    handoff_status: String(raw.handoff_status ?? "queued"),
    next_step: String(raw.next_step ?? "human_review"),
    reason_code: String(raw.reason_code ?? "manual_review_required"),
    summary: String(raw.summary ?? "")
  };

  ensureRequiredFields(["ticket_id", "queue", "priority", "handoff_status", "next_step"], mapped, "escalation");
  return mapped;
}

export async function createEscalationTicket(payload, options = {}) {
  const config = resolveRealAdapterConfig("escalation", options);

  if (config.dryRun) {
    return {
      ...mapEscalation({
        ticket_id: `ESC-${String(payload?.order_id ?? "UNKNOWN")}`,
        queue: payload?.queue ?? "manual-review",
        priority: payload?.priority ?? "medium",
        handoff_status: "queued",
        next_step: "human_review",
        reason_code: payload?.reason_code ?? "manual_review_required",
        summary: payload?.summary ?? "Escalated by dry-run adapter"
      }),
      adapter_meta: dryRunMeta(config)
    };
  }

  const url = `${config.baseUrl}/escalations`;
  const response = await requestWithRetry(
    url,
    {
      method: "POST",
      headers: baseHeaders(config),
      body: JSON.stringify(payload)
    },
    config
  );

  const json = await response.json();
  return mapEscalation(json);
}
