import type { BuilderFormConfig } from "@yutra/builder-core";
import type { AiDraftIssue, AiDraftValidationResult, FlowDraft, NaturalLanguageBrief, TagSelection } from "@yutra/builder-ai-core";

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

export interface BuilderRunnerInput {
  context?: Record<string, unknown>;
  intent?: string;
  text?: string;
}

export interface BuilderRunnerOptions {
  skillsDir?: string;
  trace?: boolean;
}

export type BuilderRunPreviewRequest =
  | {
      sourceMode?: "builder";
      form: BuilderFormConfig;
      input?: BuilderRunnerInput;
      options?: BuilderRunnerOptions;
    }
  | {
      sourceMode: "dsl";
      dslText: string;
      format?: "yaml" | "json";
      input?: BuilderRunnerInput;
      options?: BuilderRunnerOptions;
    };

export interface BuilderDslInspectRequest {
  dslText: string;
  format?: "yaml" | "json";
}

export interface BuilderDslInspectSummary {
  agent: string;
  states: number;
  actions: number;
  intents: number;
  transitions: number;
  handoffStates: number;
  skillActions: number;
}

export interface BuilderDslInspectSuccessResponse {
  ok: true;
  format: "yaml" | "json";
  raw: unknown;
  normalized: unknown;
  canonical: unknown;
  validation: BuilderRunnerValidationResult;
  explain: string;
  summary: BuilderDslInspectSummary;
  mappings: {
    fieldAliases: unknown[];
    canonicalNames: unknown[];
  };
  warnings: BuilderRunnerIssue[];
}

export interface BuilderDslInspectErrorResponse {
  ok: false;
  format?: "yaml" | "json";
  error: {
    code: string;
    message: string;
  };
  validation: BuilderRunnerValidationResult;
}

export type BuilderDslInspectResponse = BuilderDslInspectSuccessResponse | BuilderDslInspectErrorResponse;

export interface LegacyBuilderRunPreviewRequest {
  form: BuilderFormConfig;
  input?: BuilderRunnerInput;
  options?: BuilderRunnerOptions;
}

export interface BuilderTimelineItem {
  index: number;
  type: string;
  state?: string;
  action?: string;
  status?: string;
  error?: string;
  skillName?: string;
  implementationType?: string;
  ts?: string;
}

export interface BuilderRunPreviewSuccessResponse {
  ok: true;
  run: {
    runId: string;
    status: "completed" | "failed" | "handoff" | "stuck";
    agent: string;
    initialState?: string;
    finalState?: string;
    matchedIntent?: string;
    steps: number;
    errorCode?: string;
    errorMessage?: string;
    errorDetails?: Record<string, unknown>;
  };
  spec: unknown;
  validation: BuilderRunnerValidationResult;
  events: Array<Record<string, unknown>>;
  timeline: BuilderTimelineItem[];
  traceJsonl: string;
  auditBundle: Record<string, unknown>;
}

export interface BuilderRunPreviewErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  validation: BuilderRunnerValidationResult;
  events: Array<Record<string, unknown>>;
}

export type BuilderRunPreviewResponse = BuilderRunPreviewSuccessResponse | BuilderRunPreviewErrorResponse;

export interface AiDraftPreviewRequest {
  providerMode?: "mock" | "real";
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

export interface AiDraftPreviewSuccessResponse {
  ok: true;
  draft: FlowDraft;
  explanation: string;
  validation: AiDraftValidationResult;
  draftForm: BuilderFormConfig;
  issues: AiDraftIssue[];
  meta: {
    providerMode: "mock" | "real";
    provider: string;
    model?: string;
    parsed: boolean;
    validated: boolean;
    promptChars?: number;
    responseChars?: number;
  };
}

export interface AiDraftPreviewErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  issues: AiDraftIssue[];
  meta: {
    providerMode: "mock" | "real";
    provider: string;
    model?: string;
    parsed: boolean;
    validated: boolean;
    promptChars?: number;
    responseChars?: number;
  };
}

export type AiDraftPreviewResponse = AiDraftPreviewSuccessResponse | AiDraftPreviewErrorResponse;
