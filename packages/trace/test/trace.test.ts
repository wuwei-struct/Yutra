import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AgentSpec, TraceEvent } from "@yutra/spec";
import { executeRun } from "../../runtime/src/execute-run";
import { JsonlTraceStorage } from "../src/jsonl-storage";
import { MemoryTraceStorage } from "../src/memory-storage";
import { replayRun } from "../src/replay";
import { TraceReader } from "../src/trace-reader";
import { TraceRecorder } from "../src/trace-recorder";

function sampleEvent(overrides: Partial<TraceEvent> = {}): TraceEvent {
  return {
    id: "evt-1",
    runId: "run-1",
    type: "run.started",
    ts: "2026-03-18T00:00:00.000Z",
    ...overrides
  };
}

const integrationSpec: AgentSpec = {
  agent: "trace-integration-agent",
  initial_state: "start",
  actions: [{ name: "ok_action" }, { name: "fail_action" }],
  states: {
    start: {
      actions: ["ok_action"],
      transitions: [{ to: "done" }]
    },
    done: {
      final: true
    }
  }
};

describe("@yutra/trace core", () => {
  it("trace recorder writes run lifecycle events", async () => {
    const storage = new MemoryTraceStorage();
    const recorder = new TraceRecorder(storage);
    await recorder.append(sampleEvent({ type: "run.started" }));
    await recorder.append(sampleEvent({ id: "evt-2", type: "run.completed" }));
    await recorder.flush();

    const events = await storage.getRunEvents("run-1");
    expect(events.map((event) => event.type)).toEqual(["run.started", "run.completed"]);
  });

  it("memory storage can append and read events by runId", async () => {
    const storage = new MemoryTraceStorage();
    await storage.append(sampleEvent({ runId: "run-a", id: "a1" }));
    await storage.append(sampleEvent({ runId: "run-b", id: "b1" }));
    await storage.append(sampleEvent({ runId: "run-a", id: "a2", type: "run.completed" }));

    const runAEvents = await storage.getRunEvents("run-a");
    const runs = await storage.listRuns();

    expect(runAEvents).toHaveLength(2);
    expect(runs).toEqual(["run-a", "run-b"]);
  });

  it("jsonl storage can persist and reload events", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-trace-jsonl-"));
    const filePath = join(dir, "trace.jsonl");
    const storage = new JsonlTraceStorage(filePath);

    await storage.append(sampleEvent({ runId: "run-jsonl", id: "j1" }));
    await storage.append(sampleEvent({ runId: "run-jsonl", id: "j2", type: "run.completed" }));

    const loaded = await storage.getRunEvents("run-jsonl");
    const fileRaw = await readFile(filePath, "utf8");
    await rm(dir, { recursive: true, force: true });

    expect(loaded).toHaveLength(2);
    expect(fileRaw.split("\n").filter(Boolean)).toHaveLength(2);
  });

  it("runtime integration emits expected trace sequence", async () => {
    const storage = new MemoryTraceStorage();
    const recorder = new TraceRecorder(storage);
    const result = await executeRun({
      spec: integrationSpec,
      options: {
        traceRecorder: recorder,
        actionRegistry: {
          ok_action: async () => ({ ok: true, contextPatch: { ok: true } })
        }
      }
    });

    const events = result.traceEvents ?? [];
    expect(events[0]?.type).toBe("run.started");
    expect(events.some((event) => event.type === "state.entered")).toBe(true);
    expect(events.some((event) => event.type === "action.started")).toBe(true);
    expect(events.some((event) => event.type === "action.succeeded")).toBe(true);
    expect(events.some((event) => event.type === "transition.resolved")).toBe(true);
    expect(events[events.length - 1]?.type).toBe("run.completed");
  });

  it("failed action writes action.failed and run.failed", async () => {
    const storage = new MemoryTraceStorage();
    const recorder = new TraceRecorder(storage);
    const spec: AgentSpec = {
      ...integrationSpec,
      states: {
        start: {
          actions: ["fail_action"],
          transitions: [{ to: "done" }]
        },
        done: { final: true }
      }
    };

    const result = await executeRun({
      spec,
      options: {
        traceRecorder: recorder,
        actionRegistry: {
          fail_action: async () => ({ ok: false, error: { code: "FAIL", message: "boom" } })
        }
      }
    });

    const types = (result.traceEvents ?? []).map((event) => event.type);
    expect(types).toContain("action.failed");
    expect(types).toContain("run.failed");
  });

  it("handoff state writes handoff.requested", async () => {
    const storage = new MemoryTraceStorage();
    const recorder = new TraceRecorder(storage);
    const spec: AgentSpec = {
      agent: "handoff-agent",
      initial_state: "handoff_state",
      states: {
        handoff_state: {
          handoff: true
        }
      }
    };

    const result = await executeRun({
      spec,
      options: {
        traceRecorder: recorder,
        actionRegistry: {}
      }
    });

    expect(result.status).toBe("handoff");
    expect((result.traceEvents ?? []).some((event) => event.type === "handoff.requested")).toBe(true);
  });

  it("replay returns events in correct order", async () => {
    const storage = new MemoryTraceStorage();
    await storage.append(sampleEvent({ id: "1", runId: "run-replay", ts: "2026-01-01T00:00:00.000Z" }));
    await storage.append(
      sampleEvent({ id: "2", runId: "run-replay", type: "run.completed", ts: "2026-01-01T00:00:01.000Z" })
    );

    const replayed = await replayRun(storage, "run-replay");
    const reader = new TraceReader(storage);
    const timeline = await reader.getRunTimeline("run-replay");

    expect(replayed.map((event) => event.id)).toEqual(["1", "2"]);
    expect(timeline.map((event) => event.id)).toEqual(["1", "2"]);
  });
});
