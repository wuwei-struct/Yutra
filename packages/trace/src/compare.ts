import type { TraceEvent } from "@yutra/spec";
import type { TraceStorage } from "./types";
import { buildContextDiffFramesFromEvents } from "./context-diff";
import { sortTraceEventsDeterministically } from "./replay-frames";

export interface RunPathSummary {
  runId: string;
  agent?: string;
  status: "completed" | "failed" | "handoff" | "unknown";
  finalEventType?: string;
  finalState?: string;
  errorCode?: string;
  statePath: string[];
  actionSequence: string[];
  contextKeys: string[];
  eventCount: number;
}

export interface RunCompareResult {
  left: RunPathSummary;
  right: RunPathSummary;
  sameAgent: boolean;
  differences: {
    status: boolean;
    statePath: boolean;
    actionSequence: boolean;
    errorCode: boolean;
    contextKeys: boolean;
    eventCount: boolean;
  };
}

function getStatusByFinalEvent(type?: string): RunPathSummary["status"] {
  if (type === "run.completed") {
    return "completed";
  }
  if (type === "run.failed") {
    return "failed";
  }
  if (type === "handoff.requested") {
    return "handoff";
  }
  return "unknown";
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function arraysEqual(a: string[], b: string[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function summarizeTracePathFromEvents(runId: string, events: TraceEvent[]): RunPathSummary {
  const sorted = sortTraceEventsDeterministically(events);
  const final = sorted[sorted.length - 1];
  const actionFailed = [...sorted].reverse().find((event) => event.type === "action.failed");
  const statePath = sorted
    .filter((event) => event.type === "state.entered")
    .map((event) => event.state)
    .filter((state): state is string => Boolean(state));
  const actionSequence = sorted
    .filter((event) => event.type === "action.started")
    .map((event) => event.action)
    .filter((action): action is string => Boolean(action));
  const contextDiffs = buildContextDiffFramesFromEvents(sorted);
  const contextKeys = unique(
    contextDiffs.flatMap((frame) => [
      ...frame.change.addedKeys,
      ...frame.change.changedKeys,
      ...frame.change.removedKeys
    ])
  ).sort();

  return {
    runId,
    agent: sorted[0]?.agent,
    status: getStatusByFinalEvent(final?.type),
    finalEventType: final?.type,
    finalState: final?.state,
    errorCode: (actionFailed?.payload as Record<string, unknown> | undefined)?.error
      ? ((actionFailed?.payload as { error?: { code?: string } }).error?.code ?? undefined)
      : undefined,
    statePath,
    actionSequence,
    contextKeys,
    eventCount: sorted.length
  };
}

export async function summarizeRun(storage: TraceStorage, runId: string): Promise<RunPathSummary> {
  const events = await storage.getRunEvents(runId);
  return summarizeTracePathFromEvents(runId, events);
}

export async function compareRuns(
  storage: TraceStorage,
  runIdA: string,
  runIdB: string
): Promise<RunCompareResult> {
  const left = await summarizeRun(storage, runIdA);
  const right = await summarizeRun(storage, runIdB);

  return {
    left,
    right,
    sameAgent: Boolean(left.agent && right.agent && left.agent === right.agent),
    differences: {
      status: left.status !== right.status,
      statePath: !arraysEqual(left.statePath, right.statePath),
      actionSequence: !arraysEqual(left.actionSequence, right.actionSequence),
      errorCode: (left.errorCode ?? "") !== (right.errorCode ?? ""),
      contextKeys: !arraysEqual(left.contextKeys, right.contextKeys),
      eventCount: left.eventCount !== right.eventCount
    }
  };
}
