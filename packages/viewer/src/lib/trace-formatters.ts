import type { TraceEvent } from "../types";

export function compactTs(ts: string): string {
  if (!ts) {
    return "-";
  }
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) {
    return ts;
  }
  return date.toLocaleString();
}

export function eventLabel(event: TraceEvent): string {
  if (event.type === "transition.resolved" && event.transition) {
    return `${event.type} (${event.transition})`;
  }
  if ((event.type === "action.started" || event.type === "action.succeeded" || event.type === "action.failed") && event.action) {
    return `${event.type} (${event.action})`;
  }
  if ((event.type === "state.entered" || event.type === "state.exited") && event.state) {
    return `${event.type} (${event.state})`;
  }
  return event.type;
}

export function statusClass(status: "completed" | "failed" | "handoff" | "running"): string {
  if (status === "completed") {
    return "status status-completed";
  }
  if (status === "failed") {
    return "status status-failed";
  }
  if (status === "handoff") {
    return "status status-handoff";
  }
  return "status status-running";
}
