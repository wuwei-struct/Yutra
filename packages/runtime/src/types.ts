import type { ActionImplementationSpec, ActionRiskLevel, ActionSideEffect, AgentSpec, StateSpec } from "@yutra/spec";
import type { TraceEvent } from "@yutra/spec";
import type { TraceRecorder, TraceStorage } from "@yutra/trace";
import type { SkillRegistry } from "@yutra/skill-core";

export type RuntimeStatus = "completed" | "failed" | "handoff" | "stuck";

export interface RuntimeInput {
  text?: string;
  intent?: string;
  context?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface RuntimeError {
  code: string;
  message: string;
  stage?: string;
  retryable?: boolean;
  budgetType?: "duration" | "external_calls" | "steps";
  state?: string;
  action?: string;
  step?: number;
  cause?: {
    code?: string;
    message?: string;
  };
  details?: Record<string, unknown>;
}

export interface RuntimeResult {
  runId: string;
  agent: string;
  status: RuntimeStatus;
  intent?: string;
  finalState?: string;
  steps: number;
  visitedStates: string[];
  context: Record<string, unknown>;
  error?: RuntimeError;
  traceEvents?: TraceEvent[];
}

export interface RuntimeOptions {
  maxSteps?: number;
  maxDurationMs?: number;
  maxExternalCalls?: number;
  actionTimeoutMs?: number;
  retryPolicy?: RetryPolicy;
  actionPolicies?: Record<string, ActionExecutionPolicy>;
  contextMergePolicy?: ContextMergePolicy;
  idempotencyStore?: IdempotencyStore;
  snapshotStore?: SnapshotStore;
  checkpointPolicy?: CheckpointPolicy;
  resumeFromSnapshot?: RuntimeSnapshot;
  environment?: EnvironmentProfile;
  policyPack?: PolicyPack;
  intentResolver?: IntentResolver;
  actionRegistry?: ActionRegistry;
  skillSearchPaths?: string[];
  skillRegistry?: Pick<SkillRegistry, "get" | "inspect" | "list">;
  traceRecorder?: TraceRecorder;
  traceStorage?: TraceStorage;
}

export interface RuntimeRunContext {
  runId: string;
  idempotencyScopeId: string;
  spec: AgentSpec;
  input: RuntimeInput;
  context: Record<string, unknown>;
  currentState: string;
  step: number;
  externalCalls: number;
  visitedStates: string[];
  completedActionKeys: string[];
  resumedFrom?: string;
  isResumed?: boolean;
  environment?: EnvironmentProfile;
  appliedPolicyPack?: {
    name: string;
    version?: string;
  };
}

export interface IntentResolution {
  intent?: string;
  entryState?: string;
  meta?: Record<string, unknown>;
}

export interface IntentResolver {
  name: string;
  resolve(input: RuntimeInput, spec: AgentSpec, ctx: RuntimeRunContext): Promise<IntentResolution>;
}

export interface GuardEvaluationResult {
  guardName: string;
  passed: boolean;
  expression?: string;
  reason?: string;
}

export interface ActionHandlerResult {
  ok: boolean;
  output?: unknown;
  contextPatch?: Record<string, unknown>;
  idempotencyKey?: string;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
    details?: Record<string, unknown>;
  };
  meta?: Record<string, unknown>;
}

export type ActionHandler = (ctx: RuntimeRunContext) => Promise<ActionHandlerResult>;
export type ActionRegistry = Record<string, ActionHandler>;

export interface ActionExecutionResult {
  actionName: string;
  ok: boolean;
  output?: unknown;
  contextPatch?: Record<string, unknown>;
  idempotencyKey?: string;
  idempotencyHit?: boolean;
  error?: RuntimeError;
  meta?: Record<string, unknown>;
  attempt: number;
  maxAttempts: number;
  finalAttempt: boolean;
  durationMs: number;
  timeoutMs: number;
  retryable: boolean;
  sideEffect: ActionSideEffect;
  externalCallCount: number;
}

export interface RetryPolicy {
  maxAttempts?: number;
  backoffMs?: number;
  retryOn?: string[];
}

export interface ActionExecutionPolicy {
  timeoutMs?: number;
  retryPolicy?: RetryPolicy;
  sideEffect?: ActionSideEffect;
  riskLevel?: ActionRiskLevel;
  requiresApproval?: boolean;
  implementation?: ActionImplementationSpec;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface ActionAttemptStartInfo {
  actionName: string;
  attempt: number;
  maxAttempts: number;
  timeoutMs: number;
  sideEffect: ActionSideEffect;
  idempotencyKey: string;
  idempotencyHit: boolean;
  resumedRun?: boolean;
  implementationType?: "function" | "tool" | "skill";
  skillName?: string;
  skillVersion?: string;
  skillEntry?: string;
  riskLevel?: ActionRiskLevel;
  requiresApproval?: boolean;
  inputValidated?: boolean;
}

export interface ActionAttemptResultInfo {
  actionName: string;
  attempt: number;
  maxAttempts: number;
  timeoutMs: number;
  sideEffect: ActionSideEffect;
  idempotencyKey: string;
  idempotencyHit: boolean;
  resumedRun?: boolean;
  ok: boolean;
  output?: unknown;
  contextPatch?: Record<string, unknown>;
  error?: RuntimeError;
  meta?: Record<string, unknown>;
  durationMs: number;
  retryable: boolean;
  finalAttempt: boolean;
  implementationType?: "function" | "tool" | "skill";
  skillName?: string;
  skillVersion?: string;
  skillEntry?: string;
  riskLevel?: ActionRiskLevel;
  requiresApproval?: boolean;
  inputValidated?: boolean;
  outputValidated?: boolean;
}

export interface ResolvedTransition {
  from: string;
  to: string;
  guard?: string;
  when?: string;
  description?: string;
}

export interface TransitionResolutionResult {
  transition: ResolvedTransition | null;
  reason?: string;
  guardEvaluations?: GuardEvaluationResult[];
}

export interface StateEngineStepResult {
  status: RuntimeStatus | "continue";
  nextState?: string;
  error?: RuntimeError;
  state: StateSpec;
}

export interface ContextMergePolicy {
  strategy?: "shallow" | "shallow_object_merge";
  allowNull?: boolean;
}

export interface ContextMergeErrorDetail {
  field?: string;
  expectedType?: string;
  actualType?: string;
  mergeStrategy?: string;
}

export interface IdempotencyRecord {
  key: string;
  actionName: string;
  state: string;
  scopeId: string;
  output?: unknown;
  contextPatch?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  ts: string;
}

export interface IdempotencyStore {
  has(key: string): Promise<boolean> | boolean;
  get(key: string): Promise<IdempotencyRecord | undefined> | IdempotencyRecord | undefined;
  set(record: IdempotencyRecord): Promise<void> | void;
}

export interface RuntimeSnapshot {
  snapshotId: string;
  runId: string;
  agent: string;
  currentState: string;
  context: Record<string, unknown>;
  stepCount: number;
  externalCallCount: number;
  visitedStates: string[];
  completedActionKeys: string[];
  idempotencyRecords: IdempotencyRecord[];
  ts: string;
  status: "running" | RuntimeStatus;
  lineage?: {
    rootRunId: string;
    resumedFrom?: string;
  };
}

export interface SnapshotStore {
  save(snapshot: RuntimeSnapshot): Promise<void> | void;
  load(snapshotId: string): Promise<RuntimeSnapshot | undefined> | RuntimeSnapshot | undefined;
  latestByRun(runId: string): Promise<RuntimeSnapshot | undefined> | RuntimeSnapshot | undefined;
  list(runId?: string): Promise<RuntimeSnapshot[]> | RuntimeSnapshot[];
}

export interface CheckpointPolicy {
  onStateEntered?: boolean;
  onActionSucceeded?: boolean;
}

export type EnvironmentProfile = "dev" | "demo" | "prod-like";

export interface ActionPolicyRule {
  action: string;
  allow?: boolean;
  reason?: string;
  environments?: string[];
  requireHandoff?: boolean;
  reasonCode?: string;
}

export interface SideEffectPolicyRule {
  sideEffect: "none" | "read" | "write" | "external";
  allow?: boolean;
  maxCalls?: number;
  reason?: string;
  environments?: string[];
  requireHandoff?: boolean;
  reasonCode?: string;
}

export interface HandoffPolicyRule {
  action?: string;
  state?: string;
  reasonCode: string;
  summaryTemplate?: string;
  environments?: string[];
}

export interface PolicyPack {
  name: string;
  version?: string;
  environment?: EnvironmentProfile;
  actionRules?: ActionPolicyRule[];
  sideEffectRules?: SideEffectPolicyRule[];
  handoffRules?: HandoffPolicyRule[];
}
