import { createArchetypeRegistry } from "@yutra/archetype-core";
import { getScenarioPattern } from "@yutra/scenario-pattern-core";
import { resolveCompositionReadiness } from "./resolve-composition-readiness";
import type { CompositionSupportContext, ScenarioCompositionPlan } from "./types";

export type ScenarioCompositionExplainLocale = "en" | "zh-CN";

function valueForLocale(value: { en: string; zhCN: string } | undefined, locale: ScenarioCompositionExplainLocale): string {
  if (!value) return locale === "zh-CN" ? "未定义" : "Not defined";
  return locale === "zh-CN" ? value.zhCN : value.en;
}

export function explainScenarioComposition(
  plan: ScenarioCompositionPlan,
  locale: ScenarioCompositionExplainLocale,
  supportContext: CompositionSupportContext
): string {
  const pattern = getScenarioPattern(plan.patternRef.patternId);
  const archetypeRegistry = createArchetypeRegistry();
  const primary = plan.slots.find((slot) => slot.slotId === plan.primarySlotId);
  const primaryManifest = primary ? archetypeRegistry.get(primary.archetypeId) : undefined;
  const readiness = resolveCompositionReadiness(plan, supportContext);
  const supporting = plan.slots
    .filter((slot) => slot.role === "supporting")
    .map((slot) => `${slot.slotId} (${slot.archetypeId})`)
    .join(", ");
  const overlays = plan.crossCuttingOverlays
    .map((overlay) => `${overlay.overlayId} (${overlay.archetypeId}: ${overlay.enforcementMode})`)
    .join(", ");
  const routes = plan.routes
    .map((route) => `${route.routeId}: ${route.fromSlotId} -> ${route.toSlotId} [${route.conditionRef}]`)
    .join("; ");
  const bindings = plan.dataBindings
    .map((binding) => `${binding.bindingId}: ${binding.fromSlotId}.${binding.fromPath} -> ${binding.toSlotId}.${binding.toPath}`)
    .join("; ");

  if (locale === "zh-CN") {
    return [
      `组合 ID：${plan.compositionId}`,
      `场景组合范式：${pattern?.name.zhCN ?? plan.patternRef.patternId}`,
      `执行模型：${plan.executionModel}`,
      `主 Slot：${primary ? `${primary.slotId} (${primary.archetypeId})` : "未找到"}`,
      `辅助 Slots：${supporting || "无"}`,
      `横切 Overlays：${overlays || "无"}`,
      `Routes：${routes || "无"}`,
      `Data Bindings：${bindings || "无"}`,
      `Precedence：${plan.precedencePolicy.rules.join(", ")}；冲突模式=${plan.precedencePolicy.conflictMode}`,
      `主要产出物：${valueForLocale(primaryManifest?.taxonomy.primaryOutput, locale)}`,
      `验收对象：${valueForLocale(primaryManifest?.taxonomy.acceptanceObject, locale)}`,
      `Readiness：${readiness.status}；compositionCompilerAvailable=${readiness.compositionCompilerAvailable}`,
      `阻塞项：${readiness.blockers.join(", ") || "无"}`,
      "公开边界：demo_only；不包含客户数据、真实 endpoint、secret、客户 SOP 或商业交付资产。",
      "该组合计划将每个 Pack Config 保持在独立命名空间中，不进行通用深合并，当前也不会编译或执行场景。"
    ].join("\n");
  }

  return [
    `Composition ID: ${plan.compositionId}`,
    `Scenario Pattern: ${pattern?.name.en ?? plan.patternRef.patternId}`,
    `Execution Model: ${plan.executionModel}`,
    `Primary Slot: ${primary ? `${primary.slotId} (${primary.archetypeId})` : "Not found"}`,
    `Supporting Slots: ${supporting || "None"}`,
    `Cross-cutting Overlays: ${overlays || "None"}`,
    `Routes: ${routes || "None"}`,
    `Data Bindings: ${bindings || "None"}`,
    `Precedence: ${plan.precedencePolicy.rules.join(", ")}; conflictMode=${plan.precedencePolicy.conflictMode}`,
    `Primary Output: ${valueForLocale(primaryManifest?.taxonomy.primaryOutput, locale)}`,
    `Acceptance Object: ${valueForLocale(primaryManifest?.taxonomy.acceptanceObject, locale)}`,
    `Readiness: ${readiness.status}; compositionCompilerAvailable=${readiness.compositionCompilerAvailable}`,
    `Blockers: ${readiness.blockers.join(", ") || "None"}`,
    "Public boundary: demo_only; no customer data, real endpoint, secret, customer SOP, or commercial delivery asset.",
    "This composition plan preserves each Pack Config in an isolated namespace. It does not deep-merge Pack Configs and does not execute or compile the scenario yet."
  ].join("\n");
}
