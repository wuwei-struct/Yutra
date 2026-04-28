import { createFunctionTool } from "@yutra/tool-core";
import { createEscalationTicket } from "../adapters/escalation-adapter.mjs";

function adapterOptionsFromContext(context = {}) {
  return {
    adapterMode: context.adapter_mode,
    dryRun: context.adapter_dry_run,
    environment: context.environment
  };
}

export const escalateHumanTool = createFunctionTool({
  name: "escalate_human_tool",
  sideEffect: "write",
  description: "Escalation Adapter contract bridge: createEscalationTicket(payload).",
  handler: async (_input, ctx) => {
    const reason = String(ctx.context.handoff_reason ?? "manual_review_required");
    const ticket = await createEscalationTicket(
      {
        order_id: String(ctx.context.order_id ?? "unknown-order"),
        reason_code: reason,
        summary: `Escalated by runtime for reason: ${reason}`,
        queue: "manual-review",
        priority: reason.includes("high_risk") ? "high" : "medium"
      },
      {
        ...adapterOptionsFromContext(ctx.context)
      }
    );

    return {
      ok: true,
      data: {
        escalationId: ticket.ticket_id,
        queued: ticket.handoff_status === "queued",
        reason: ticket.reason_code,
        queue: ticket.queue,
        priority: ticket.priority
      },
      meta: {
        stub: ctx.context.adapter_mode !== "real",
        adapter: "escalation-adapter",
        contractVersion: "v0.1"
      }
    };
  }
});

export default escalateHumanTool;
