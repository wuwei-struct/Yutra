import type { TraceEvent } from "@yutra/spec";
import { getReplayFramesFromEvents, sortTraceEventsDeterministically } from "./replay-frames";

export interface ContextChangeSummary {
  addedKeys: string[];
  changedKeys: string[];
  removedKeys: string[];
}

export interface ContextDiffFrame {
  step: number;
  eventId: string;
  runId: string;
  ts: string;
  state?: string;
  action?: string;
  before?: Record<string, unknown>;
  delta?: Record<string, unknown>;
  after?: Record<string, unknown>;
  change: ContextChangeSummary;
  complete: boolean;
  reason?: string;
}

function cloneContext(input: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(input)) as Record<string, unknown>;
}

function summarizeChange(
  before: Record<string, unknown>,
  delta: Record<string, unknown>,
  after: Record<string, unknown>
): ContextChangeSummary {
  const addedKeys: string[] = [];
  const changedKeys: string[] = [];
  const removedKeys: string[] = [];

  for (const key of Object.keys(delta)) {
    const beforeHas = Object.prototype.hasOwnProperty.call(before, key);
    const afterHas = Object.prototype.hasOwnProperty.call(after, key);

    if (!beforeHas && afterHas) {
      addedKeys.push(key);
      continue;
    }

    if (beforeHas && !afterHas) {
      removedKeys.push(key);
      continue;
    }

    if (before[key] !== after[key]) {
      changedKeys.push(key);
    }
  }

  return {
    addedKeys,
    changedKeys,
    removedKeys
  };
}

function applyDelta(
  context: Record<string, unknown>,
  delta: Record<string, unknown>
): Record<string, unknown> {
  const next = cloneContext(context);
  for (const [key, value] of Object.entries(delta)) {
    if (value === null) {
      delete next[key];
      continue;
    }
    next[key] = value;
  }
  return next;
}

export function buildContextDiffFramesFromEvents(events: TraceEvent[]): ContextDiffFrame[] {
  const sortedEvents = sortTraceEventsDeterministically(events);
  const frames = getReplayFramesFromEvents(sortedEvents);
  const started = sortedEvents.find((event) => event.type === "run.started");
  const inputContext = ((started?.payload as Record<string, unknown> | undefined)?.input as
    | Record<string, unknown>
    | undefined)?.context;
  let currentContext = cloneContext(
    inputContext && typeof inputContext === "object" ? (inputContext as Record<string, unknown>) : {}
  );

  const diffs: ContextDiffFrame[] = [];
  for (const frame of frames) {
    if (frame.type !== "action.succeeded") {
      continue;
    }

    const payload = frame.payload as Record<string, unknown> | undefined;
    const delta = payload?.contextDelta;
    if (!delta || typeof delta !== "object" || Array.isArray(delta)) {
      diffs.push({
        step: frame.step,
        eventId: frame.id,
        runId: frame.runId,
        ts: frame.ts,
        state: frame.state,
        action: frame.action,
        change: { addedKeys: [], changedKeys: [], removedKeys: [] },
        complete: false,
        reason: "contextDelta missing"
      });
      continue;
    }

    const before = cloneContext(currentContext);
    const deltaObj = delta as Record<string, unknown>;
    const after = applyDelta(before, deltaObj);
    const change = summarizeChange(before, deltaObj, after);
    currentContext = after;

    diffs.push({
      step: frame.step,
      eventId: frame.id,
      runId: frame.runId,
      ts: frame.ts,
      state: frame.state,
      action: frame.action,
      before,
      delta: deltaObj,
      after,
      change,
      complete: true
    });
  }

  return diffs;
}

export function buildContextTimelineFromEvents(events: TraceEvent[]): Record<string, unknown>[] {
  const frames = buildContextDiffFramesFromEvents(events);
  return frames.filter((frame) => frame.complete && frame.after).map((frame) => frame.after as Record<string, unknown>);
}
