import type { AgentSpec, TraceEvent } from "@yutra/spec";
import type { DslValidationIssue, DslValidationResult } from "@yutra/dsl";

function formatIssue(issue: DslValidationIssue): string {
  const path = issue.path && issue.path.length > 0 ? ` path=${issue.path.join(".")}` : "";
  const hint = issue.hint ? ` hint=${issue.hint}` : "";
  return `- [${issue.code}] ${issue.message}${path}${hint}`;
}

export function formatValidateSummary(spec: AgentSpec, validation: DslValidationResult): string[] {
  const actionRefCount = Object.values(spec.states).reduce((count, state) => count + (state.actions?.length ?? 0), 0);
  const guardRefCount =
    Object.values(spec.states).reduce((count, state) => count + (state.guards?.length ?? 0), 0) +
    Object.values(spec.states).reduce(
      (count, state) => count + (state.transitions?.filter((transition) => Boolean(transition.guard)).length ?? 0),
      0
    );

  return [
    `agent: ${spec.agent}`,
    `initial_state: ${spec.initial_state}`,
    `states: ${Object.keys(spec.states).length}`,
    `action_references: ${actionRefCount}`,
    `guard_references: ${guardRefCount}`,
    `issues: errors=${validation.errors.length}, warnings=${validation.warnings.length}`
  ];
}

export function formatIssues(title: string, issues: DslValidationIssue[]): string[] {
  if (issues.length === 0) {
    return [`${title}: none`];
  }

  return [title, ...issues.map((issue) => formatIssue(issue))];
}

export function formatRunSummary(result: {
  runId: string;
  agent: string;
  status: string;
  intent?: string;
  initialState?: string;
  finalState?: string;
  steps: number;
  traceFile?: string;
  errorCode?: string;
  errorMessage?: string;
}): string[] {
  const lines = [
    `runId: ${result.runId}`,
    `agent: ${result.agent}`,
    `status: ${result.status}`,
    `intent: ${result.intent ?? "-"}`,
    `initial_state: ${result.initialState ?? "-"}`,
    `final_state: ${result.finalState ?? "-"}`,
    `steps: ${result.steps}`
  ];

  if (result.traceFile) {
    lines.push(`trace_file: ${result.traceFile}`);
  }

  if (result.errorCode || result.errorMessage) {
    lines.push(`error: ${result.errorCode ?? "UNKNOWN"} ${result.errorMessage ?? ""}`.trim());
  }

  return lines;
}

export function formatTraceTable(rows: Array<Record<string, string>>): string[] {
  if (rows.length === 0) {
    return ["No runs found."];
  }

  const columns = ["runId", "agent", "status", "startedAt", "endedAt", "eventCount"];
  const widths = Object.fromEntries(
    columns.map((column) => [column, Math.max(column.length, ...rows.map((row) => (row[column] ?? "").length))])
  ) as Record<string, number>;

  const header = columns.map((column) => column.padEnd(widths[column])).join("  ");
  const separator = columns.map((column) => "-".repeat(widths[column])).join("  ");
  const body = rows.map((row) => columns.map((column) => (row[column] ?? "").padEnd(widths[column])).join("  "));

  return [header, separator, ...body];
}

export function formatTraceTimeline(events: TraceEvent[]): string[] {
  if (events.length === 0) {
    return ["No events found."];
  }

  return events.map((event) => {
    const parts = [`${event.ts}`, event.type];
    if (event.state) {
      parts.push(`state=${event.state}`);
    }
    if (event.action) {
      parts.push(`action=${event.action}`);
    }
    if (event.transition) {
      parts.push(`transition=${event.transition}`);
    }
    return parts.join(" | ");
  });
}
