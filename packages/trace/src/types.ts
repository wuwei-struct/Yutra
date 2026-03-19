import type { TraceEvent } from "@yutra/spec";

export interface RunSummary {
  runId: string;
  eventCount: number;
  startedAt?: string;
  endedAt?: string;
  status?: "completed" | "failed" | "handoff" | "unknown";
}

export interface TraceStorage {
  append(event: TraceEvent): Promise<void>;
  listRuns(): Promise<string[]>;
  getRunEvents(runId: string): Promise<TraceEvent[]>;
  getRunSummary(runId: string): Promise<RunSummary | null>;
}
