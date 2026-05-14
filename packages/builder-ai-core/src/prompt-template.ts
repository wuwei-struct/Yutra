import type { BuildFlowDraftPromptInput } from "./types";

function templateSummary(input: BuildFlowDraftPromptInput): string {
  const intents = input.template.supportedIntents.map((intent) => intent.id).join(", ");
  const skills = input.template.availableSkills.map((skill) => skill.name).join(", ");
  const ruleKeys = Object.keys(input.template.defaultRules ?? {}).join(", ");
  return [
    `templateId: ${input.template.templateId}`,
    `domain: ${input.template.domain}`,
    `supportedIntents: [${intents}]`,
    `availableSkills: [${skills}]`,
    `allowedRuleKeys: [${ruleKeys}]`
  ].join("\n");
}

export function buildFlowDraftPrompt(input: BuildFlowDraftPromptInput): string {
  return [
    "You are a drafting assistant for Yutra Builder AI Core.",
    "Return ONLY one FlowDraft JSON object.",
    "Do NOT generate final executable DSL.",
    "Do NOT output executable code.",
    "Do NOT call tools.",
    "Do NOT execute runtime.",
    "Do NOT bypass validation.",
    "Do NOT invent unknown intent/skill/capability outside template catalogs.",
    "Unknown requirements must go to assumptions or warnings.",
    "The result will be validated before use.",
    "",
    "Output Contract: required FlowDraft fields:",
    "- draftId, scenario, title, intents[], selectedSkills[], rules, source, createdAt",
    "- Optional: description, handoffRules, responseStyle, customResponseStyle, assumptions, warnings, states, metadata",
    "",
    "Strict Boundaries:",
    "- LLM/AI only drafts.",
    "- Builder Core handles structuring and AgentSpec generation.",
    "- Runtime execution is out of scope for this step.",
    "",
    "TagSelection:",
    JSON.stringify(input.tags, null, 2),
    "",
    "NaturalLanguageBrief:",
    JSON.stringify(input.brief, null, 2),
    "",
    "Template Summary:",
    templateSummary(input),
    "",
    "Output must be valid JSON object only."
  ].join("\n");
}
