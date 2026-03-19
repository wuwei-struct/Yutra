import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { TraceEvent } from "@yutra/spec";
import type { RunSummary, TraceStorage } from "./types";

function parseJsonl(content: string): TraceEvent[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as TraceEvent);
}

function runStatus(events: TraceEvent[]): RunSummary["status"] {
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

export class JsonlTraceStorage implements TraceStorage {
  private readonly filePath: string;

  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async append(event: TraceEvent): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, `${JSON.stringify(event)}\n`, "utf8");
  }

  public async listRuns(): Promise<string[]> {
    const all = await this.readAllEvents();
    return Array.from(new Set(all.map((event) => event.runId))).sort();
  }

  public async getRunEvents(runId: string): Promise<TraceEvent[]> {
    const all = await this.readAllEvents();
    return all.filter((event) => event.runId === runId);
  }

  public async getRunSummary(runId: string): Promise<RunSummary | null> {
    const events = await this.getRunEvents(runId);
    if (events.length === 0) {
      return null;
    }

    return {
      runId,
      eventCount: events.length,
      startedAt: events[0]?.ts,
      endedAt: events[events.length - 1]?.ts,
      status: runStatus(events)
    };
  }

  private async readAllEvents(): Promise<TraceEvent[]> {
    try {
      const content = await readFile(this.filePath, "utf8");
      return parseJsonl(content);
    } catch {
      return [];
    }
  }
}
