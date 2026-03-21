import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FileKnowledgeProvider } from "@yutra/knowledge-core";
import { requestApproval } from "./tools/request-approval.mjs";
import { executeChange } from "./tools/execute-change.mjs";
import { notifyRequester } from "./tools/notify-requester.mjs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const policyKb = new FileKnowledgeProvider({
  files: [resolve(currentDir, "knowledge/policy.md")]
});

export const actionRegistry = {
  intake_request: async (ctx) => {
    return {
      ok: true,
      output: {
        received: true,
        requestType: ctx.context.request_type,
        target: ctx.context.target_resource
      }
    };
  },

  validate_request_data: async (ctx) => {
    const requestType = String(ctx.context.request_type ?? "");
    const target = String(ctx.context.target_resource ?? "");
    const valid = requestType.length > 0 && target.length > 0;

    return {
      ok: true,
      output: {
        isValidRequest: valid
      },
      contextPatch: {
        is_valid_request: valid
      }
    };
  },

  request_approval: async (ctx) => {
    const result = await requestApproval(ctx);
    const status = result.data?.status;
    const decisionId =
      result.data?.decisionId ??
      (typeof result.data?.requestId === "string" ? `${result.data.requestId}-decision` : undefined);
    const policy = await policyKb.query(
      { query: "high risk request", topK: 1 },
      {
        runId: ctx.runId,
        agent: ctx.spec.agent,
        state: ctx.currentState,
        context: ctx.context
      }
    );

    return {
      ok: result.ok,
      output: {
        approvalDecision: result.data,
        policy: policy[0]?.content
      },
      contextPatch: {
        approval_status:
          status === "approved"
            ? "approved"
            : status === "denied" || status === "rejected"
              ? "denied"
              : status === "escalated"
                ? "escalated"
                : "pending",
        approval_decision: result.data,
        policy_excerpt: policy[0]?.content,
        ...(result.data?.approver ? { approver: result.data.approver } : {}),
        ...(result.data?.reason ? { approval_reason: result.data.reason } : {}),
        ...(status === "pending" || status === "escalated"
          ? {
              ...(decisionId ? { review_id: decisionId } : {}),
              review_requested_at: new Date().toISOString(),
              human_review_request: {
                reviewId: decisionId ?? `review-${Date.now()}`,
                reasonCode: status === "escalated" ? "approval_escalated" : "approval_pending",
                reason:
                  status === "escalated"
                    ? "Approval escalated to higher reviewer."
                    : "Approval is pending manual review.",
                source: "tool",
                severity: status === "escalated" ? "high" : "medium",
                state: ctx.currentState,
                action: "request_approval",
                summary:
                  status === "escalated"
                    ? "Approval decision escalated; handoff to security reviewer."
                    : "Approval decision is pending; handoff to manual reviewer.",
                recommendedActions:
                  status === "escalated"
                    ? ["escalate_to_security", "collect_additional_evidence"]
                    : ["wait_for_approval", "collect_missing_context"],
                requestedAt: new Date().toISOString(),
                metadata: {
                  decisionId
                }
              }
            }
          : {})
      },
      error: result.error
    };
  },

  execute_change: async (ctx) => {
    const result = await executeChange(ctx);
    return {
      ok: result.ok,
      output: result.data,
      contextPatch: {
        execution_done: result.data?.executed ?? false
      },
      error: result.error
    };
  },

  notify_result: async (ctx) => {
    const result = await notifyRequester(ctx);
    return {
      ok: result.ok,
      output: result.data,
      contextPatch: {
        requester_notified: result.data?.notified ?? false
      },
      error: result.error
    };
  }
};

export default actionRegistry;
