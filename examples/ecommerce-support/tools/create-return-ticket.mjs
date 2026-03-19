import { ticketTool } from "@yutra/tool-core";

export async function createReturnTicket(ctx) {
  const orderId = String(ctx.context.order_id ?? "");
  const result = await ticketTool.run(
    {
      ticketId: `RET-${orderId}`,
      action: "update",
      patch: {
        kind: "return",
        orderId
      }
    },
    {
      runId: ctx.runId,
      agent: ctx.spec.agent,
      state: ctx.currentState,
      context: ctx.context,
      now: new Date().toISOString()
    }
  );

  return result;
}
