import type { TraceEvent } from "@yutra/spec";
import type { RunSummary, TraceStorage } from "./types";

function getRunStatus(events: TraceEvent[]): RunSummary["status"] {
  const last = events[events.length - 1];
  if (!last) {
    return "unknown";
  }

  if (last.type === "run.completed") {
    return "completed";
  }

  if (last.type === "run.failed") {
    return "failed";
  }

  if (last.type === "handoff.requested") {
    return "handoff";
  }

  return "unknown";
}

export class MemoryTraceStorage implements TraceStorage {
  private readonly eventsByRun = new Map<string, TraceEvent[]>();

  public async append(event: TraceEvent): Promise<void> {
    const events = this.eventsByRun.get(event.runId) ?? [];
    events.push(event);
    this.eventsByRun.set(event.runId, events);
  }

  public async listRuns(): Promise<string[]> {
    return Array.from(this.eventsByRun.keys()).sort();
  }

  public async getRunEvents(runId: string): Promise<TraceEvent[]> {
    return [...(this.eventsByRun.get(runId) ?? [])];
  }

  public async getRunSummary(runId: string): Promise<RunSummary | null> {
    const events = this.eventsByRun.get(runId);
    if (!events || events.length === 0) {
      return null;
    }

    return {
      runId,
      eventCount: events.length,
      startedAt: events[0]?.ts,
      endedAt: events[events.length - 1]?.ts,
      status: getRunStatus(events)
    };
  }
}
