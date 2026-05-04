import { createEscalationTicket } from "../../../adapters/escalation-adapter.mjs";

function adapterOptionsFromContext(context = {}) {
  return {
    adapterMode: context.adapter_mode,
    dryRun: context.adapter_dry_run,
    environment: context.environment,
    policyParams: context.policy_params ?? {}
  };
}

export async function run(input, ctx) {
  const reasonCode = String(input?.reasonCode ?? ctx?.context?.handoff_reason ?? "manual_review_required");
  const orderId = String(input?.order_id ?? ctx?.context?.order_id ?? "unknown-order");
  const priority = String(input?.priority ?? (reasonCode.includes("high_risk") ? "high" : "medium"));
  const summary = String(input?.summary ?? `Escalated by runtime for reason: ${reasonCode}`);

  const ticket = await createEscalationTicket(
    {
      order_id: orderId,
      reason_code: reasonCode,
      summary,
      queue: "manual-review",
      priority
    },
    adapterOptionsFromContext(ctx?.context)
  );

  return {
    ok: true,
    data: {
      ticket_id: String(ticket.ticket_id ?? ""),
      queue: String(ticket.queue ?? "manual-review"),
      priority: String(ticket.priority ?? priority),
      handoff_status: String(ticket.handoff_status ?? "queued"),
      next_step: String(ticket.next_step ?? "human_review")
    },
    contextPatch: {
      requires_human: true,
      escalation_id: ticket.ticket_id,
      handoff_reason: ticket.reason_code ?? reasonCode
    },
    meta: {
      adapter: "escalation-adapter",
      contractVersion: "v0.1"
    }
  };
}
