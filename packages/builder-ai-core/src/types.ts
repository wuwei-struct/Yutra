import type { AgentTemplateConfig, BuilderFormConfig } from "@yutra/builder-core";

export const AI_DRAFT_ERROR_CODES = {
  TAG_SELECTION_INVALID: "AI_DRAFT_TAG_SELECTION_INVALID",
  BRIEF_INVALID: "AI_DRAFT_BRIEF_INVALID",
  DRAFT_INVALID: "AI_DRAFT_INVALID",
  PROVIDER_CONFIG_MISSING: "AI_DRAFT_PROVIDER_CONFIG_MISSING",
  PROVIDER_REQUEST_FAILED: "AI_DRAFT_PROVIDER_REQUEST_FAILED",
  PROVIDER_TIMEOUT: "AI_DRAFT_PROVIDER_TIMEOUT",
  PROVIDER_RESPONSE_EMPTY: "AI_DRAFT_PROVIDER_RESPONSE_EMPTY",
  PARSE_FAILED: "AI_DRAFT_PARSE_FAILED",
  REAL_PROVIDER_DISABLED: "AI_DRAFT_REAL_PROVIDER_DISABLED",
  UNKNOWN_SCENARIO: "AI_DRAFT_UNKNOWN_SCENARIO",
  UNKNOWN_CAPABILITY: "AI_DRAFT_UNKNOWN_CAPABILITY",
  UNKNOWN_STRATEGY: "AI_DRAFT_UNKNOWN_STRATEGY",
  UNKNOWN_INTENT: "AI_DRAFT_UNKNOWN_INTENT",
  UNKNOWN_SKILL: "AI_DRAFT_UNKNOWN_SKILL",
  TO_FORM_FAILED: "AI_DRAFT_TO_FORM_FAILED",
  ASSUMPTION_REQUIRED: "AI_DRAFT_ASSUMPTION_REQUIRED"
} as const;

export type AiDraftErrorCode = (typeof AI_DRAFT_ERROR_CODES)[keyof typeof AI_DRAFT_ERROR_CODES];

export type AiDraftSeverity = "error" | "warning";

export interface AiDraftIssue {
  code: string;
  message: string;
  severity: AiDraftSeverity;
  path?: string[];
  hint?: string;
}

export interface AiDraftValidationResult {
  ok: boolean;
  issues: AiDraftIssue[];
}

export const BUILTIN_SCENARIOS = ["ecommerce_support", "it_helpdesk", "approval", "custom"] as const;
export type FlowDraftScenario = (typeof BUILTIN_SCENARIOS)[number];

export const ECOMMERCE_CAPABILITIES = [
  "query_order",
  "query_shipping_status",
  "create_return_request",
  "create_refund_request",
  "create_support_ticket",
  "render_customer_reply"
] as const;

export const STRATEGY_TAGS = [
  "require_handoff_for_high_risk",
  "require_approval_for_refund",
  "full_trace_audit",
  "ask_for_missing_info",
  "service_oriented_response",
  "strict_policy_boundary"
] as const;

export type TagSelection = {
  scenario: FlowDraftScenario;
  capabilities: string[];
  strategies: string[];
  language?: "zh-CN" | "en";
  metadata?: Record<string, unknown>;
};

export type NaturalLanguageBrief = {
  text: string;
  locale?: "zh-CN" | "en";
  constraints?: string[];
  examples?: Array<{
    input: string;
    expectedBehavior?: string;
  }>;
  metadata?: Record<string, unknown>;
};

export type FlowDraft = {
  draftId: string;
  scenario: string;
  title: string;
  description?: string;
  intents: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  selectedSkills: string[];
  rules: Record<string, unknown>;
  handoffRules?: Record<string, unknown>;
  responseStyle?: "neutral" | "service_oriented" | "concise" | "custom";
  customResponseStyle?: string;
  assumptions?: string[];
  warnings?: string[];
  states?: Array<{
    id: string;
    label?: string;
    description?: string;
    actions?: string[];
    transitions?: Array<{
      when?: string;
      to: string;
      label?: string;
    }>;
  }>;
  source: {
    type: "mock" | "llm";
    provider?: string;
    model?: string;
  };
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export interface MockAiDraftProviderInput {
  tags: TagSelection;
  brief: NaturalLanguageBrief;
  template: AgentTemplateConfig;
}

export interface BuildFlowDraftPromptInput {
  tags: TagSelection;
  brief: NaturalLanguageBrief;
  template: AgentTemplateConfig;
}

export interface BuilderAiCoreApi {
  validateFlowDraft: (draft: FlowDraft, template: AgentTemplateConfig) => AiDraftValidationResult;
  explainFlowDraft: (draft: FlowDraft) => string;
  flowDraftToBuilderFormConfig: (draft: FlowDraft, template: AgentTemplateConfig) => BuilderFormConfig;
}
