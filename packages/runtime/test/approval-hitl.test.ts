import { describe, expect, it } from "vitest";
import type { AgentSpec } from "@yutra/spec";
import { executeRun } from "../src/execute-run";

const approvalSpec: AgentSpec = {
  agent: "approval-hitl-test",
  initial_state: "await_approval",
  actions: [{ name: "request_approval", side_effect: "write" }],
  guards: [
    { name: "approval_granted", expression: 'ctx.approval_status == "approved"' },
    { name: "approval_denied", expression: 'ctx.approval_status == "denied"' },
    { name: "approval_pending", expression: 'ctx.approval_status == "pending"' },
    { name: "approval_escalated", expression: 'ctx.approval_status == "escalated"' }
  ],
  states: {
    await_approval: {
      actions: ["request_approval"],
      transitions: [
        { to: "approved", guard: "approval_granted" },
        { to: "denied", guard: "approval_denied" },
        { to: "pending_review", guard: "approval_pending" },
        { to: "escalated_review", guard: "approval_escalated" }
      ]
    },
    approved: { transitions: [{ to: "done" }] },
    denied: { final: true },
    pending_review: { handoff: true },
    escalated_review: { handoff: true },
    done: { final: true }
  }
};

function decisionPatch(status: "pending" | "approved" | "denied" | "escalated") {
  return {
    approval_status: status,
    approval_decision: {
      status,
      decisionId: `DEC-${status}`,
      approver: "security-approver",
      reason: `decision=${status}`,
      decidedAt: new Date().toISOString(),
      stub: true
    },
    ...(status === "pending" || status === "escalated"
      ? {
          human_review_request: {
            reviewId: `REV-${status}`,
            reasonCode: status === "escalated" ? "approval_escalated" : "approval_pending",
            reason: status === "escalated" ? "Escalated by approver." : "Waiting for human approval.",
            source: "tool",
            summary: status === "escalated" ? "Escalated to human reviewer." : "Pending human review.",
            requestedAt: new Date().toISOString()
          }
        }
      : {})
  };
}

describe("@yutra/runtime approval HITL contract", () => {
  it("pending approval leads to expected handoff path", async () => {
    const result = await executeRun({
      spec: approvalSpec,
      options: {
        actionRegistry: {
          request_approval: async () => ({
            ok: true,
            contextPatch: decisionPatch("pending")
          })
        }
      }
    });

    expect(result.status).toBe("handoff");
    expect(result.finalState).toBe("pending_review");
  });

  it("approved decision allows execution to continue", async () => {
    const result = await executeRun({
      spec: approvalSpec,
      options: {
        actionRegistry: {
          request_approval: async () => ({
            ok: true,
            contextPatch: decisionPatch("approved")
          })
        }
      }
    });

    expect(result.status).toBe("completed");
    expect(result.finalState).toBe("done");
  });

  it("denied decision leads to denied final path", async () => {
    const result = await executeRun({
      spec: approvalSpec,
      options: {
        actionRegistry: {
          request_approval: async () => ({
            ok: true,
            contextPatch: decisionPatch("denied")
          })
        }
      }
    });

    expect(result.status).toBe("completed");
    expect(result.finalState).toBe("denied");
  });

  it("escalated decision leads to human handoff path", async () => {
    const result = await executeRun({
      spec: approvalSpec,
      options: {
        actionRegistry: {
          request_approval: async () => ({
            ok: true,
            contextPatch: decisionPatch("escalated")
          })
        }
      }
    });

    expect(result.status).toBe("handoff");
    expect(result.finalState).toBe("escalated_review");
  });

  it("handoff payload conforms to HumanReviewRequest minimum shape", async () => {
    const result = await executeRun({
      spec: approvalSpec,
      options: {
        actionRegistry: {
          request_approval: async () => ({
            ok: true,
            contextPatch: decisionPatch("pending")
          })
        }
      }
    });

    const handoffEvent = (result.traceEvents ?? []).find((event) => event.type === "handoff.requested");
    const payload = (handoffEvent?.payload ?? {}) as Record<string, unknown>;
    expect(typeof payload.reviewId).toBe("string");
    expect(typeof payload.reasonCode).toBe("string");
    expect(typeof payload.reason).toBe("string");
    expect(typeof payload.source).toBe("string");
    expect(typeof payload.summary).toBe("string");
    expect(typeof payload.requestedAt).toBe("string");
  });
});
