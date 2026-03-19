import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EventDetail } from "../src/components/event-detail";
import { RunList } from "../src/components/run-list";
import { TraceTimeline } from "../src/components/trace-timeline";
import { groupEventsByRunId } from "../src/lib/trace-grouping";
import { loadTraceFromFile, parseJsonlTrace } from "../src/lib/trace-loader";

const SAMPLE_JSONL = [
  '{"id":"r1-1","runId":"r1","type":"run.started","ts":"2026-03-18T00:00:00.000Z","agent":"it-helpdesk-agent"}',
  '{"id":"r1-2","runId":"r1","type":"state.entered","ts":"2026-03-18T00:00:01.000Z","state":"triage"}',
  '{"id":"r1-3","runId":"r1","type":"run.completed","ts":"2026-03-18T00:00:02.000Z"}',
  '{"id":"r2-1","runId":"r2","type":"run.started","ts":"2026-03-18T00:01:00.000Z","agent":"approval-agent"}',
  '{"id":"r2-2","runId":"r2","type":"run.failed","ts":"2026-03-18T00:01:02.000Z"}',
  '{"id":"r3-1","runId":"r3","type":"run.started","ts":"2026-03-18T00:02:00.000Z","agent":"approval-agent"}',
  '{"id":"r3-2","runId":"r3","type":"handoff.requested","ts":"2026-03-18T00:02:04.000Z"}'
].join("\n");

describe("viewer trace utilities and rendering", () => {
  it("viewer can load a jsonl trace file", () => {
    const events = parseJsonlTrace(SAMPLE_JSONL);
    expect(events.length).toBe(7);
    expect(events[0].runId).toBe("r1");
  });

  it("viewer can load a local File object trace", async () => {
    const file = new File([SAMPLE_JSONL], "trace.jsonl", { type: "application/json" });
    const events = await loadTraceFromFile(file);
    expect(events.length).toBe(7);
  });

  it("viewer can group events by runId", () => {
    const events = parseJsonlTrace(SAMPLE_JSONL);
    const grouped = groupEventsByRunId(events);
    expect(Object.keys(grouped).length).toBe(3);
    expect(grouped.r1.length).toBe(3);
  });

  it("viewer can render run list", () => {
    const html = renderToStaticMarkup(
      <RunList
        runs={[
          {
            runId: "r1",
            shortRunId: "r1",
            agent: "it-helpdesk-agent",
            status: "completed",
            startedAt: "2026-03-18T00:00:00.000Z",
            eventCount: 3
          }
        ]}
        selectedRunId="r1"
        onSelectRun={() => undefined}
        title="Run List"
        noRunsLabel="No runs loaded."
        statusLabel="Status"
        startedAtLabel="Started At"
        eventCountLabel="Event Count"
        mapStatus={(status) => status}
      />
    );

    expect(html.includes("Run List")).toBe(true);
    expect(html.includes("it-helpdesk-agent")).toBe(true);
  });

  it("viewer can render timeline for one run", () => {
    const events = parseJsonlTrace(SAMPLE_JSONL).filter((event) => event.runId === "r1");
    const html = renderToStaticMarkup(
      <TraceTimeline
        events={events}
        selectedEventId={events[0].id}
        onSelectEvent={() => undefined}
        title="Timeline"
        hasRunSelected={true}
        noRunSelectedLabel="No run selected."
        selectRunToInspectLabel="Select a run to inspect its trace."
        noEventsInRunLabel="No events in this run."
      />
    );

    expect(html.includes("Timeline")).toBe(true);
    expect(html.includes("run.started")).toBe(true);
  });

  it("viewer can show selected event detail", () => {
    const event = parseJsonlTrace(SAMPLE_JSONL)[1];
    const html = renderToStaticMarkup(
      <EventDetail
        event={event}
        title="Event Detail"
        noEventSelectedLabel="No event selected."
        selectEventToInspectLabel="Select an event to inspect details."
        labels={{
          type: "Type",
          timestamp: "Timestamp",
          state: "State",
          action: "Action",
          transition: "Transition",
          payload: "Payload",
          metadata: "Metadata",
          error: "Error"
        }}
      />
    );

    expect(html.includes("Event Detail")).toBe(true);
    expect(html.includes("state.entered")).toBe(true);
    expect(html.includes("triage")).toBe(true);
  });

  it("viewer can display completed / failed / handoff run status", () => {
    const html = renderToStaticMarkup(
      <RunList
        runs={[
          {
            runId: "r1",
            shortRunId: "r1",
            agent: "a",
            status: "completed",
            startedAt: "2026-03-18T00:00:00.000Z",
            eventCount: 1
          },
          {
            runId: "r2",
            shortRunId: "r2",
            agent: "b",
            status: "failed",
            startedAt: "2026-03-18T00:00:01.000Z",
            eventCount: 1
          },
          {
            runId: "r3",
            shortRunId: "r3",
            agent: "c",
            status: "handoff",
            startedAt: "2026-03-18T00:00:02.000Z",
            eventCount: 1
          }
        ]}
        onSelectRun={() => undefined}
        title="Run List"
        noRunsLabel="No runs loaded."
        statusLabel="Status"
        startedAtLabel="Started At"
        eventCountLabel="Event Count"
        mapStatus={(status) => status}
      />
    );

    expect(html.includes("completed")).toBe(true);
    expect(html.includes("failed")).toBe(true);
    expect(html.includes("handoff")).toBe(true);
  });
});
