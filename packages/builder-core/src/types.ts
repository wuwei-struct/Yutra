import type { AgentSpec, ContextFieldType } from "@yutra/spec";

export interface TemplateIntentConfig {
  id: string;
  label: string;
  description?: string;
  entryState?: string;
}

export type SkillSideEffect = "none" | "read" | "write" | "external";
export type SkillRiskLevel = "low" | "medium" | "high";

export interface TemplateSkillConfig {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  defaultSelected?: boolean;
  sideEffect?: SkillSideEffect;
  riskLevel?: SkillRiskLevel;
  requiresApproval?: boolean;
}

export interface TemplateContextFieldConfig {
  name: string;
  type: ContextFieldType;
  default?: unknown;
  required?: boolean;
}

export interface TemplateStateConfig {
  name: string;
  label?: string;
  description?: string;
  final?: boolean;
  handoff?: boolean;
}

export interface AgentTemplateConfig {
  templateId: string;
  name: string;
  description?: string;
  domain: string;
  supportedIntents: TemplateIntentConfig[];
  availableSkills: TemplateSkillConfig[];
  defaultContextFields?: TemplateContextFieldConfig[];
  defaultStates?: TemplateStateConfig[];
  defaultRules?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type BuilderLanguage = "zh-CN" | "en";
export type BuilderResponseStyle = "neutral" | "service_oriented" | "concise" | "custom";

export interface BuilderFormConfig {
  agentName: string;
  version?: string;
  templateId: string;
  selectedIntentIds: string[];
  selectedSkillNames: string[];
  rules?: Record<string, unknown>;
  handoffRules?: Record<string, unknown>;
  responseStyle?: BuilderResponseStyle;
  customResponseStyle?: string;
  language?: BuilderLanguage;
  metadata?: Record<string, unknown>;
}

export const BUILDER_ISSUE_CODES = {
  TEMPLATE_INVALID: "BUILDER_TEMPLATE_INVALID",
  FORM_INVALID: "BUILDER_FORM_INVALID",
  UNKNOWN_TEMPLATE: "BUILDER_UNKNOWN_TEMPLATE",
  UNKNOWN_INTENT: "BUILDER_UNKNOWN_INTENT",
  UNKNOWN_SKILL: "BUILDER_UNKNOWN_SKILL",
  SPEC_INVALID: "BUILDER_SPEC_INVALID",
  TRANSITION_INVALID: "BUILDER_TRANSITION_INVALID",
  ACTION_REFERENCE_INVALID: "BUILDER_ACTION_REFERENCE_INVALID"
} as const;

export type BuilderIssueCode = (typeof BUILDER_ISSUE_CODES)[keyof typeof BUILDER_ISSUE_CODES];
export type BuilderIssueSeverity = "error" | "warning";

export interface BuilderIssue {
  code: BuilderIssueCode;
  message: string;
  severity: BuilderIssueSeverity;
  path?: string[];
}

export interface BuilderValidationResult {
  ok: boolean;
  issues: BuilderIssue[];
}

export interface BuilderCoreApi {
  formConfigToAgentSpec: (form: BuilderFormConfig, template: AgentTemplateConfig) => AgentSpec;
  agentSpecToChineseDsl: (spec: AgentSpec) => string;
  validateGeneratedSpec: (spec: AgentSpec) => BuilderValidationResult;
}
