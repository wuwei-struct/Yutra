import type { BuilderFormConfig } from "@yutra/builder-core";
import type { AiDraftIssue, AiDraftValidationResult, FlowDraft, NaturalLanguageBrief, TagSelection } from "@yutra/builder-ai-core";
import type { PackConfig } from "@yutra/pack-config-core";
import type {
  CertificationReadinessPreview,
  CompileMode,
  RuleCompilerArtifacts,
  RuleCompilerIssue,
  RuleCompilerReport
} from "@yutra/rule-compiler";
import type {
  CompositionReadiness,
  ScenarioCompositionDraft,
  ScenarioCompositionPlan
} from "@yutra/scenario-composition-core";
import type { ScenarioCompositionCompileResult } from "@yutra/scenario-composition-compiler";
import type {
  LocalizedScenarioText,
  ScenarioPatternCompositionSummary,
  ScenarioPatternManifest
} from "@yutra/scenario-pattern-core";

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

export interface CreatorCompilePreviewRequest {
  config: PackConfig;
  mode?: CompileMode;
  locale?: "en" | "zh-CN";
}

export interface CreatorCompilePreviewSuccessResponse {
  ok: true;
  compileId: string;
  compilerVersion: string;
  mode: CompileMode;
  artifacts: RuleCompilerArtifacts;
  report: RuleCompilerReport;
  certificationReadiness: CertificationReadinessPreview;
  issues: RuleCompilerIssue[];
}

export interface CreatorCompilePreviewErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  issues: RuleCompilerIssue[];
  report?: RuleCompilerReport;
  certificationReadiness?: CertificationReadinessPreview;
}

export type CreatorCompilePreviewResponse = CreatorCompilePreviewSuccessResponse | CreatorCompilePreviewErrorResponse;

export interface ScenarioCompositionCatalogItem {
  compositionId: string;
  patternId: string;
  name: LocalizedScenarioText;
  summary: LocalizedScenarioText;
  primaryArchetypeId: string;
  supportingArchetypeIds: string[];
  crossCuttingArchetypeIds: string[];
  triggerPattern: string;
  primaryOutput: LocalizedScenarioText;
  acceptanceObject: LocalizedScenarioText;
  readiness: CompositionReadiness;
  eligibleForCompilePreview: boolean;
}

export interface ScenarioCompositionCatalogResponse {
  compositions: ScenarioCompositionCatalogItem[];
}

export interface ScenarioCompositionDetailResponse {
  compositionId: string;
  pattern: ScenarioPatternManifest;
  plan: ScenarioCompositionPlan | ScenarioCompositionDraft;
  compositionSummary: ScenarioPatternCompositionSummary;
  readiness: CompositionReadiness;
  publicBoundary: ScenarioCompositionPlan["publicExposure"];
  compositionCompilerAvailable: true;
  eligibleForCompilePreview: boolean;
}

export interface ScenarioCompositionCompilePreviewRequest {
  compositionId: string;
}

export type ScenarioCompositionCompilePreviewResponse =
  | {
      ok: true;
      result: ScenarioCompositionCompileResult;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
      issues: Array<{
        code: string;
        severity: "error" | "warning";
        message: string;
        compositionId?: string;
        slotId?: string;
        path?: string[];
      }>;
    };

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
