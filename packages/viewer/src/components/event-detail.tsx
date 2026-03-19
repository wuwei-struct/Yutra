import type { TraceEvent } from "../types";

interface EventDetailProps {
  event?: TraceEvent;
  title: string;
  noEventSelectedLabel: string;
  selectEventToInspectLabel: string;
  labels: {
    type: string;
    timestamp: string;
    state: string;
    action: string;
    transition: string;
    payload: string;
    metadata: string;
    error: string;
  };
}

export function EventDetail({
  event,
  title,
  noEventSelectedLabel,
  selectEventToInspectLabel,
  labels
}: EventDetailProps) {
  if (!event) {
    return (
      <aside className="panel event-detail">
        <div className="panel-title">{title}</div>
        <div className="empty">
          {noEventSelectedLabel}
          <br />
          {selectEventToInspectLabel}
        </div>
      </aside>
    );
  }

  const metadata = event.payload && typeof event.payload === "object" ? event.payload.meta : undefined;
  const error = event.payload && typeof event.payload === "object" ? event.payload.error : undefined;

  return (
    <aside className="panel event-detail">
      <div className="panel-title">{title}</div>
      <dl className="detail-grid">
        <dt>{labels.type}</dt>
        <dd>{event.type}</dd>
        <dt>{labels.timestamp}</dt>
        <dd>{event.ts}</dd>
        <dt>{labels.state}</dt>
        <dd>{event.state ?? "-"}</dd>
        <dt>{labels.action}</dt>
        <dd>{event.action ?? "-"}</dd>
        <dt>{labels.transition}</dt>
        <dd>{event.transition ?? "-"}</dd>
      </dl>
      <div className="payload-title">{labels.payload}</div>
      <pre className="payload">{JSON.stringify(event.payload ?? {}, null, 2)}</pre>
      <div className="payload-title">{labels.metadata}</div>
      <pre className="payload">{JSON.stringify(metadata ?? {}, null, 2)}</pre>
      <div className="payload-title">{labels.error}</div>
      <pre className="payload">{JSON.stringify(error ?? {}, null, 2)}</pre>
    </aside>
  );
}
