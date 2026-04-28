import { createFunctionTool } from "@yutra/tool-core";
import { createRefundRequest } from "../adapters/refund-adapter.mjs";

function adapterOptionsFromContext(context = {}) {
  return {
    adapterMode: context.adapter_mode,
    dryRun: context.adapter_dry_run,
    environment: context.environment
  };
}

const refundTicketTool = createFunctionTool({
  name: "create_refund_ticket_tool",
  sideEffect: "write",
  description: "Refund Adapter contract bridge: createRefundRequest(order, amount, reason).",
  handler: async (_input, ctx) => {
    const result = await createRefundRequest(
      {
        order_id: String(ctx.context.order_id ?? ""),
        amount: Number(ctx.context.refund_amount ?? 0)
      },
      Number(ctx.context.refund_amount ?? 0),
      String(ctx.context.refund_reason ?? "customer_request"),
      {
        ...adapterOptionsFromContext(ctx.context)
      }
    );

    return {
      ok: true,
      data: {
        ticketId: result.refund_request_id,
        refundStatus: result.refund_status,
        nextStep: result.next_step,
        reasonCode: result.reason_code
      },
      meta: {
        adapter: "refund-adapter",
        contractVersion: "v0.1"
      }
    };
  }
});

export async function createRefundTicket(ctx) {
  return refundTicketTool.run(
    {},
    {
      runId: ctx.runId,
      agent: ctx.spec.agent,
      state: ctx.currentState,
      context: ctx.context,
      now: new Date().toISOString()
    }
  );
}
