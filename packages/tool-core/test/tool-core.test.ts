import { describe, expect, it } from "vitest";
import {
  ToolRegistry,
  approvalTool,
  createFunctionTool,
  ticketTool,
  type ApprovalDecisionStatus,
  type ToolRunContext
} from "../src/index";

const ctx: ToolRunContext = {
  runId: "run-1",
  agent: "agent-1",
  context: {}
};

describe("@yutra/tool-core", () => {
  it("function_tool can execute a local function", async () => {
    const tool = createFunctionTool<{ x: number }, { doubled: number }>({
      name: "function_tool",
      handler: async (input) => ({
        ok: true,
        data: { doubled: input.x * 2 }
      })
    });

    const result = await tool.run({ x: 3 }, ctx);
    expect(result.ok).toBe(true);
    expect(result.data?.doubled).toBe(6);
  });

  it("tool registry can register and resolve tool", () => {
    const registry = new ToolRegistry();
    const tool = createFunctionTool({
      name: "function_tool",
      handler: () => ({ ok: true, data: { ok: true } })
    });

    registry.register(tool);

    expect(registry.has("function_tool")).toBe(true);
    expect(registry.get("function_tool")?.name).toBe("function_tool");
    expect(registry.list()).toHaveLength(1);
  });

  it("approval_tool returns stable ApprovalDecision shape", async () => {
    const statuses: ApprovalDecisionStatus[] = ["pending", "approved", "denied", "escalated"];
    const actions = ["pending", "approve", "deny", "escalate"] as const;
    for (const [index, action] of actions.entries()) {
      const result = await approvalTool.run({ requestId: `APR-${index}`, action }, ctx);
      expect(result.ok).toBe(true);
      expect(statuses).toContain(result.data?.status);
      expect(typeof result.data?.decisionId).toBe("string");
      expect(result.data?.stub).toBe(true);
    }
  });

  it("ticket_tool returns structured stub result", async () => {
    const result = await ticketTool.run({ ticketId: "TCK-1", action: "update", patch: { owner: "ops" } }, ctx);
    expect(result.ok).toBe(true);
    expect(result.data?.status).toBe("updated");
    expect(result.data?.payload?.owner).toBe("ops");
    expect(result.data?.stub).toBe(true);
  });
});
