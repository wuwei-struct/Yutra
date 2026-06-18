import type { ConfigField, PackConfig } from "@yutra/pack-config-core";
import type { RuleCompilerArtifacts } from "@yutra/rule-compiler";

export type CreatorArtifactTab = keyof RuleCompilerArtifacts;

export const creatorArtifactTabs: Array<{ key: CreatorArtifactTab; label: string; note?: string }> = [
  { key: "agent", label: "agent.yutra.yaml", note: "not executed" },
  { key: "policy", label: "policy.yaml" },
  { key: "adapterConfig", label: "adapter.config.json", note: "mock only" },
  { key: "templates", label: "templates.json" },
  { key: "testCases", label: "test-cases.json" },
  { key: "traceExpectation", label: "trace.expectation.json" }
];

export const creatorArchetypes: Array<{ id: string; label: string; enabled: boolean }> = [
  { id: "request-resolution", label: "request-resolution / 请求处理型", enabled: true },
  { id: "intake-collector", label: "intake-collector / 信息采集型", enabled: false },
  { id: "knowledge-answering", label: "knowledge-answering / 知识问答型", enabled: false },
  { id: "approval-decision", label: "approval-decision / 审批裁决型", enabled: false },
  { id: "diagnostic-resolution", label: "diagnostic-resolution / 诊断排障型", enabled: false },
  { id: "process-orchestration", label: "process-orchestration / 流程编排型", enabled: false },
  { id: "content-production", label: "content-production / 内容生成型", enabled: false },
  { id: "data-insight", label: "data-insight / 数据洞察型", enabled: false },
  { id: "lead-engagement", label: "lead-engagement / 线索跟进型", enabled: false },
  { id: "monitoring-response", label: "monitoring-response / 监控预警型", enabled: false },
  { id: "human-handoff", label: "human-handoff / 人工协同型", enabled: false },
  { id: "policy-guard", label: "policy-guard / 策略守卫型", enabled: false },
  { id: "adapter-connector", label: "adapter-connector / 系统接入型", enabled: false },
  { id: "feedback-optimization", label: "feedback-optimization / 复盘优化型", enabled: false }
];

export function createRequestResolutionDemoConfig(): PackConfig {
  return {
    packConfigId: "request-resolution:ecommerce-basic-demo",
    packConfigVersion: "0.1.0",
    archetypeId: "request-resolution",
    archetypeVersion: "0.1.0",
    variantId: "ecommerce-basic-demo",
    variantVersion: "0.1.0",
    locale: "en",
    capabilities: {
      orderLookup: { value: true, source: "confirmedByUser", required: true },
      shippingLookup: { value: true, source: "confirmedByUser" },
      refundRequest: { value: true, source: "confirmedByUser" },
      returnRequest: { value: true, source: "confirmedByUser" },
      handoff: { value: true, source: "confirmedByUser", required: true }
    },
    businessObjects: [
      { objectId: "order", label: { en: "Order", zhCN: "订单" }, fields: ["order_id", "status", "amount"] },
      { objectId: "request", label: { en: "Request", zhCN: "请求" }, fields: ["request_type", "reason"] }
    ],
    rules: {
      "refundPolicy.autoRefundWhenNotShipped": {
        value: true,
        source: "defaultFromPack",
        label: { en: "Auto refund when not shipped", zhCN: "未发货自动退款" }
      },
      "refundPolicy.autoRefundMaxAmount": {
        value: 300,
        source: "defaultFromPack",
        label: { en: "Demo auto refund max amount", zhCN: "演示自动退款金额上限" },
        description: { en: "Demo value only. Replace in private implementation.", zhCN: "仅演示值，私有实施时替换。" }
      },
      "refundPolicy.shippedOrderStrategy": { value: "require_return_first", source: "confirmedByUser" },
      "refundPolicy.expiredAfterSaleStrategy": { value: "ask_for_more_info", source: "confirmedByUser" },
      "refundPolicy.apiFailureStrategy": { value: "retry_then_handoff", source: "confirmedByUser" },
      "handoffPolicy.highValueRefund": { value: true, source: "confirmedByUser" },
      "handoffPolicy.complaint": { value: true, source: "confirmedByUser" },
      "handoffPolicy.orderNotFound": { value: true, source: "confirmedByUser" },
      "handoffPolicy.ruleConflict": { value: true, source: "confirmedByUser" },
      "handoffPolicy.maxUserRetryCount": { value: 2, source: "defaultFromPack" },
      "responseStyle.tone": { value: "warm_professional", source: "confirmedByUser" },
      "responseStyle.includeReason": { value: true, source: "confirmedByUser" },
      "responseStyle.includeHumanSupportEntry": { value: true, source: "confirmedByUser" }
    },
    policies: {
      "publish.requiresHumanReview": { value: true, source: "defaultFromPack" }
    },
    adapters: [
      {
        adapterId: "order-adapter",
        mode: "mock",
        contractRef: "contracts/order-contract.md",
        fieldMappings: { orderId: "order_id" },
        containsRealEndpoint: false,
        containsSecret: false
      },
      {
        adapterId: "escalation-adapter",
        mode: "mock",
        contractRef: "contracts/escalation-contract.md",
        fieldMappings: { reasonCode: "reason_code" },
        containsRealEndpoint: false,
        containsSecret: false
      }
    ],
    templates: [
      {
        templateId: "response.default.demo",
        purpose: "demo response",
        locale: "en",
        text: {
          value: "Demo response template. Replace with private brand-approved copy during implementation.",
          source: "defaultFromPack"
        }
      }
    ],
    tests: [
      {
        testCaseId: "happy-path-demo",
        title: "Happy path demo",
        input: { request_type: "demo_request", order_id: "DEMO-ORDER" },
        expectedPath: ["triage", "resolve", "respond"],
        expectedOutcome: "completed",
        tags: ["demo", "mock"]
      }
    ],
    governance: {
      environment: "demo",
      publishable: true,
      requiresHumanReview: true,
      unconfirmedFieldPolicy: "block_publish",
      missingFieldPolicy: "block_compile",
      sideEffectPolicy: {
        maxAutoSideEffect: "read",
        requiresPolicyGuardFrom: "write"
      }
    },
    metadata: {
      publicDemo: true,
      containsCustomerData: false
    }
  };
}

export function updateConfigField<T>(field: ConfigField<T> | undefined, value: T): ConfigField<T> {
  return {
    ...(field ?? { source: "confirmedByUser" as const }),
    value,
    source: "confirmedByUser"
  };
}
