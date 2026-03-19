import type { TraceEvent } from "@yutra/spec";
import type { TraceStorage } from "./types";

export async function replayRun(storage: TraceStorage, runId: string): Promise<TraceEvent[]> {
  return storage.getRunEvents(runId);
}
