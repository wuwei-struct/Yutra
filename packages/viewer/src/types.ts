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
  type: TraceEventType | string;
  ts: string;
  agent?: string;
  state?: string;
  action?: string;
  transition?: string;
  payload?: Record<string, unknown>;
}

export interface RunSummary {
  runId: string;
  shortRunId: string;
  agent: string;
  status: "completed" | "failed" | "handoff" | "running";
  startedAt: string;
  endedAt?: string;
  eventCount: number;
}
