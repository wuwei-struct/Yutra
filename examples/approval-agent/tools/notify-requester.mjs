import { createFunctionTool } from "@yutra/tool-core";

const notifyRequesterTool = createFunctionTool({
  name: "notify_requester_tool",
  sideEffect: "write",
  handler: async (_input, ctx) => ({
    ok: true,
    data: {
      notified: true,
      status: ctx.context.approval_status
    }
  })
});

export async function notifyRequester(ctx) {
  return notifyRequesterTool.run({}, {
    runId: ctx.runId,
    agent: ctx.spec.agent,
    state: ctx.currentState,
    context: ctx.context,
    now: new Date().toISOString()
  });
}
