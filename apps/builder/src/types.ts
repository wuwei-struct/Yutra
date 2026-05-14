import type { BuilderFormConfig, BuilderIssue, BuilderValidationResult } from "@yutra/builder-core";
import type { AiDraftIssue, AiDraftValidationResult, FlowDraft, FlowDraftScenario, NaturalLanguageBrief, TagSelection } from "@yutra/builder-ai-core";

export interface EcommerceRuleInputs {
  delayedShipmentThresholdHours: number;
  returnWindowDays: number;
  highRiskAmountThreshold: number;
  requireHumanForRefundAfterDelivery: boolean;
  requireHumanForDamagedGoods: boolean;
}

export interface BuilderUiState {
  templateId: string;
  agentName: string;
  version: string;
  responseStyle: NonNullable<BuilderFormConfig["responseStyle"]>;
  language: NonNullable<BuilderFormConfig["language"]>;
  selectedIntentIds: string[];
  selectedSkillNames: string[];
  rules: EcommerceRuleInputs;
  handoffRules?: Record<string, unknown>;
}

export interface BuilderPreviewResult {
  formConfig: BuilderFormConfig;
  formIssues: BuilderIssue[];
  generationIssues: BuilderIssue[];
  spec?: unknown;
  dsl?: string;
  validation?: BuilderValidationResult;
  uiWarnings: string[];
}

export interface BuilderRunnerRequestInput {
  context?: Record<string, unknown>;
  intent?: string;
  text?: string;
}

export interface BuilderRunPreviewRequest {
  form: BuilderFormConfig;
  input?: BuilderRunnerRequestInput;
  options?: {
    skillsDir?: string;
    trace?: boolean;
  };
}

export interface BuilderRunPreviewResponse {
  ok: boolean;
  error?: {
    code: string;
    message: string;
  };
  validation: BuilderValidationResult;
  run?: {
    runId: string;
    status: "completed" | "failed" | "handoff" | "stuck";
    agent: string;
    initialState?: string;
    finalState?: string;
    matchedIntent?: string;
    steps: number;
  };
  spec?: unknown;
  events?: Array<Record<string, unknown>>;
  timeline?: Array<{
    index: number;
    type: string;
    state?: string;
    action?: string;
    status?: string;
    error?: string;
    skillName?: string;
    implementationType?: string;
    ts?: string;
  }>;
  traceJsonl?: string;
  auditBundle?: Record<string, unknown>;
}

export interface DraftDiffItem {
  field: "agentName" | "selectedIntentIds" | "selectedSkillNames" | "rules" | "handoffRules" | "responseStyle" | "language";
  before: unknown;
  after: unknown;
  changed: boolean;
}

export interface AiDraftUiState {
  providerMode: "mock" | "real";
  scenario: FlowDraftScenario;
  capabilities: string[];
  strategies: string[];
  briefText: string;
  generating: boolean;
  errorMessage?: string;
  applyMessage?: string;
  draft?: FlowDraft;
  draftForm?: BuilderFormConfig;
  explanation?: string;
  validation?: AiDraftValidationResult;
  diff?: DraftDiffItem[];
}

export interface AiDraftPreviewRequest {
  providerMode: "mock" | "real";
  tags: TagSelection;
  brief: NaturalLanguageBrief;
  options?: {
    provider?: "generic-http" | "openai-compatible" | "custom";
    model?: string;
    temperature?: number;
    timeoutMs?: number;
    baseUrl?: string;
  };
}

export interface AiDraftPreviewResponse {
  ok: boolean;
  draft?: FlowDraft;
  explanation?: string;
  validation?: AiDraftValidationResult;
  draftForm?: BuilderFormConfig;
  issues: AiDraftIssue[];
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    providerMode: "mock" | "real";
    provider: string;
    model?: string;
    parsed: boolean;
    validated: boolean;
    promptChars?: number;
    responseChars?: number;
  };
}
