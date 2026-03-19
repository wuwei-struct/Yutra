import { createFunctionTool } from "@yutra/tool-core";

const executeChangeTool = createFunctionTool({
  name: "execute_change_tool",
  sideEffect: "write",
  handler: async (_input, ctx) => {
    return {
      ok: true,
      data: {
        executed: true,
        requestType: ctx.context.request_type,
        targetResource: ctx.context.target_resource
      }
    };
  }
});

export async function executeChange(ctx) {
  return executeChangeTool.run({}, {
    runId: ctx.runId,
    agent: ctx.spec.agent,
    state: ctx.currentState,
    context: ctx.context,
    now: new Date().toISOString()
  });
}
