import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FileKnowledgeProvider } from "@yutra/knowledge-core";
import { createFunctionTool } from "@yutra/tool-core";
import { lookupOrderTool } from "./tools/lookup-order.mjs";
import { checkShippingTool } from "./tools/check-shipping.mjs";
import { createReturnTicket } from "./tools/create-return-ticket.mjs";
import { createRefundTicket } from "./tools/create-refund-ticket.mjs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const kb = new FileKnowledgeProvider({
  files: [resolve(currentDir, "knowledge/faq.md"), resolve(currentDir, "knowledge/return-policy.md")]
});

const classifyIssueTool = createFunctionTool({
  name: "classify_issue_tool",
  sideEffect: "none",
  handler: async (input) => {
    const text = String((input && input.text) || "").toLowerCase();
    const issueType = text.includes("return")
      ? "return"
      : text.includes("refund")
        ? "refund"
        : "shipping";

    return {
      ok: true,
      data: { issueType }
    };
  }
});

export const actionRegistry = {
  classify_issue: async (ctx) => {
    const result = await classifyIssueTool.run(
      { text: String(ctx.input.text ?? "") },
      {
        runId: ctx.runId,
        agent: ctx.spec.agent,
        state: ctx.currentState,
        context: ctx.context,
        now: new Date().toISOString()
      }
    );

    return {
      ok: result.ok,
      output: result.data,
      contextPatch: {
        issue_type: result.data?.issueType ?? "shipping"
      },
      error: result.error,
      meta: result.meta
    };
  },

  lookup_order: async (ctx) => {
    const result = await lookupOrderTool.run(
      {},
      {
        runId: ctx.runId,
        agent: ctx.spec.agent,
        state: ctx.currentState,
        context: ctx.context,
        now: new Date().toISOString()
      }
    );

    return {
      ok: result.ok,
      output: result.data,
      contextPatch: {
        order_found: result.data?.orderFound ?? false,
        shipping_status: result.data?.shippingStatus ?? "unknown",
        return_eligible: result.data?.returnEligible ?? false,
        refund_eligible: result.data?.refundEligible ?? false
      },
      error: result.error,
      meta: result.meta
    };
  },

  check_shipping: async (ctx) => {
    const shipping = await checkShippingTool.run(
      {},
      {
        runId: ctx.runId,
        agent: ctx.spec.agent,
        state: ctx.currentState,
        context: ctx.context,
        now: new Date().toISOString()
      }
    );

    const policy = await kb.query(
      { query: "shipping lookup", topK: 1 },
      {
        runId: ctx.runId,
        agent: ctx.spec.agent,
        state: ctx.currentState,
        context: ctx.context
      }
    );

    return {
      ok: shipping.ok,
      output: {
        shipping: shipping.data,
        knowledge: policy[0]?.content
      },
      contextPatch: {
        shipping_note: shipping.data?.note,
        policy_excerpt: policy[0]?.content
      },
      error: shipping.error
    };
  },

  check_return_eligibility: async (ctx) => {
    const policy = await kb.query(
      { query: "return window", topK: 1 },
      {
        runId: ctx.runId,
        agent: ctx.spec.agent,
        state: ctx.currentState,
        context: ctx.context
      }
    );

    return {
      ok: true,
      output: {
        returnEligible: Boolean(ctx.context.return_eligible),
        policy: policy[0]?.content
      },
      contextPatch: {
        policy_excerpt: policy[0]?.content
      }
    };
  },

  create_return_request: async (ctx) => {
    const ticket = await createReturnTicket(ctx);
    return {
      ok: ticket.ok,
      output: ticket.data,
      contextPatch: {
        return_ticket_id: ticket.data?.ticketId
      },
      error: ticket.error
    };
  },

  check_refund_eligibility: async (ctx) => {
    const policy = await kb.query(
      { query: "refund timeline", topK: 1 },
      {
        runId: ctx.runId,
        agent: ctx.spec.agent,
        state: ctx.currentState,
        context: ctx.context
      }
    );

    return {
      ok: true,
      output: {
        refundEligible: Boolean(ctx.context.refund_eligible),
        policy: policy[0]?.content
      },
      contextPatch: {
        policy_excerpt: policy[0]?.content
      }
    };
  },

  create_refund_request: async (ctx) => {
    const ticket = await createRefundTicket(ctx);
    return {
      ok: ticket.ok,
      output: ticket.data,
      contextPatch: {
        refund_ticket_id: ticket.data?.ticketId
      },
      error: ticket.error
    };
  },

  inform_policy: async (ctx) => {
    const policy = await kb.query(
      { query: "manual review", topK: 1 },
      {
        runId: ctx.runId,
        agent: ctx.spec.agent,
        state: ctx.currentState,
        context: ctx.context
      }
    );

    return {
      ok: true,
      output: {
        policy: policy[0]?.content
      },
      contextPatch: {
        requires_human: true,
        policy_excerpt: policy[0]?.content
      }
    };
  }
};

export default actionRegistry;
