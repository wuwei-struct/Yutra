import type { Tool, ToolResult } from "../types";

export interface ApprovalToolInput {
  requestId: string;
  approver?: string;
  action?: "approve" | "reject" | "pending";
}

export interface ApprovalToolOutput {
  requestId: string;
  status: "pending" | "approved" | "rejected";
  approver?: string;
  note: string;
  stub: true;
}

export const approvalTool: Tool<ApprovalToolInput, ApprovalToolOutput> = {
  name: "approval_tool",
  description: "Stub approval workflow tool.",
  sideEffect: "write",
  async run(input): Promise<ToolResult<ApprovalToolOutput>> {
    const action = input.action ?? "pending";
    const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "pending";

    return {
      ok: true,
      data: {
        requestId: input.requestId,
        status,
        approver: input.approver,
        note: "approval_tool is a stub in v0.1",
        stub: true
      }
    };
  }
};
