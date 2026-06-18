import type { PackConfig } from "@yutra/pack-config-core";

export function compileTemplatesArtifact(config: PackConfig, locale: "en" | "zh-CN"): Record<string, unknown> {
  const zh = locale === "zh-CN";
  return {
    locale,
    generatedFrom: {
      packConfigId: config.packConfigId,
      templateSource: "generic_demo"
    },
    ask_missing_info: {
      text: zh ? "需要补充必要信息后才能继续处理。请提供 {{missing_fields}}。" : "Additional information is required before continuing. Please provide {{missing_fields}}."
    },
    handoff_required: {
      text: zh ? "该请求需要人工处理。原因：{{handoff_reason}}。" : "This request requires human review. Reason: {{handoff_reason}}."
    },
    request_received: {
      text: zh ? "已收到请求，我们将按当前规则进行检查。" : "Request received. The configured rules will now be checked."
    },
    policy_rejected: {
      text: zh ? "根据当前规则，该请求无法自动处理。原因：{{policy_reason}}。" : "This request cannot be handled automatically under the current rules. Reason: {{policy_reason}}."
    },
    action_succeeded: {
      text: zh ? "处理动作已完成：{{action_name}}。" : "The action completed successfully: {{action_name}}."
    },
    action_failed: {
      text: zh ? "处理动作失败并进入安全兜底：{{error_code}}。" : "The action failed and moved to fail-closed handling: {{error_code}}."
    }
  };
}
