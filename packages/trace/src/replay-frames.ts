import type { TraceEvent } from "@yutra/spec";

export interface ReplayFrame {
  step: number;
  index: number;
  runId: string;
  id: string;
  type: TraceEvent["type"];
  ts: string;
  state?: string;
  action?: string;
  transition?: string;
  payload?: Record<string, unknown>;
}

export interface ReplayStep {
  step: number;
  type: TraceEvent["type"];
  ts: string;
  events: TraceEvent[];
}

const STEP_EVENT_TYPES = new Set<TraceEvent["type"]>([
  "state.entered",
  "guard.evaluated",
  "action.started",
  "action.succeeded",
  "action.failed",
  "transition.resolved",
  "state.exited",
  "run.completed",
  "run.failed",
  "handoff.requested"
]);

export function sortTraceEventsDeterministically(events: TraceEvent[]): TraceEvent[] {
  return [...events].sort((a, b) => {
    if (a.ts !== b.ts) {
      return a.ts.localeCompare(b.ts);
    }

    const aCounter = a.id.match(/-(\d+)$/);
    const bCounter = b.id.match(/-(\d+)$/);
    if (aCounter && bCounter) {
      const numeric = Number(aCounter[1]) - Number(bCounter[1]);
      if (!Number.isNaN(numeric) && numeric !== 0) {
        return numeric;
      }
    }

    return a.id.localeCompare(b.id);
  });
}

export function getReplayFramesFromEvents(events: TraceEvent[]): ReplayFrame[] {
  const sorted = sortTraceEventsDeterministically(events);
  let step = 0;

  return sorted.map((event, index) => {
    if (STEP_EVENT_TYPES.has(event.type) || index === 0) {
      step += 1;
    }

    return {
      step,
      index,
      runId: event.runId,
      id: event.id,
      type: event.type,
      ts: event.ts,
      state: event.state,
      action: event.action,
      transition: event.transition,
      payload: event.payload
    };
  });
}

export function getReplayStepsFromEvents(events: TraceEvent[]): ReplayStep[] {
  const sorted = sortTraceEventsDeterministically(events);
  const steps: ReplayStep[] = [];

  for (const event of sorted) {
    const shouldStartNewStep =
      steps.length === 0 || STEP_EVENT_TYPES.has(event.type);

    if (shouldStartNewStep) {
      steps.push({
        step: steps.length + 1,
        type: event.type,
        ts: event.ts,
        events: [event]
      });
      continue;
    }

    steps[steps.length - 1]?.events.push(event);
  }

  return steps;
}
