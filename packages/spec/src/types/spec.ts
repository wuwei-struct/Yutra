export type ContextFieldType = "string" | "number" | "boolean" | "object" | "array" | "any";

export interface IntentSpec {
  name: string;
  description?: string;
  entry_state?: string;
}

export interface ContextFieldSpec {
  type?: ContextFieldType;
  required?: boolean;
  description?: string;
  default?: unknown;
}

export interface ContextSpec {
  fields?: Record<string, ContextFieldSpec>;
}

export interface TransitionSpec {
  to: string;
  when?: string;
  guard?: string;
  description?: string;
}

export interface StateSpec {
  description?: string;
  actions?: string[];
  guards?: string[];
  transitions?: TransitionSpec[];
  on_enter?: string[];
  on_exit?: string[];
  final?: boolean;
  handoff?: boolean;
}

export type ActionSideEffect = "none" | "read" | "write" | "external";

export interface ActionSpec {
  name: string;
  description?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  side_effect?: ActionSideEffect;
}

export interface GuardSpec {
  name: string;
  description?: string;
  expression?: string;
  required?: boolean;
}

export interface AgentSpec {
  agent: string;
  version?: string;
  intents?: IntentSpec[];
  context?: ContextSpec;
  initial_state: string;
  states: Record<string, StateSpec>;
  actions?: ActionSpec[];
  guards?: GuardSpec[];
}

export type TraceEventType =
  | "run.started"
  | "intent.resolved"
  | "state.entered"
  | "guard.evaluated"
  | "action.started"
  | "action.succeeded"
  | "action.failed"
  | "transition.resolved"
  | "state.exited"
  | "run.completed"
  | "run.failed"
  | "handoff.requested";

export interface TraceEvent {
  id: string;
  runId: string;
  type: TraceEventType;
  ts: string;
  agent?: string;
  state?: string;
  action?: string;
  transition?: string;
  payload?: Record<string, unknown>;
}
