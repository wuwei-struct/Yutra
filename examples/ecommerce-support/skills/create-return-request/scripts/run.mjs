import { createReturnRequest } from "../../../adapters/return-adapter.mjs";

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
        message: "create_return_request requires order_id.",
        retryable: false
      }
    };
  }

  const reason = String(input?.reason ?? ctx?.context?.return_reason ?? "customer_request");
  const result = await createReturnRequest(
    {
      order_id: orderId
    },
    reason,
    adapterOptionsFromContext(ctx?.context)
  );

  return {
    ok: true,
    data: {
      request_id: String(result.request_id ?? ""),
      eligible: result.eligible === true,
      reason_code: String(result.reason_code ?? ""),
      next_step: String(result.next_step ?? "resolved")
    },
    contextPatch: {
      return_ticket_id: result.request_id
    },
    meta: {
      adapter: "return-adapter",
      contractVersion: "v0.1",
      reason
    }
  };
}
