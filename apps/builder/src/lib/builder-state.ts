import {
  BUILDER_ISSUE_CODES,
  BuilderCoreError,
  agentSpecToChineseDsl,
  builderFormSchema,
  ecommerceSupportTemplate,
  formConfigToAgentSpec,
  validateGeneratedSpec,
  type BuilderFormConfig,
  type BuilderIssue
} from "@yutra/builder-core";
import type { BuilderPreviewResult, BuilderUiState } from "../types";

export const BUILDER_TEMPLATES = [ecommerceSupportTemplate] as const;

function asPath(path: (string | number)[]): string[] {
  return path.map((item) => String(item));
}

export function buildFormConfigFromUiState(state: BuilderUiState): BuilderFormConfig {
  return {
    agentName: state.agentName,
    version: state.version,
    templateId: state.templateId,
    selectedIntentIds: state.selectedIntentIds,
    selectedSkillNames: state.selectedSkillNames,
    rules: {
      ...state.rules
    },
    handoffRules: state.handoffRules,
    responseStyle: state.responseStyle,
    language: state.language
  };
}

function buildUiWarnings(state: BuilderUiState): string[] {
  const warnings: string[] = [];
  if (state.selectedIntentIds.includes("refund_request") && !state.selectedSkillNames.includes("create_refund_request")) {
    warnings.push("已选择 refund_request，但未选择 create_refund_request，退款路径可能不可达。");
  }
  return warnings;
}

export function generateBuilderPreview(state: BuilderUiState): BuilderPreviewResult {
  const formConfig = buildFormConfigFromUiState(state);
  const uiWarnings = buildUiWarnings(state);
  const formIssues: BuilderIssue[] = [];
  const generationIssues: BuilderIssue[] = [];

  const parsed = builderFormSchema.safeParse(formConfig);
  if (!parsed.success) {
    for (const item of parsed.error.issues) {
      formIssues.push({
        code: BUILDER_ISSUE_CODES.FORM_INVALID,
        severity: "error",
        message: item.message,
        path: asPath(item.path)
      });
    }
    return { formConfig, formIssues, generationIssues, uiWarnings };
  }

  try {
    const spec = formConfigToAgentSpec(parsed.data, ecommerceSupportTemplate);
    const dsl = agentSpecToChineseDsl(spec);
    const validation = validateGeneratedSpec(spec);
    return {
      formConfig: parsed.data,
      formIssues,
      generationIssues,
      spec,
      dsl,
      validation,
      uiWarnings
    };
  } catch (error) {
    if (error instanceof BuilderCoreError) {
      generationIssues.push(...error.issues);
    } else {
      generationIssues.push({
        code: BUILDER_ISSUE_CODES.SPEC_INVALID,
        severity: "error",
        message: error instanceof Error ? error.message : "Unknown generation error."
      });
    }
    return { formConfig: parsed.data, formIssues, generationIssues, uiWarnings };
  }
}
