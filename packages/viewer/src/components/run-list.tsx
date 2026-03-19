import type { ReactNode } from "react";
import { compactTs, statusClass } from "../lib/trace-formatters";
import type { RunSummary } from "../types";

interface RunListProps {
  runs: RunSummary[];
  selectedRunId?: string;
  onSelectRun: (runId: string) => void;
  controls?: ReactNode;
  error?: string;
  title: string;
  noRunsLabel: string;
  statusLabel: string;
  startedAtLabel: string;
  eventCountLabel: string;
  mapStatus: (status: RunSummary["status"]) => string;
}

export function RunList({
  runs,
  selectedRunId,
  onSelectRun,
  controls,
  error,
  title,
  noRunsLabel,
  statusLabel,
  startedAtLabel,
  eventCountLabel,
  mapStatus
}: RunListProps) {
  return (
    <aside className="panel run-list">
      <div className="panel-title">{title}</div>
      {controls ? <div className="run-controls">{controls}</div> : null}
      {error ? <div className="error">{error}</div> : null}
      {runs.length === 0 ? <div className="empty">{noRunsLabel}</div> : null}
      {runs.map((run) => (
        <button
          key={run.runId}
          type="button"
          className={run.runId === selectedRunId ? "run-item selected" : "run-item"}
          onClick={() => onSelectRun(run.runId)}
        >
          <div className="run-row">
            <span className="run-id">{run.shortRunId}</span>
            <span className={statusClass(run.status)}>{mapStatus(run.status)}</span>
          </div>
          <div className="run-agent">{run.agent}</div>
          <div className="run-meta">
            {statusLabel}: {mapStatus(run.status)}
          </div>
          <div className="run-meta">
            {startedAtLabel}: {compactTs(run.startedAt)}
          </div>
          <div className="run-meta">
            {eventCountLabel}: {run.eventCount}
          </div>
        </button>
      ))}
    </aside>
  );
}
