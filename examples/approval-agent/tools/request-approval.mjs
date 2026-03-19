import { approvalTool } from "@yutra/tool-core";

export async function requestApproval(ctx) {
  const decision = String(ctx.context.approval_decision ?? "pending");
  const action = decision === "approved" ? "approve" : decision === "denied" ? "reject" : "pending";

  const result = await approvalTool.run(
    {
      requestId: `APR-${String(ctx.context.target_resource ?? "UNKNOWN")}`,
      action,
      approver: "security-approver"
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
