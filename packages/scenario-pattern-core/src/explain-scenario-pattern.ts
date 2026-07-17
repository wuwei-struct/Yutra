import { createArchetypeRegistry, type ArchetypeRegistry } from "@yutra/archetype-core";
import { BUILTIN_SCENARIO_PATTERNS } from "./builtin-scenario-patterns";
import type { ScenarioPatternId } from "./ids";
import { resolveScenarioPatternComposition } from "./resolve-scenario-pattern-composition";
import type { ScenarioPatternManifest, ScenarioPatternSupportContext } from "./types";

export type ScenarioPatternExplainLocale = "en" | "zh-CN";

export type ScenarioPatternExplainOptions = {
  patterns?: ScenarioPatternManifest[];
  archetypeRegistry?: ArchetypeRegistry;
};

export function explainScenarioPattern(
  patternId: ScenarioPatternId,
  locale: ScenarioPatternExplainLocale,
  supportContext: ScenarioPatternSupportContext,
  options: ScenarioPatternExplainOptions = {}
): string | undefined {
  const pattern = (options.patterns ?? BUILTIN_SCENARIO_PATTERNS).find((item) => item.patternId === patternId);
  if (!pattern) return undefined;

  const archetypeRegistry = options.archetypeRegistry ?? createArchetypeRegistry();
  const composition = resolveScenarioPatternComposition(pattern, archetypeRegistry, supportContext);
  const useZh = locale === "zh-CN";
  const localized = <T extends { en: string; zhCN: string }>(value: T): string => (useZh ? value.zhCN : value.en);
  const labels = {
    scenarioPattern: useZh ? "场景组合范式" : "Scenario Pattern",
    primary: useZh ? "主产物型母型" : "Primary Product Archetype",
    supporting: useZh ? "辅助产物型母型" : "Supporting Product Archetypes",
    crossCutting: useZh ? "横切母型" : "Cross-cutting Archetypes",
    trigger: useZh ? "触发方式" : "Trigger Pattern",
    primaryOutput: useZh ? "主要产出物" : "Primary Output",
    acceptance: useZh ? "验收对象" : "Acceptance Object",
    primitives: useZh ? "行为原语覆盖" : "Primitive Coverage",
    governance: useZh ? "治理重点" : "Governance Focus",
    compiler: useZh ? "Compiler 支持" : "Compiler Support",
    workbench: useZh ? "Creator Workbench 支持" : "Creator Workbench Support",
    boundary: useZh ? "公开边界" : "Public Boundary",
    note: useZh ? "说明" : "Note"
  };
  const supporting = composition.supportingArchetypes.map((item) => `${localized(item.name)} (${item.archetypeId})`);
  const crossCutting = composition.crossCuttingArchetypes.map((item) => `${localized(item.name)} (${item.archetypeId})`);
  const governance = useZh ? composition.governanceFocus.zhCN : composition.governanceFocus.en;
  const compositionNote = useZh
    ? "场景组合范式是母型组合预设，不是新的主母型。它不定义组合执行、Pack Config 合并或 Compiler 优先级。"
    : "A scenario pattern is a composition preset, not a new archetype. It does not define composition execution, Pack Config merging, or Compiler precedence.";

  return [
    `# ${localized(pattern.name)} (${pattern.patternId})`,
    `${labels.scenarioPattern}: ${localized(pattern.summary)}`,
    "",
    `- ${labels.primary}: ${localized(composition.primaryArchetype.name)} (${composition.primaryArchetype.archetypeId})`,
    `- ${labels.supporting}: ${supporting.length > 0 ? supporting.join(", ") : "none"}`,
    `- ${labels.crossCutting}: ${crossCutting.length > 0 ? crossCutting.join(", ") : "none"}`,
    `- ${labels.trigger}: ${composition.triggerPattern}`,
    `- ${labels.primaryOutput}: ${localized(composition.primaryOutput)}`,
    `- ${labels.acceptance}: ${localized(composition.acceptanceObject)}`,
    `- ${labels.primitives}: ${composition.primitiveCoverage.join(", ")}`,
    `- ${labels.compiler}: ${composition.compilerSupport}`,
    `- ${labels.workbench}: ${composition.workbenchSupport}`,
    "",
    `## ${labels.governance}`,
    ...governance.map((item) => `- ${item}`),
    "",
    `## ${labels.boundary}`,
    useZh
      ? "- demo_only；不包含客户数据、真实 endpoint、secret、客户 SOP 或商业交付资产。"
      : "- demo_only; contains no customer data, real endpoint, secret, customer SOP, or commercial delivery asset.",
    "",
    `${labels.note}: ${compositionNote}`
  ].join("\n");
}
