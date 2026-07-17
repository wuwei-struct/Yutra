import type { ScenarioPatternManifest, ScenarioPatternPublicExposure } from "./types";

function demoOnlyExposure(): ScenarioPatternPublicExposure {
  return {
    mode: "demo_only",
    containsCustomerData: false,
    containsRealEndpoint: false,
    containsSecret: false,
    containsCustomerSop: false,
    containsCommercialDeliveryAsset: false
  };
}

export const BUILTIN_SCENARIO_PATTERNS: ScenarioPatternManifest[] = [
  {
    schemaVersion: "1.0.0",
    patternId: "ecommerce-refund-demo",
    version: "0.1.0",
    name: { en: "Ecommerce Refund Demo", zhCN: "电商退款 Demo" },
    summary: {
      en: "Compose request handling, authorization, governance, mock integration, and human review around a refund outcome.",
      zhCN: "围绕退款处理结果组合请求处理、授权判断、治理、mock 接入与人工审核。"
    },
    primaryArchetypeId: "request-resolution",
    supportingArchetypeIds: ["approval-decision"],
    crossCuttingArchetypeIds: ["policy-guard", "adapter-connector", "human-handoff"],
    triggerPattern: "user_request",
    compositionRationale: {
      en: "Request Resolution owns the refund outcome; Approval Decision only describes high-risk authorization support.",
      zhCN: "请求处理型负责退款结果，审批裁决型只描述高风险授权支持。"
    },
    acceptanceSummary: {
      en: "The demo request is resolved, rejected, or handed off under mock-only policy and adapter boundaries.",
      zhCN: "demo 请求在仅 mock 的策略与 adapter 边界下被处理、拒绝或转人工。"
    },
    scenarioTags: ["ecommerce", "refund", "demo", "mock"],
    publicExposure: demoOnlyExposure()
  },
  {
    schemaVersion: "1.0.0",
    patternId: "customer-complaint-demo",
    version: "0.1.0",
    name: { en: "Customer Complaint Demo", zhCN: "客户投诉 Demo" },
    summary: {
      en: "Model a complaint as a scenario pattern that combines explanation, request handling, authorization, and human collaboration.",
      zhCN: "将投诉建模为组合解释、诉求处理、授权判断与人工协同的场景组合范式。"
    },
    primaryArchetypeId: "request-resolution",
    supportingArchetypeIds: ["knowledge-answering", "approval-decision"],
    crossCuttingArchetypeIds: ["human-handoff", "policy-guard"],
    triggerPattern: "user_request",
    compositionRationale: {
      en: "Knowledge Answering explains generic policy, Request Resolution owns the requested outcome, and Approval Decision represents authorization when required.",
      zhCN: "知识问答型解释通用策略，请求处理型负责诉求结果，审批裁决型在需要时表示授权判断。"
    },
    acceptanceSummary: {
      en: "The demo concern is explained, resolved, routed for authorization, or handed off without customer-specific procedures.",
      zhCN: "demo 诉求在不包含客户专属流程的前提下被解释、处理、转授权判断或转人工。"
    },
    scenarioTags: ["complaint", "service", "demo", "mock"],
    publicExposure: demoOnlyExposure()
  },
  {
    schemaVersion: "1.0.0",
    patternId: "renewal-churn-warning-demo",
    version: "0.1.0",
    name: { en: "Renewal Churn Warning Demo", zhCN: "续费流失预警 Demo" },
    summary: {
      en: "Describe a system-signal pattern for analysis, controlled engagement, human collaboration, and reviewed feedback.",
      zhCN: "描述由系统信号触发、包含分析、受控跟进、人工协同与复盘的场景组合范式。"
    },
    primaryArchetypeId: "monitoring-response",
    supportingArchetypeIds: ["data-insight", "lead-engagement"],
    crossCuttingArchetypeIds: ["human-handoff", "feedback-optimization"],
    triggerPattern: "system_event",
    compositionRationale: {
      en: "Monitoring Response owns signal handling, while Data Insight and Lead Engagement describe supporting analysis and follow-up outputs.",
      zhCN: "监控预警型负责信号响应，数据洞察型与线索跟进型描述辅助分析和后续跟进产出。"
    },
    acceptanceSummary: {
      en: "The demo signal is classified and routed with contract-only support and no live business system connection.",
      zhCN: "demo 信号在 contract-only 支持下被分类和路由，不连接真实业务系统。"
    },
    scenarioTags: ["renewal", "churn-warning", "system-event", "contract-only", "demo"],
    publicExposure: demoOnlyExposure()
  }
];
