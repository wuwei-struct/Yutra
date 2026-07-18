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

export type RunPreviewEvidenceStatus = "none" | "ready" | "failed" | "stale";

export interface RunPreviewEvidence {
  status: RunPreviewEvidenceStatus;
  runId?: string;
  runStatus?: string;
  sourceMode: "builder" | "dsl";
  capturedAt: string;
  eventCount?: number;
  hasTraceEvents: boolean;
  hasAuditBundle: boolean;
  compiledDsl?: {
    compileId?: string;
    compilerVersion?: string;
    configHash?: string;
    artifactHash?: string;
    inspected?: boolean;
  };
  reason?: string;
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

export interface ScenarioLocalizedText {
  en: string;
  zhCN: string;
}

export interface ScenarioCompositionReadiness {
  contractValid: boolean;
  patternAligned: boolean;
  allProductArchetypesCompilerEnabled: boolean;
  allProductArchetypesWorkbenchEnabled: boolean;
  allCrossCuttingAvailable: boolean;
  compositionCompilerAvailable: boolean;
  status: "compile_ready" | "partially_supported" | "contract_only" | "invalid";
  blockers: string[];
}

export interface ScenarioCompositionCatalogItem {
  compositionId: string;
  patternId: string;
  name: ScenarioLocalizedText;
  summary: ScenarioLocalizedText;
  primaryArchetypeId: string;
  supportingArchetypeIds: string[];
  crossCuttingArchetypeIds: string[];
  triggerPattern: string;
  primaryOutput: ScenarioLocalizedText;
  acceptanceObject: ScenarioLocalizedText;
  readiness: ScenarioCompositionReadiness;
  eligibleForCompilePreview: boolean;
  compositionPreviewAvailable: boolean;
  orchestratorPreviewAvailable: boolean;
  orchestratorCompileProfileId?: string;
  orchestratorRuntimeSupported: false;
  orchestratorBlockers: string[];
}

export interface ScenarioCompositionPublicBoundary {
  mode: "demo_only";
  containsCustomerData: false;
  containsRealEndpoint: false;
  containsSecret: false;
  containsCustomerSop: false;
  containsCommercialDeliveryAsset: false;
}

export interface ScenarioCompositionSlot {
  slotId: string;
  role: "primary" | "supporting";
  archetypeId: string;
  packConfigId: string;
  purpose: ScenarioLocalizedText;
}

export interface ScenarioCompositionRoute {
  routeId: string;
  fromSlotId: string;
  toSlotId: string;
  trigger: string;
  conditionRef: string;
  returnMode: string;
}

export interface ScenarioCompositionBinding {
  bindingId: string;
  fromSlotId: string;
  fromPath: string;
  toSlotId: string;
  toPath: string;
  required: boolean;
  transform: "identity";
}

export interface ScenarioCompositionOverlay {
  overlayId: string;
  archetypeId: string;
  scopes: Array<{ type: string; slotId?: string; routeId?: string }>;
  enforcementMode: string;
}

export interface ScenarioCompositionPlanView {
  schemaVersion: "1.0.0";
  compositionId: string;
  version?: string;
  patternRef: { patternId: string; version: string };
  executionModel: "orchestrated_subflows";
  primarySlotId?: string;
  slots?: ScenarioCompositionSlot[];
  crossCuttingOverlays?: ScenarioCompositionOverlay[];
  routes?: ScenarioCompositionRoute[];
  dataBindings?: ScenarioCompositionBinding[];
  precedencePolicy?: {
    rules: string[];
    conflictMode: "fail_closed";
  };
  primaryArchetypeId?: string;
  supportingArchetypeIds?: string[];
  crossCuttingArchetypeIds?: string[];
  status?: "contract_only";
  eligibleForCompilerInput?: false;
  blockers?: string[];
  publicExposure: ScenarioCompositionPublicBoundary;
}

export interface ScenarioPatternCompositionSummary {
  patternId: string;
  triggerPattern: string;
  primaryOutput: ScenarioLocalizedText;
  acceptanceObject: ScenarioLocalizedText;
  primitiveCoverage: string[];
  governanceFocus: {
    en: string[];
    zhCN: string[];
  };
}

export interface ScenarioCompositionDetailResponse {
  compositionId: string;
  pattern: {
    patternId: string;
    version: string;
    name: ScenarioLocalizedText;
    summary: ScenarioLocalizedText;
    primaryArchetypeId: string;
    supportingArchetypeIds: string[];
    crossCuttingArchetypeIds: string[];
    triggerPattern: string;
  };
  plan: ScenarioCompositionPlanView;
  compositionSummary: ScenarioPatternCompositionSummary;
  readiness: ScenarioCompositionReadiness;
  publicBoundary: ScenarioCompositionPublicBoundary;
  compositionCompilerAvailable: true;
  eligibleForCompilePreview: boolean;
  compositionPreviewAvailable: boolean;
  orchestratorPreviewAvailable: boolean;
  orchestratorCompileProfileId?: string;
  orchestratorRuntimeSupported: false;
  orchestratorBlockers: string[];
}

export interface CompiledScenarioCompositionSlot {
  slotId: string;
  role: "primary" | "supporting";
  archetypeId: string;
  packConfigId: string;
  namespace: string;
  configHash: string;
  artifactHashes: Record<string, string>;
  artifacts: Record<string, string>;
}

export interface ScenarioCompositionCompileResult {
  schemaVersion: "1.0.0";
  mode: "preview";
  compositionId: string;
  compositionVersion: string;
  patternId: string;
  executionModel: "orchestrated_subflows";
  previewOnly: true;
  runtimeExecutable: false;
  compositionCompilerVersion: string;
  planHash: string;
  bundleHash: string;
  slots: CompiledScenarioCompositionSlot[];
  compositionArtifacts: Record<string, string>;
  compileReport: {
    success: true;
    slotCount: number;
    warnings: Array<{ code: string; message: string }>;
    blockers: string[];
  };
}

export type ScenarioCompositionCompilePreviewResponse =
  | {
      ok: true;
      result: ScenarioCompositionCompileResult;
    }
  | {
      ok: false;
      error: { code: string; message: string };
      issues: Array<{ code: string; message: string; severity: "error" | "warning" }>;
    };

export interface ScenarioOrchestratorSlotView {
  slotId: string;
  role: "primary" | "supporting";
  archetypeId: string;
  packConfigId: string;
  artifactRef: {
    namespace: string;
    agentArtifactPath: string;
    agentArtifactHash: string;
    configHash: string;
  };
  inputNamespace: string;
  stateNamespace: string;
  outputNamespace: string;
  acceptedOutcomes: string[];
  callableBySlotIds: string[];
}

export interface ScenarioOrchestratorRouteView {
  routeId: string;
  fromSlotId: string;
  outcome: string;
  conditionRef: string;
  priority: number;
  effect: {
    type: string;
    targetSlotId?: string;
    returnToSlotId?: string;
    terminalId?: string;
  };
  provenanceRef: { compositionRouteId: string };
}

export interface ScenarioOrchestratorDocumentView {
  schemaVersion: "1.0.0-preview";
  kind: "scenario_orchestrator";
  orchestratorId: string;
  version: string;
  compositionRef: {
    compositionId: string;
    compositionVersion: string;
    patternId: string;
    planHash: string;
    bundleHash: string;
  };
  executionModel: "single_active_slot_call_return";
  previewOnly: true;
  runtimeExecutable: false;
  entrySlotId: string;
  slots: ScenarioOrchestratorSlotView[];
  routes: ScenarioOrchestratorRouteView[];
  bindings: Array<Record<string, unknown>>;
  terminals: Array<{
    terminalId: "$scenario_done" | "$human_handoff" | "$fail_closed";
    status: string;
    requiresAudit: true;
    primaryOutputRequired: boolean;
  }>;
  contextPolicy: {
    rootNamespace: "scenario";
    sharedNamespace: "scenario.shared";
    inputNamespace: "scenario.input";
    outputNamespace: "scenario.output";
    slotNamespacePattern: "slots.<slotId>";
    writePolicy: Record<string, string>;
    implicitMergeAllowed: false;
    implicitCrossSlotReadAllowed: false;
    implicitCrossSlotWriteAllowed: false;
    secretPropagationAllowed: false;
    adapterInheritanceAllowed: false;
  };
  executionPolicy: {
    scheduling: "single_active_slot";
    invocationModel: "call_return";
    parallelism: "disabled";
    recursion: "disabled";
    implicitLooping: "disabled";
    budgets: {
      maxSlotInvocations: number;
      maxRouteEvaluations: number;
      maxBindingApplications: number;
      maxCallDepth: 1;
    };
  };
  failurePolicy: Record<string, unknown>;
  handoffPolicy: Record<string, unknown>;
  tracePolicy: {
    contractVersion: "1.0.0-preview";
    mandatoryEventTypes: string[];
    eventEmissionImplemented: false;
    auditRequired: true;
    contextSnapshotRedactionRequired: true;
    provenanceRequired: true;
  };
  precedencePolicyRef: {
    conflictMode: "fail_closed";
    rules: string[];
  };
  overlayRefs: Array<Record<string, unknown>>;
  provenance: {
    compositionId: string;
    compositionVersion: string;
    patternId: string;
    planHash: string;
    bundleHash: string;
    orchestratorHash: string;
    slotSources: Array<Record<string, unknown>>;
    routeSources: Array<Record<string, unknown>>;
    bindingSources: Array<Record<string, unknown>>;
    overlaySources: Array<Record<string, unknown>>;
  };
  publicExposure: ScenarioCompositionPublicBoundary;
}

export interface ScenarioOrchestratorCompileResult {
  schemaVersion: "1.0.0";
  mode: "preview";
  compositionId: string;
  compositionVersion: string;
  patternId: string;
  orchestratorId: string;
  orchestratorVersion: string;
  previewOnly: true;
  runtimeExecutable: false;
  currentRuntimeSupported: false;
  compilerVersion: string;
  planHash: string;
  compositionBundleHash: string;
  orchestratorHash: string;
  previewBundleHash: string;
  compositionResult: ScenarioCompositionCompileResult;
  orchestratorDocument: ScenarioOrchestratorDocumentView;
  orchestratorArtifacts: Record<string, string>;
  artifactHashes: Record<string, string>;
  compileReport: {
    success: true;
    slotCount: number;
    routeCount: number;
    bindingCount: number;
    overlayCount: number;
    warnings: Array<{ code: string; message: string }>;
    blockers: string[];
    previewOnly: true;
    runtimeExecutable: false;
    currentRuntimeSupported: false;
    noAgentDslGenerated: true;
    noRuntimeExecution: true;
  };
}

export type ScenarioOrchestratorCompilePreviewResponse =
  | {
      ok: true;
      result: ScenarioOrchestratorCompileResult;
    }
  | {
      ok: false;
      error: { code: string; message: string };
      issues: Array<{ code: string; message: string; severity: "error" | "warning" }>;
    };
