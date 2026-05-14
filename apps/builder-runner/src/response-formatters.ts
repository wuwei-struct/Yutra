import type { BuilderTimelineItem } from "./types";

type RunnerTraceEvent = {
  type: string;
  payload?: unknown;
  state?: string;
  action?: string;
  ts?: string;
};

export function toTraceJsonl(events: RunnerTraceEvent[]): string {
  if (events.length === 0) {
    return "";
  }
  return `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
}

export function buildTimeline(events: RunnerTraceEvent[]): BuilderTimelineItem[] {
  return events.map((event, index) => {
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    const error = (payload.error ?? {}) as Record<string, unknown>;
    return {
      index,
      type: event.type,
      state: event.state,
      action: event.action,
      status:
        typeof payload.status === "string"
          ? payload.status
          : event.type === "action.succeeded"
            ? "succeeded"
            : event.type === "action.failed"
              ? "failed"
              : undefined,
      error: typeof error.code === "string" ? error.code : undefined,
      skillName: typeof payload.skillName === "string" ? payload.skillName : undefined,
      implementationType: typeof payload.implementationType === "string" ? payload.implementationType : undefined,
      ts: event.ts
    };
  });
}

export function sanitizeErrorMessage(message: string): string {
  const cwd = process.cwd().replace(/\\/g, "/");
  return message.replaceAll(cwd, "<workspace>");
}
