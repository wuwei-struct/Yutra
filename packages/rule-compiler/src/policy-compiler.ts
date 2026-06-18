import type { PackConfig } from "@yutra/pack-config-core";

function ruleValue<T>(config: PackConfig, key: string, fallback: T): T {
  return (config.rules[key]?.value as T | undefined) ?? fallback;
}

export function compilePolicyArtifact(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    environment: config.governance.environment,
    failClosedPolicy: "enabled",
    generatedFrom: {
      packConfigId: config.packConfigId,
      packConfigVersion: config.packConfigVersion,
      configHash
    },
    sideEffectPolicy: {
      maxAutoSideEffect: config.governance.sideEffectPolicy?.maxAutoSideEffect ?? "read",
      requiresPolicyGuardFrom: config.governance.sideEffectPolicy?.requiresPolicyGuardFrom ?? "write"
    },
    handoffPolicy: {
      highValueRefund: ruleValue(config, "handoffPolicy.highValueRefund", true),
      complaint: ruleValue(config, "handoffPolicy.complaint", true),
      orderNotFound: ruleValue(config, "handoffPolicy.orderNotFound", true),
      ruleConflict: ruleValue(config, "handoffPolicy.ruleConflict", true),
      maxUserRetryCount: ruleValue(config, "handoffPolicy.maxUserRetryCount", 2)
    },
    refundPolicy: {
      autoRefundWhenNotShipped: ruleValue(config, "refundPolicy.autoRefundWhenNotShipped", true),
      autoRefundMaxAmount: ruleValue(config, "refundPolicy.autoRefundMaxAmount", 300),
      shippedOrderStrategy: ruleValue(config, "refundPolicy.shippedOrderStrategy", "require_return_first"),
      expiredAfterSaleStrategy: ruleValue(config, "refundPolicy.expiredAfterSaleStrategy", "ask_for_more_info"),
      apiFailureStrategy: ruleValue(config, "refundPolicy.apiFailureStrategy", "retry_then_handoff")
    },
    actionRules: [
      { action: "lookup_order", allow: true, reason: "mock read action" },
      { action: "check_shipping", allow: true, reason: "mock read action" },
      { action: "create_refund_request", allow: false, requireHandoff: true, reason: "write action remains guarded in public compiler" },
      { action: "create_return_request", allow: false, requireHandoff: true, reason: "write action remains guarded in public compiler" },
      { action: "escalate_human", allow: true, reason: "fail-closed handoff path" }
    ],
    noRealAdapter: true,
    noRealEndpoint: true
  };
}
