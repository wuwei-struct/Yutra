import type { AgentSpec, StateSpec } from "@yutra/spec";
import type { TraceEvent } from "@yutra/spec";
import type { TraceRecorder, TraceStorage } from "@yutra/trace";

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
  state?: string;
  action?: string;
  step?: number;
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
  intentResolver?: IntentResolver;
  actionRegistry?: ActionRegistry;
  traceRecorder?: TraceRecorder;
  traceStorage?: TraceStorage;
}

export interface RuntimeRunContext {
  runId: string;
  spec: AgentSpec;
  input: RuntimeInput;
  context: Record<string, unknown>;
  currentState: string;
  step: number;
  visitedStates: string[];
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
  error?: {
    code: string;
    message: string;
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
  error?: RuntimeError;
  meta?: Record<string, unknown>;
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
