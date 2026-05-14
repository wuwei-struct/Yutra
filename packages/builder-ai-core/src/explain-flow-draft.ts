import type { FlowDraft } from "./types";

function preferredLocale(draft: FlowDraft): "zh-CN" | "en" {
  const locale = draft.metadata?.locale ?? draft.metadata?.language;
  return locale === "en" ? "en" : "zh-CN";
}

function listOrDash(values: string[], indent = "- "): string[] {
  if (values.length === 0) {
    return [`${indent}-`];
  }
  return values.map((value) => `${indent}${value}`);
}

export function explainFlowDraft(draft: FlowDraft): string {
  const locale = preferredLocale(draft);
  const intentLabels = draft.intents.map((intent) => intent.label || intent.id);
  const skills = [...draft.selectedSkills];
  const assumptions = [...(draft.assumptions ?? [])];
  const warnings = [...(draft.warnings ?? [])];
  const rules = Object.entries(draft.rules ?? {}).map(([key, value]) => `${key}: ${String(value)}`);

  if (locale === "en") {
    return [
      `Draft: ${draft.title}`,
      "",
      "Intents:",
      ...listOrDash(intentLabels),
      "",
      "Skills:",
      ...listOrDash(skills),
      "",
      "Key Rules:",
      ...listOrDash(rules),
      "",
      "Assumptions:",
      ...listOrDash(assumptions),
      "",
      "Risk Notes:",
      ...listOrDash(warnings),
      "",
      "This is a flow draft only. Validate it and run preview before execution."
    ].join("\n");
  }

  return [
    `草案名称：${draft.title}`,
    "",
    "识别到的意图：",
    ...listOrDash(intentLabels),
    "",
    "将使用的 Skill：",
    ...listOrDash(skills),
    "",
    "关键规则：",
    ...listOrDash(rules),
    "",
    "假设：",
    ...listOrDash(assumptions),
    "",
    "风险提示：",
    ...listOrDash(warnings),
    "",
    "这是草案，不可直接执行。请先 validate 并在 Builder Run Preview 中确认。"
  ].join("\n");
}
