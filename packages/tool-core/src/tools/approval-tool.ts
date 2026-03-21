import type { Tool, ToolResult } from "../types";

export type ApprovalDecisionStatus = "pending" | "approved" | "denied" | "escalated";

export interface ApprovalDecision {
  status: ApprovalDecisionStatus;
  decisionId: string;
  approver?: string;
  reason?: string;
  decidedAt?: string;
  expiresAt?: string;
  requiredNextStep?: string;
  metadata?: Record<string, unknown>;
  stub?: boolean;
}

export interface ApprovalToolInput {
  requestId: string;
  approver?: string;
  action?: "approve" | "deny" | "reject" | "pending" | "escalate";
  reason?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export type ApprovalToolOutput = ApprovalDecision;

export const approvalTool: Tool<ApprovalToolInput, ApprovalToolOutput> = {
  name: "approval_tool",
  description: "Stub approval workflow tool.",
  sideEffect: "write",
  async run(input): Promise<ToolResult<ApprovalToolOutput>> {
    const action = input.action ?? "pending";
    const status: ApprovalDecisionStatus =
      action === "approve"
        ? "approved"
        : action === "deny" || action === "reject"
          ? "denied"
          : action === "escalate"
            ? "escalated"
            : "pending";
    const now = new Date().toISOString();

    return {
      ok: true,
      data: {
        decisionId: `${input.requestId}-${status}`,
        status,
        approver: input.approver,
        reason: input.reason ?? "approval_tool is a stub in v0.1",
        decidedAt: status === "pending" ? undefined : now,
        expiresAt: input.expiresAt,
        requiredNextStep:
          status === "pending"
            ? "wait_for_human_review"
            : status === "escalated"
              ? "escalate_to_security_reviewer"
              : undefined,
        metadata: {
          requestId: input.requestId,
          ...(input.metadata ?? {})
        },
        stub: true
      }
    };
  }
};
