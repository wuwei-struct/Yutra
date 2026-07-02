import type { ConfigField, PackConfig } from "@yutra/pack-config-core";
import type { RuleCompilerArtifacts } from "@yutra/rule-compiler";
import {
  APPROVAL_DECISION_BASIC_CONFIG,
  KNOWLEDGE_ANSWERING_BASIC_CONFIG,
  REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG
} from "../../../../packages/pack-config-core/src/sample-configs";

export type CreatorArtifactTab = keyof RuleCompilerArtifacts;
export type SupportedCreatorArchetype = "request-resolution" | "approval-decision" | "knowledge-answering";

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
  { id: "approval-decision", label: "approval-decision / 审批裁决型", enabled: true },
  { id: "intake-collector", label: "intake-collector / 信息采集型", enabled: false },
  { id: "knowledge-answering", label: "knowledge-answering / 知识问答型", enabled: true },
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

function cloneConfig(config: PackConfig): PackConfig {
  return structuredClone(config);
}

export function getDefaultPackConfigForArchetype(archetypeId: SupportedCreatorArchetype): PackConfig {
  if (archetypeId === "approval-decision") {
    return cloneConfig(APPROVAL_DECISION_BASIC_CONFIG);
  }
  if (archetypeId === "knowledge-answering") {
    return cloneConfig(KNOWLEDGE_ANSWERING_BASIC_CONFIG);
  }
  return cloneConfig(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG);
}

export function getDefaultImpactPathForArchetype(archetypeId: SupportedCreatorArchetype): string {
  if (archetypeId === "approval-decision") {
    return "rules.approvalPolicy.lowRiskMaxAmount";
  }
  if (archetypeId === "knowledge-answering") {
    return "rules.knowledgePolicy.minConfidence";
  }
  return "rules.refundPolicy.autoRefundMaxAmount";
}

export function createRequestResolutionDemoConfig(): PackConfig {
  return getDefaultPackConfigForArchetype("request-resolution");
}

export function createApprovalDecisionDemoConfig(): PackConfig {
  return getDefaultPackConfigForArchetype("approval-decision");
}

export function createKnowledgeAnsweringDemoConfig(): PackConfig {
  return getDefaultPackConfigForArchetype("knowledge-answering");
}

export function updateConfigField<T>(field: ConfigField<T> | undefined, value: T): ConfigField<T> {
  return {
    ...(field ?? { source: "confirmedByUser" as const }),
    value,
    source: "confirmedByUser"
  };
}
