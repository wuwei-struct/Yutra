import { RUNTIME_ADAPTER_CAPABILITY_IDS } from "./capability";
import type {
  OrchestratorRuntimeCompatibilityReport,
  ScenarioRuntimeAdapterDescriptor,
  ScenarioRuntimeAdapterExplainLocale
} from "./types";

function capabilitySummary(
  descriptor: ScenarioRuntimeAdapterDescriptor
): string {
  return RUNTIME_ADAPTER_CAPABILITY_IDS.map(
    (capabilityId) =>
      `${capabilityId}=${descriptor.capabilities[capabilityId]}`
  ).join(", ");
}

export function explainRuntimeAdapterContract(
  descriptor: ScenarioRuntimeAdapterDescriptor,
  compatibilityReport: OrchestratorRuntimeCompatibilityReport,
  locale: ScenarioRuntimeAdapterExplainLocale
): string {
  const blockers =
    compatibilityReport.blockers.length > 0
      ? compatibilityReport.blockers.map((blocker) => blocker.code).join(", ")
      : "none";
  const limits = descriptor.limits;

  if (locale === "zh-CN") {
    return [
      `Adapter ID / Version: ${descriptor.adapterId}@${descriptor.adapterVersion}`,
      `实现状态: ${descriptor.implementationStatus}`,
      `Protocol Version: ${descriptor.protocolVersion}`,
      `支持的 Orchestrator Schema: ${descriptor.supportedOrchestratorSchemaVersions.join(", ")}`,
      `支持的执行模型: ${descriptor.supportedExecutionModels.join(", ")}`,
      `支持的 Agent DSL Versions: ${descriptor.supportedAgentDslVersions.join(", ")}`,
      `Capabilities: ${capabilitySummary(descriptor)}`,
      `Limits: input=${limits.maxInvocationInputBytes}, output=${limits.maxInvocationOutputBytes}, timeout=${limits.maxTimeoutMs}, concurrency=${limits.maxConcurrentSlotInvocations}`,
      `兼容性: ${compatibilityReport.status}; currentRuntimeSupported=${compatibilityReport.currentRuntimeSupported}`,
      `Blockers: ${blockers}`,
      "Trace / Audit: Slot Trace 通过 invocation parent 关联 Orchestrator Trace，只返回脱敏引用。",
      "Idempotency: key 绑定 Orchestrator run、调用序号、Slot、Agent artifact hash 与 canonical input hash；不表示自动重试。",
      "Side-effect boundary: 未声明或超出允许等级的副作用必须 fail-closed。",
      `Public boundary: ${descriptor.publicExposure.mode}; no real adapter or external integration.`,
      "本包只定义运行时适配边界，不实现也不执行场景编排。"
    ].join("\n");
  }

  return [
    `Adapter ID / Version: ${descriptor.adapterId}@${descriptor.adapterVersion}`,
    `Implementation Status: ${descriptor.implementationStatus}`,
    `Protocol Version: ${descriptor.protocolVersion}`,
    `Supported Orchestrator Schema: ${descriptor.supportedOrchestratorSchemaVersions.join(", ")}`,
    `Supported Execution Model: ${descriptor.supportedExecutionModels.join(", ")}`,
    `Supported Agent DSL Versions: ${descriptor.supportedAgentDslVersions.join(", ")}`,
    `Capabilities: ${capabilitySummary(descriptor)}`,
    `Limits: input=${limits.maxInvocationInputBytes}, output=${limits.maxInvocationOutputBytes}, timeout=${limits.maxTimeoutMs}, concurrency=${limits.maxConcurrentSlotInvocations}`,
    `Compatibility: ${compatibilityReport.status}; currentRuntimeSupported=${compatibilityReport.currentRuntimeSupported}`,
    `Blockers: ${blockers}`,
    "Trace / Audit: Slot Trace is parent-bound to Orchestrator Trace and only redacted references are returned.",
    "Idempotency: the key binds the Orchestrator run, invocation index, Slot, Agent artifact hash, and canonical input hash; it does not enable automatic retry.",
    "Side-effect boundary: undeclared or excessive side effects fail closed.",
    `Public boundary: ${descriptor.publicExposure.mode}; no real adapter or external integration.`,
    "This package defines the runtime adapter boundary only. It does not implement or execute scenario orchestration."
  ].join("\n");
}
