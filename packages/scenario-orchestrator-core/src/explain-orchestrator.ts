import type { ScenarioOrchestratorDocument } from "./types";

export type ScenarioOrchestratorExplainLocale = "en" | "zh-CN";

function join(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "none";
}

export function explainScenarioOrchestrator(
  document: ScenarioOrchestratorDocument,
  locale: ScenarioOrchestratorExplainLocale
): string {
  const primary = document.slots.find((slot) => slot.role === "primary");
  const supporting = document.slots.filter((slot) => slot.role === "supporting");
  const routeSummary = document.routes.map(
    (route) => `${route.routeId}:${route.fromSlotId}:${route.effect.type}`
  );
  const terminalSummary = document.terminals.map(
    (terminal) => `${terminal.terminalId}:${terminal.status}`
  );
  const budget = document.executionPolicy.budgets;

  if (locale === "zh-CN") {
    return [
      `Orchestrator ID: ${document.orchestratorId}`,
      `Composition: ${document.compositionRef.compositionId}@${document.compositionRef.compositionVersion}`,
      `执行模型: ${document.executionModel}`,
      `入口 / Primary Slot: ${primary?.slotId ?? "none"}`,
      `Supporting Slots: ${join(supporting.map((slot) => slot.slotId))}`,
      "Call-return: Primary 显式调用 Supporting，Supporting 通过 resume_caller 返回结构化结果。",
      `Context namespaces: ${join(document.slots.flatMap((slot) => [
        slot.inputNamespace,
        slot.stateNamespace,
        slot.outputNamespace
      ]))}`,
      `Routes: ${join(routeSummary)}`,
      `Terminals: ${join(terminalSummary)}`,
      `Budgets: slot=${budget.maxSlotInvocations}, route=${budget.maxRouteEvaluations}, binding=${budget.maxBindingApplications}, depth=${budget.maxCallDepth}`,
      `Failure policy: ${document.failurePolicy.slotFailure}; ${document.failurePolicy.routeResolutionFailure}`,
      `Handoff policy: ${document.handoffPolicy.terminalId}; resumable=${document.handoffPolicy.resumable}`,
      `Overlays: ${join(document.overlayRefs.map((overlay) => overlay.overlayId))}`,
      `Trace contract: ${join(document.tracePolicy.mandatoryEventTypes)}`,
      `Provenance: planHash=${document.provenance.planHash}; bundleHash=${document.provenance.bundleHash}; orchestratorHash=${document.provenance.orchestratorHash}`,
      `Public boundary: ${document.publicExposure.mode}; previewOnly=${document.previewOnly}; runtimeExecutable=${document.runtimeExecutable}`,
      "该文档定义未来的场景编排合同，当前不能由 Yutra Runtime 执行。"
    ].join("\n");
  }

  return [
    `Orchestrator ID: ${document.orchestratorId}`,
    `Composition: ${document.compositionRef.compositionId}@${document.compositionRef.compositionVersion}`,
    `Execution model: ${document.executionModel}`,
    `Entry / Primary Slot: ${primary?.slotId ?? "none"}`,
    `Supporting Slots: ${join(supporting.map((slot) => slot.slotId))}`,
    "Call-return: Primary explicitly invokes Supporting, which returns structured output through resume_caller.",
    `Context namespaces: ${join(document.slots.flatMap((slot) => [
      slot.inputNamespace,
      slot.stateNamespace,
      slot.outputNamespace
    ]))}`,
    `Routes: ${join(routeSummary)}`,
    `Terminals: ${join(terminalSummary)}`,
    `Budgets: slot=${budget.maxSlotInvocations}, route=${budget.maxRouteEvaluations}, binding=${budget.maxBindingApplications}, depth=${budget.maxCallDepth}`,
    `Failure policy: ${document.failurePolicy.slotFailure}; ${document.failurePolicy.routeResolutionFailure}`,
    `Handoff policy: ${document.handoffPolicy.terminalId}; resumable=${document.handoffPolicy.resumable}`,
    `Overlays: ${join(document.overlayRefs.map((overlay) => overlay.overlayId))}`,
    `Trace contract: ${join(document.tracePolicy.mandatoryEventTypes)}`,
    `Provenance: planHash=${document.provenance.planHash}; bundleHash=${document.provenance.bundleHash}; orchestratorHash=${document.provenance.orchestratorHash}`,
    `Public boundary: ${document.publicExposure.mode}; previewOnly=${document.previewOnly}; runtimeExecutable=${document.runtimeExecutable}`,
    "This document defines a future scenario orchestration contract. It is not currently executable by Yutra Runtime."
  ].join("\n");
}
