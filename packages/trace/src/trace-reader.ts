import type { TraceEvent } from "@yutra/spec";
import type { RunSummary, TraceStorage } from "./types";

export class TraceReader {
  private readonly storage: TraceStorage;

  public constructor(storage: TraceStorage) {
    this.storage = storage;
  }

  public async listRuns(): Promise<string[]> {
    return this.storage.listRuns();
  }

  public async getRunEvents(runId: string): Promise<TraceEvent[]> {
    return this.storage.getRunEvents(runId);
  }

  public async getRunTimeline(runId: string): Promise<TraceEvent[]> {
    const events = await this.storage.getRunEvents(runId);
    return [...events].sort((a, b) => a.ts.localeCompare(b.ts));
  }

  public async getLatestRun(): Promise<RunSummary | null> {
    const runIds = await this.storage.listRuns();
    if (runIds.length === 0) {
      return null;
    }

    const summaries: RunSummary[] = [];
    for (const runId of runIds) {
      const summary = await this.storage.getRunSummary(runId);
      if (summary) {
        summaries.push(summary);
      }
    }

    summaries.sort((a, b) => (b.endedAt ?? "").localeCompare(a.endedAt ?? ""));
    return summaries[0] ?? null;
  }
}
