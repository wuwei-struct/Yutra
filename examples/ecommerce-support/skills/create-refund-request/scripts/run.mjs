import { createRefundRequest } from "../../../adapters/refund-adapter.mjs";

function adapterOptionsFromContext(context = {}) {
  return {
    adapterMode: context.adapter_mode,
    dryRun: context.adapter_dry_run,
    environment: context.environment,
    policyParams: context.policy_params ?? {}
  };
}

export async function run(input, ctx) {
  const orderId = String(input?.order_id ?? ctx?.context?.order_id ?? "");
  if (!orderId) {
    return {
      ok: false,
      error: {
        code: "ORDER_ID_REQUIRED",
        message: "create_refund_request requires order_id.",
        retryable: false
      }
    };
  }

  const amount = Number(input?.amount ?? ctx?.context?.refund_amount ?? 0);
  const reason = String(input?.reason ?? ctx?.context?.refund_reason ?? "customer_request");
  const result = await createRefundRequest(
    {
      order_id: orderId,
      amount
    },
    amount,
    reason,
    adapterOptionsFromContext(ctx?.context)
  );

  return {
    ok: true,
    data: {
      refund_request_id: String(result.refund_request_id ?? ""),
      refund_status: String(result.refund_status ?? "unknown"),
      reason_code: String(result.reason_code ?? ""),
      next_step: String(result.next_step ?? "resolved")
    },
    contextPatch: {
      refund_ticket_id: result.refund_request_id,
      refund_status: result.refund_status
    },
    meta: {
      adapter: "refund-adapter",
      contractVersion: "v0.1",
      amount,
      reason
    }
  };
}
