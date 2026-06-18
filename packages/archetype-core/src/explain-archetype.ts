import type { ArchetypeManifest } from "./types";

export function explainArchetype(manifest: ArchetypeManifest, options: { locale?: "en" | "zh-CN" } = {}): string {
  const locale = options.locale ?? "en";
  const useZh = locale === "zh-CN";
  const name = useZh ? manifest.name.zhCN : manifest.name.en;
  const summary = useZh ? manifest.summary.zhCN : manifest.summary.en;
  const label = {
    type: useZh ? "类型" : "Type",
    summary: useZh ? "摘要" : "Summary",
    flow: useZh ? "核心流程" : "Core Flow",
    scenarios: useZh ? "适用场景" : "Common Scenarios",
    rules: useZh ? "常见规则类型" : "Common Rule Types",
    cross: useZh ? "可组合横切母型" : "Compatible Cross-cutting Archetypes",
    governance: useZh ? "默认治理策略" : "Default Governance",
    note: useZh ? "说明" : "Note"
  };
  const note = useZh
    ? "这只是 archetype manifest，不是可执行 Agent，也不是 Rule Compiler 输出。"
    : "This is an archetype manifest, not an executable Agent or Rule Compiler output.";

  return [
    `# ${name} (${manifest.archetypeId})`,
    `${label.type}: ${manifest.kind}`,
    `${label.summary}: ${summary}`,
    "",
    `## ${label.flow}`,
    ...manifest.coreFlow.map((step, index) => `${index + 1}. ${step}`),
    "",
    `## ${label.scenarios}`,
    ...manifest.commonScenarios.map((item) => `- ${item}`),
    "",
    `## ${label.rules}`,
    ...manifest.commonRules.map((item) => `- ${item}`),
    "",
    `## ${label.cross}`,
    ...((manifest.compatibleCrossCutting ?? []).length > 0 ? manifest.compatibleCrossCutting!.map((id) => `- ${id}`) : ["- none"]),
    "",
    `## ${label.governance}`,
    `- context write conflicts: ${manifest.defaultGovernance.contextPolicy.writeConflicts}`,
    `- guard conflict resolution: ${manifest.defaultGovernance.guardPolicy.conflictResolution}`,
    `- failure policy: ${manifest.defaultGovernance.failurePolicy}`,
    `- trace policy: ${manifest.defaultGovernance.tracePolicy}`,
    `- max auto side effect: ${manifest.defaultGovernance.sideEffectPolicy.maxAutoSideEffect}`,
    "",
    `${label.note}: ${note}`
  ].join("\n");
}
