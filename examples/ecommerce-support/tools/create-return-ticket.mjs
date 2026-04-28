import { createFunctionTool } from "@yutra/tool-core";
import { createReturnRequest } from "../adapters/return-adapter.mjs";

function adapterOptionsFromContext(context = {}) {
  return {
    adapterMode: context.adapter_mode,
    dryRun: context.adapter_dry_run,
    environment: context.environment
  };
}

const returnTicketTool = createFunctionTool({
  name: "create_return_ticket_tool",
  sideEffect: "write",
  description: "Return Adapter contract bridge: createReturnRequest(order, reason).",
  handler: async (_input, ctx) => {
    const result = await createReturnRequest(
      {
        order_id: String(ctx.context.order_id ?? "")
      },
      String(ctx.context.return_reason ?? "customer_request"),
      {
        ...adapterOptionsFromContext(ctx.context)
      }
    );

    return {
      ok: true,
      data: {
        ticketId: result.request_id,
        nextStep: result.next_step,
        reasonCode: result.reason_code
      },
      meta: {
        adapter: "return-adapter",
        contractVersion: "v0.1"
      }
    };
  }
});

export async function createReturnTicket(ctx) {
  return returnTicketTool.run(
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
