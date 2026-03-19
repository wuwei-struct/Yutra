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
        approval: result.data,
        policy: policy[0]?.content
      },
      contextPatch: {
        approval_status:
          result.data?.status === "approved"
            ? "approved"
            : result.data?.status === "rejected"
              ? "denied"
              : "pending",
        policy_excerpt: policy[0]?.content
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
