import type { TraceEvent } from "@yutra/spec";
import type { RunSummary, TraceStorage } from "./types";

/**
 * TODO(PR-04): Optional sqlite implementation can be added when dependency choice is finalized.
 * For v0.1 this class is intentionally non-functional and not wired as default storage.
 */
export class SqliteTraceStorage implements TraceStorage {
  public async append(event: TraceEvent): Promise<void> {
    void event;
    throw new Error("SqliteTraceStorage is not enabled in this build.");
  }

  public async listRuns(): Promise<string[]> {
    throw new Error("SqliteTraceStorage is not enabled in this build.");
  }

  public async getRunEvents(runId: string): Promise<TraceEvent[]> {
    void runId;
    throw new Error("SqliteTraceStorage is not enabled in this build.");
  }

  public async getRunSummary(runId: string): Promise<RunSummary | null> {
    void runId;
    throw new Error("SqliteTraceStorage is not enabled in this build.");
  }
}
