import { compactTs, eventLabel } from "../lib/trace-formatters";
import type { TraceEvent } from "../types";

interface TraceTimelineProps {
  events: TraceEvent[];
  selectedEventId?: string;
  onSelectEvent: (eventId: string) => void;
  title: string;
  hasRunSelected: boolean;
  noRunSelectedLabel: string;
  selectRunToInspectLabel: string;
  noEventsInRunLabel: string;
}

export function TraceTimeline({
  events,
  selectedEventId,
  onSelectEvent,
  title,
  hasRunSelected,
  noRunSelectedLabel,
  selectRunToInspectLabel,
  noEventsInRunLabel
}: TraceTimelineProps) {
  return (
    <section className="panel timeline">
      <div className="panel-title">{title}</div>
      {events.length === 0 ? (
        <div className="empty">
          {hasRunSelected ? (
            noEventsInRunLabel
          ) : (
            <>
              {noRunSelectedLabel}
              <br />
              {selectRunToInspectLabel}
            </>
          )}
        </div>
      ) : null}
      {events.map((event, index) => (
        <button
          key={event.id}
          type="button"
          className={event.id === selectedEventId ? "timeline-item selected" : "timeline-item"}
          onClick={() => onSelectEvent(event.id)}
        >
          <div className="timeline-index">#{index + 1}</div>
          <div className="timeline-main">
            <div className="timeline-type">{eventLabel(event)}</div>
            <div className="timeline-ts">{compactTs(event.ts)}</div>
          </div>
        </button>
      ))}
    </section>
  );
}
