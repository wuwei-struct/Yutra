import type { BuilderFormConfig, BuilderIssue } from "@yutra/builder-core";
import type { AiDraftIssue, AiDraftValidationResult, FlowDraft, FlowDraftScenario, NaturalLanguageBrief, TagSelection } from "@yutra/builder-ai-core";
import type { PackConfig } from "@yutra/pack-config-core";
import type {
  CertificationReadinessGate,
  CertificationReadinessPreview,
  CompileMode,
  ReadinessLevel,
  RuleCompilerArtifacts,
  RuleCompilerIssue,
  RuleCompilerReport
} from "@yutra/rule-compiler";

export type { CertificationReadinessGate, CertificationReadinessPreview, ReadinessLevel };

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

export interface BuilderRunnerIssue {
  code: string;
  message: string;
  severity: "error" | "warning";
  path?: string[];
  hint?: string;
}

export interface BuilderRunnerValidationResult {
  ok: boolean;
  issues: BuilderRunnerIssue[];
}

export type BuilderRunPreviewRequest =
  | {
      sourceMode?: "builder";
      form: BuilderFormConfig;
      input?: BuilderRunnerRequestInput;
      options?: {
        skillsDir?: string;
        trace?: boolean;
      };
    }
  | {
      sourceMode: "dsl";
      dslText: string;
      format?: "yaml" | "json";
      input?: BuilderRunnerRequestInput;
      options?: {
        skillsDir?: string;
        trace?: boolean;
      };
    };

export interface BuilderDslInspectSummary {
  agent: string;
  states: number;
  actions: number;
  intents: number;
  transitions: number;
  handoffStates: number;
  skillActions: number;
}

export interface BuilderDslInspectResponse {
  ok: boolean;
  format?: "yaml" | "json";
  raw?: unknown;
  normalized?: unknown;
  canonical?: unknown;
  validation: BuilderRunnerValidationResult;
  explain?: string;
  summary?: BuilderDslInspectSummary;
  mappings?: {
    fieldAliases: unknown[];
    canonicalNames: unknown[];
  };
  warnings?: BuilderRunnerIssue[];
  error?: {
    code: string;
    message: string;
  };
}

export interface BuilderRunPreviewResponse {
  ok: boolean;
  error?: {
    code: string;
    message: string;
  };
  validation: BuilderRunnerValidationResult;
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

export interface CreatorCompilePreviewRequest {
  config: PackConfig;
  mode?: CompileMode;
  locale?: "en" | "zh-CN";
}

export interface CreatorCompilePreviewResponse {
  ok: boolean;
  compileId?: string;
  compilerVersion?: string;
  mode?: CompileMode;
  artifacts?: RuleCompilerArtifacts;
  report?: RuleCompilerReport;
  certificationReadiness?: CertificationReadinessPreview;
  issues: RuleCompilerIssue[];
  error?: {
    code: string;
    message: string;
  };
}
