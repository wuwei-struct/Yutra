import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FileKnowledgeProvider } from "@yutra/knowledge-core";
import { createFunctionTool } from "@yutra/tool-core";
import { renderResponseTemplateToChannelMessage } from "./adapters/channel-response-adapter.mjs";
import { checkReturnEligibility as checkReturnEligibilityAdapter } from "./adapters/return-adapter.mjs";
import { checkRefundEligibility as checkRefundEligibilityAdapter } from "./adapters/refund-adapter.mjs";
import { lookupOrderTool } from "./tools/lookup-order.mjs";
import { checkShippingTool } from "./tools/check-shipping.mjs";
import { createReturnTicket } from "./tools/create-return-ticket.mjs";
import { createRefundTicket } from "./tools/create-refund-ticket.mjs";
import { escalateHumanTool } from "./tools/escalate-human.mjs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const kb = new FileKnowledgeProvider({
  files: [
    resolve(currentDir, "knowledge/faq.md"),
    resolve(currentDir, "knowledge/return-policy.md"),
    resolve(currentDir, "knowledge/refund-policy.md"),
    resolve(currentDir, "knowledge/shipping-policy.md")
  ]
});

function adapterOptionsFromContext(context = {}) {
  return {
    adapterMode: context.adapter_mode,
    dryRun: context.adapter_dry_run,
    environment: context.environment
  };
}

function compactPatch(patch) {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

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
      { text: String(ctx.input.text ?? ctx.input.message ?? "") },
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
      contextPatch: compactPatch({
        issue_type: result.data?.issueType ?? "shipping"
      }),
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
      contextPatch: compactPatch({
        order_found: result.data?.orderFound ?? false,
        order_status: result.data?.status ?? "unknown",
        shipping_status: result.data?.shippingStatus ?? "unknown",
        return_eligible: result.data?.returnEligible ?? false,
        refund_eligible: result.data?.refundEligible ?? false,
        shipping_delay_days: result.data?.delayedDays ?? 0,
        shipping_delayed: result.data?.delayedByThreshold ?? false,
        shipping_exception: result.data?.shippingException ?? false,
        tracking_number_found: result.data?.trackingNumberFound ?? true,
        return_window_expired: result.data?.returnWindowExpired ?? false,
        damaged_goods: result.data?.damagedGoods ?? false,
        refund_amount: result.data?.refundAmount ?? 0,
        high_risk_refund: result.data?.highRiskRefund ?? false,
        missing_required_info: result.data?.missingRequiredInfo ?? false,
        requires_human: result.data?.requiresHuman ?? false,
        handoff_reason: result.data?.handoffReason
      }),
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

    const channelMessage = renderResponseTemplateToChannelMessage(
      {
        channel: "generic",
        templateKey: shipping.data?.requiresHuman ? "handoff" : "shipping",
        runId: ctx.runId,
        state: ctx.currentState,
        variables: {
          order_id: ctx.context.order_id,
          shipping_status: shipping.data?.shippingStatus,
          handoff_reason: shipping.data?.handoffReason
        }
      },
      adapterOptionsFromContext(ctx.context)
    );

    return {
      ok: shipping.ok,
      output: {
        shipping: shipping.data,
        knowledge: policy[0]?.content,
        channelMessage
      },
      contextPatch: compactPatch({
        shipping_note: shipping.data?.note,
        policy_excerpt: policy[0]?.content,
        requires_human: shipping.data?.requiresHuman ?? false,
        handoff_reason: shipping.data?.handoffReason
      }),
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

    const decision = await checkReturnEligibilityAdapter(
      {
        found: ctx.context.order_found === true,
        return_window_expired: ctx.context.return_window_expired === true,
        damaged_goods: ctx.context.damaged_goods === true,
        missing_required_info: ctx.context.missing_required_info === true
      },
      {
        policyParams: ctx.context.policy_params ?? {},
        ...adapterOptionsFromContext(ctx.context)
      }
    );

    const requiresHuman =
      decision.next_step === "handoff" ||
      ctx.context.damaged_goods === true ||
      ctx.context.missing_required_info === true;

    const handoffReason =
      decision.next_step === "handoff"
        ? decision.reason_code
        : ctx.context.damaged_goods === true
          ? "damaged_goods_manual_review"
          : ctx.context.missing_required_info === true
            ? "missing_required_info"
            : undefined;

    return {
      ok: true,
      output: {
        returnEligible: decision.eligible,
        policy: policy[0]?.content,
        decision
      },
      contextPatch: compactPatch({
        return_eligible: decision.eligible,
        policy_excerpt: policy[0]?.content,
        requires_human: requiresHuman,
        handoff_reason: handoffReason
      })
    };
  },

  create_return_request: async (ctx) => {
    const ticket = await createReturnTicket(ctx);
    return {
      ok: ticket.ok,
      output: ticket.data,
      contextPatch: compactPatch({
        return_ticket_id: ticket.data?.ticketId
      }),
      error: ticket.error,
      meta: ticket.meta
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

    const decision = await checkRefundEligibilityAdapter(
      {
        found: ctx.context.order_found === true,
        status: ctx.context.order_status,
        amount: Number(ctx.context.refund_amount ?? 0),
        high_risk_refund: ctx.context.high_risk_refund === true,
        missing_required_info: ctx.context.missing_required_info === true
      },
      {
        policyParams: ctx.context.policy_params ?? {},
        ...adapterOptionsFromContext(ctx.context)
      }
    );

    const requiresHuman =
      decision.next_step === "handoff" ||
      ctx.context.high_risk_refund === true ||
      ctx.context.missing_required_info === true;

    const handoffReason =
      decision.next_step === "handoff"
        ? decision.reason_code
        : ctx.context.high_risk_refund === true
          ? "high_risk_refund"
          : ctx.context.missing_required_info === true
            ? "missing_required_info"
            : undefined;

    return {
      ok: true,
      output: {
        refundEligible: decision.eligible,
        policy: policy[0]?.content,
        decision
      },
      contextPatch: compactPatch({
        refund_eligible: decision.eligible,
        policy_excerpt: policy[0]?.content,
        requires_human: requiresHuman,
        handoff_reason: handoffReason
      })
    };
  },

  create_refund_request: async (ctx) => {
    const ticket = await createRefundTicket(ctx);
    return {
      ok: ticket.ok,
      output: ticket.data,
      contextPatch: compactPatch({
        refund_ticket_id: ticket.data?.ticketId,
        refund_status: ticket.data?.refundStatus
      }),
      error: ticket.error,
      meta: ticket.meta
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

    const channelMessage = renderResponseTemplateToChannelMessage(
      {
        channel: "generic",
        templateKey: "handoff",
        runId: ctx.runId,
        state: ctx.currentState,
        variables: {
          order_id: ctx.context.order_id,
          handoff_reason: ctx.context.handoff_reason
        }
      },
      adapterOptionsFromContext(ctx.context)
    );

    return {
      ok: true,
      output: {
        policy: policy[0]?.content,
        channelMessage
      },
      contextPatch: compactPatch({
        requires_human: true,
        policy_excerpt: policy[0]?.content
      })
    };
  },

  escalate_human: async (ctx) => {
    const result = await escalateHumanTool.run(
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
      contextPatch: compactPatch({
        requires_human: true,
        escalation_id: result.data?.escalationId,
        handoff_reason: result.data?.reason ?? "manual_review_required"
      }),
      error: result.error,
      meta: result.meta
    };
  }
};

export default actionRegistry;



