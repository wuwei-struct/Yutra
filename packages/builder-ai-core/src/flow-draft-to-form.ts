import { builderFormSchema, type AgentTemplateConfig, type BuilderFormConfig } from "@yutra/builder-core";
import { AI_DRAFT_ERROR_CODES, BuilderAiCoreError, aiDraftIssue, throwIfAiDraftErrors, zodToAiDraftIssues } from "./errors";
import type { FlowDraft } from "./types";
import { validateFlowDraft } from "./validate-flow-draft";

function resolveLanguage(draft: FlowDraft): "zh-CN" | "en" {
  const metadataLanguage = draft.metadata?.language;
  const metadataLocale = draft.metadata?.locale;
  if (metadataLanguage === "en" || metadataLocale === "en") {
    return "en";
  }
  return "zh-CN";
}

export function flowDraftToBuilderFormConfig(draft: FlowDraft, template: AgentTemplateConfig): BuilderFormConfig {
  const validation = validateFlowDraft(draft, template);
  throwIfAiDraftErrors("FlowDraft validation failed.", validation.issues);

  const selectedIntentIds = draft.intents.map((item) => item.id);
  const selectedSkillNames = [...draft.selectedSkills];

  const form: BuilderFormConfig = {
    agentName: draft.title,
    templateId: template.templateId,
    selectedIntentIds,
    selectedSkillNames,
    rules: draft.rules,
    handoffRules: draft.handoffRules,
    responseStyle: draft.responseStyle ?? "service_oriented",
    customResponseStyle: draft.customResponseStyle,
    language: resolveLanguage(draft),
    metadata: {
      flowDraftId: draft.draftId,
      flowDraftSource: draft.source.type
    }
  };

  const parsed = builderFormSchema.safeParse(form);
  if (!parsed.success) {
    const issues = [
      aiDraftIssue(AI_DRAFT_ERROR_CODES.TO_FORM_FAILED, "FlowDraft to BuilderFormConfig conversion failed.", ["form"]),
      ...zodToAiDraftIssues(AI_DRAFT_ERROR_CODES.TO_FORM_FAILED, parsed.error)
    ];
    throw new BuilderAiCoreError("FlowDraft to BuilderFormConfig conversion failed.", issues);
  }
  return parsed.data;
}
