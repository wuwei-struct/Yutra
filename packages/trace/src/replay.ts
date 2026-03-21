import type { TraceEvent } from "@yutra/spec";
import type { TraceStorage } from "./types";
import {
  getReplayFramesFromEvents,
  getReplayStepsFromEvents,
  type ReplayFrame,
  type ReplayStep,
  sortTraceEventsDeterministically
} from "./replay-frames";

export async function replayRun(storage: TraceStorage, runId: string): Promise<TraceEvent[]> {
  const events = await storage.getRunEvents(runId);
  return sortTraceEventsDeterministically(events);
}

export async function replayRunSteps(storage: TraceStorage, runId: string): Promise<ReplayStep[]> {
  const events = await replayRun(storage, runId);
  return getReplayStepsFromEvents(events);
}

export async function getReplayFrames(storage: TraceStorage, runId: string): Promise<ReplayFrame[]> {
  const events = await replayRun(storage, runId);
  return getReplayFramesFromEvents(events);
}
