import type { RunSummary, TraceEvent } from "../types";

function statusFromEvents(events: TraceEvent[]): RunSummary["status"] {
  const types = events.map((event) => event.type);
  if (types.includes("handoff.requested")) {
    return "handoff";
  }
  if (types.includes("run.failed")) {
    return "failed";
  }
  if (types.includes("run.completed")) {
    return "completed";
  }
  return "running";
}

export function groupEventsByRunId(events: TraceEvent[]): Record<string, TraceEvent[]> {
  const grouped: Record<string, TraceEvent[]> = {};

  for (const event of events) {
    if (!grouped[event.runId]) {
      grouped[event.runId] = [];
    }
    grouped[event.runId].push(event);
  }

  for (const runId of Object.keys(grouped)) {
    grouped[runId].sort((a, b) => a.ts.localeCompare(b.ts));
  }

  return grouped;
}

export function buildRunSummaries(grouped: Record<string, TraceEvent[]>): RunSummary[] {
  const summaries = Object.entries(grouped).map(([runId, events]) => {
    const first = events[0];
    const last = events[events.length - 1];

    return {
      runId,
      shortRunId: runId.slice(0, 8),
      agent: first?.agent ?? "unknown-agent",
      status: statusFromEvents(events),
      startedAt: first?.ts ?? "-",
      endedAt: last?.ts,
      eventCount: events.length
    };
  });

  summaries.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return summaries;
}
