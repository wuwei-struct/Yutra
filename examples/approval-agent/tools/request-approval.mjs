import { approvalTool } from "@yutra/tool-core";

export async function requestApproval(ctx) {
  const decision = String(ctx.context.approval_decision_status ?? ctx.context.approval_decision ?? "pending");
  const action =
    decision === "approved"
      ? "approve"
      : decision === "denied"
        ? "reject"
        : decision === "escalated"
          ? "escalate"
          : "pending";

  const result = await approvalTool.run(
    {
      requestId: `APR-${String(ctx.context.target_resource ?? "UNKNOWN")}`,
      action,
      approver: "security-approver",
      reason: `decision from input: ${decision}`,
      metadata: {
        request_type: ctx.context.request_type,
        target_resource: ctx.context.target_resource
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
