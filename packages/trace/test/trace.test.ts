import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AgentSpec, TraceEvent } from "@yutra/spec";
import { executeRun } from "../../runtime/src/execute-run";
import { InMemoryIdempotencyStore } from "../../runtime/src/idempotency";
import { resumeRun } from "../../runtime/src/resume-run";
import { InMemorySnapshotStore } from "../../runtime/src/snapshot-store";
import { buildAuditBundle, exportAuditBundle } from "../src/audit-bundle";
import { compareRuns } from "../src/compare";
import { buildContextDiffFramesFromEvents } from "../src/context-diff";
import { JsonlTraceStorage } from "../src/jsonl-storage";
import { MemoryTraceStorage } from "../src/memory-storage";
import { getReplayFrames, replayRun, replayRunSteps } from "../src/replay";
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

  it("replay frames are deterministic for a completed run", async () => {
    const storage = new MemoryTraceStorage();
    await storage.append(sampleEvent({ id: "2", runId: "run-deterministic", ts: "2026-01-01T00:00:01.000Z" }));
    await storage.append(sampleEvent({ id: "1", runId: "run-deterministic", ts: "2026-01-01T00:00:00.000Z" }));
    await storage.append(
      sampleEvent({
        id: "3",
        runId: "run-deterministic",
        ts: "2026-01-01T00:00:01.000Z",
        type: "run.completed"
      })
    );

    const framesA = await getReplayFrames(storage, "run-deterministic");
    const framesB = await getReplayFrames(storage, "run-deterministic");
    expect(framesA.map((frame) => frame.id)).toEqual(["1", "2", "3"]);
    expect(framesA.map((frame) => frame.id)).toEqual(framesB.map((frame) => frame.id));
  });

  it("replay frames work for a resumed run", async () => {
    const traceStorage = new MemoryTraceStorage();
    const snapshotStore = new InMemorySnapshotStore();
    const idempotencyStore = new InMemoryIdempotencyStore();
    const spec: AgentSpec = {
      agent: "resumed-agent",
      initial_state: "start",
      actions: [{ name: "do_once", side_effect: "external" }],
      states: {
        start: {
          actions: ["do_once"],
          transitions: [{ to: "done" }]
        },
        done: { final: true }
      }
    };

    const first = await executeRun({
      spec,
      options: {
        maxSteps: 1,
        traceStorage,
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          do_once: { idempotencyKey: "do_once_key", sideEffect: "external" }
        },
        actionRegistry: {
          do_once: async () => ({ ok: true, contextPatch: { done: true } })
        }
      }
    });

    const snapshot = snapshotStore.list(first.runId).find((item) => item.status === "running");
    expect(snapshot).toBeTruthy();

    const resumed = await resumeRun({
      spec,
      snapshot: snapshot!,
      options: {
        traceStorage,
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          do_once: { idempotencyKey: "do_once_key", sideEffect: "external" }
        },
        actionRegistry: {
          do_once: async () => ({ ok: true, contextPatch: { done: true } })
        }
      }
    });

    const frames = await getReplayFrames(traceStorage, resumed.runId);
    expect(frames.length).toBeGreaterThan(0);
    const runStarted = frames.find((frame) => frame.type === "run.started");
    expect((runStarted?.payload as Record<string, unknown>)?.isResumed).toBe(true);
  });

  it("context diff can reconstruct changed keys across action steps", async () => {
    const storage = new MemoryTraceStorage();
    const recorder = new TraceRecorder(storage);
    const spec: AgentSpec = {
      agent: "diff-agent",
      initial_state: "start",
      actions: [{ name: "set_a" }, { name: "set_b" }],
      states: {
        start: {
          actions: ["set_a", "set_b"],
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
          set_a: async () => ({ ok: true, contextPatch: { a: 1 } }),
          set_b: async () => ({ ok: true, contextPatch: { b: 2 } })
        }
      }
    });

    const diffs = buildContextDiffFramesFromEvents(result.traceEvents ?? []);
    expect(diffs.length).toBeGreaterThanOrEqual(2);
    expect(diffs.some((frame) => frame.change.addedKeys.includes("a"))).toBe(true);
    expect(diffs.some((frame) => frame.change.addedKeys.includes("b"))).toBe(true);
  });

  it("compareRuns reports stable summary differences", async () => {
    const storage = new MemoryTraceStorage();
    const completed = await executeRun({
      spec: integrationSpec,
      options: {
        traceStorage: storage,
        actionRegistry: {
          ok_action: async () => ({ ok: true, contextPatch: { ok: true } })
        }
      }
    });

    const handoffSpec: AgentSpec = {
      ...integrationSpec,
      states: {
        start: {
          actions: ["ok_action"],
          transitions: [{ to: "handoff" }]
        },
        handoff: {
          handoff: true
        },
        done: { final: true }
      }
    };
    const handoff = await executeRun({
      spec: handoffSpec,
      options: {
        traceStorage: storage,
        actionRegistry: {
          ok_action: async () => ({ ok: true, contextPatch: { ok: true } })
        }
      }
    });

    const compared = await compareRuns(storage, completed.runId, handoff.runId);
    expect(compared.differences.status).toBe(true);
    expect(compared.left.status).toBe("completed");
    expect(compared.right.status).toBe("handoff");
  });

  it("audit bundle includes required sections", async () => {
    const storage = new MemoryTraceStorage();
    const result = await executeRun({
      spec: integrationSpec,
      options: {
        traceStorage: storage,
        actionRegistry: {
          ok_action: async () => ({ ok: true, contextPatch: { ok: true } })
        }
      }
    });

    const bundle = await buildAuditBundle(storage, result.runId);
    expect(bundle.meta.runId).toBe(result.runId);
    expect(bundle.specSummary.agent).toBe("trace-integration-agent");
    expect(bundle.traceEvents.length).toBeGreaterThan(0);
    expect(bundle.replaySummary.frameCount).toBeGreaterThan(0);
    expect(bundle.contextDiffSummary).toBeTruthy();
    expect(bundle.approvalSummary).toBeTruthy();
    expect(bundle.humanReviewSummary).toBeTruthy();
  });

  it("audit bundle export writes valid JSON", async () => {
    const storage = new MemoryTraceStorage();
    const result = await executeRun({
      spec: integrationSpec,
      options: {
        traceStorage: storage,
        actionRegistry: {
          ok_action: async () => ({ ok: true, contextPatch: { ok: true } })
        }
      }
    });

    const dir = await mkdtemp(join(tmpdir(), "yutra-audit-bundle-"));
    const outPath = join(dir, `${result.runId}.json`);
    await exportAuditBundle(storage, result.runId, outPath);
    const stats = await stat(outPath);
    const content = await readFile(outPath, "utf8");
    await rm(dir, { recursive: true, force: true });

    expect(stats.size).toBeGreaterThan(0);
    const parsed = JSON.parse(content) as { meta: { runId: string } };
    expect(parsed.meta.runId).toBe(result.runId);
  });

  it("handoff run can be replayed and exported", async () => {
    const storage = new MemoryTraceStorage();
    const handoffSpec: AgentSpec = {
      agent: "handoff-audit-agent",
      initial_state: "handoff",
      states: {
        handoff: { handoff: true }
      }
    };

    const result = await executeRun({
      spec: handoffSpec,
      options: {
        traceStorage: storage,
        actionRegistry: {}
      }
    });

    const steps = await replayRunSteps(storage, result.runId);
    expect(steps.some((step) => step.type === "handoff.requested")).toBe(true);
    const bundle = await buildAuditBundle(storage, result.runId);
    expect(bundle.handoffOrErrorSummary.handoff).toBe(true);
  });

  it("resumed run audit bundle includes resumed metadata", async () => {
    const storage = new MemoryTraceStorage();
    const snapshotStore = new InMemorySnapshotStore();
    const idempotencyStore = new InMemoryIdempotencyStore();
    const spec: AgentSpec = {
      agent: "resume-bundle-agent",
      initial_state: "start",
      actions: [{ name: "do_once", side_effect: "external" }],
      states: {
        start: {
          actions: ["do_once"],
          transitions: [{ to: "done" }]
        },
        done: { final: true }
      }
    };

    const first = await executeRun({
      spec,
      options: {
        maxSteps: 1,
        traceStorage: storage,
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          do_once: { idempotencyKey: "resume_bundle_key", sideEffect: "external" }
        },
        actionRegistry: {
          do_once: async () => ({ ok: true, contextPatch: { done: true } })
        }
      }
    });

    const snapshot = snapshotStore.list(first.runId).find((item) => item.status === "running");
    const resumed = await resumeRun({
      spec,
      snapshot: snapshot!,
      options: {
        traceStorage: storage,
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          do_once: { idempotencyKey: "resume_bundle_key", sideEffect: "external" }
        },
        actionRegistry: {
          do_once: async () => ({ ok: true, contextPatch: { done: true } })
        }
      }
    });

    const bundle = await buildAuditBundle(storage, resumed.runId);
    expect(bundle.meta.isResumed).toBe(true);
    expect(bundle.meta.resumedFrom).toBeTruthy();
  });

  it("audit bundle includes policy/governance summary if available", async () => {
    const storage = new MemoryTraceStorage();
    const spec: AgentSpec = {
      agent: "governed-trace-agent",
      initial_state: "start",
      actions: [{ name: "danger", side_effect: "external" }],
      states: {
        start: {
          actions: ["danger"],
          transitions: [{ to: "done" }]
        },
        done: { final: true }
      }
    };

    const result = await executeRun({
      spec,
      options: {
        environment: "prod-like",
        policyPack: {
          name: "trace-policy",
          version: "0.1.0",
          actionRules: [{ action: "danger", allow: false, reasonCode: "blocked_in_prod", environments: ["prod-like"] }]
        },
        traceStorage: storage,
        actionRegistry: {
          danger: async () => ({ ok: true })
        }
      }
    });

    expect(result.status).toBe("failed");
    const bundle = await buildAuditBundle(storage, result.runId);
    expect(bundle.governanceSummary.environment).toBe("prod-like");
    expect(bundle.governanceSummary.policyPack?.name).toBe("trace-policy");
    expect(bundle.governanceSummary.policyErrorCodes).toContain("POLICY_ACTION_DENIED");
  });

  it("audit bundle includes approval and human review fields", async () => {
    const storage = new MemoryTraceStorage();
    const spec: AgentSpec = {
      agent: "approval-audit-agent",
      initial_state: "start",
      actions: [{ name: "request_approval" }],
      guards: [{ name: "approval_pending", expression: 'ctx.approval_status == "pending"' }],
      states: {
        start: {
          actions: ["request_approval"],
          transitions: [{ to: "pending_review", guard: "approval_pending" }]
        },
        pending_review: { handoff: true }
      }
    };

    const result = await executeRun({
      spec,
      options: {
        traceStorage: storage,
        actionRegistry: {
          request_approval: async () => ({
            ok: true,
            output: {
              approvalDecision: {
                status: "pending",
                decisionId: "DEC-1",
                approver: "reviewer-1",
                reason: "need manual review",
                decidedAt: "2026-01-01T00:00:00.000Z"
              }
            },
            contextPatch: {
              approval_status: "pending",
              human_review_request: {
                reviewId: "REV-1",
                reasonCode: "approval_pending",
                reason: "approval is pending",
                source: "tool",
                summary: "pending approval needs human review",
                requestedAt: "2026-01-01T00:00:00.000Z"
              }
            }
          })
        }
      }
    });

    expect(result.status).toBe("handoff");
    const bundle = await buildAuditBundle(storage, result.runId);
    expect(bundle.approvalSummary.decisionCount).toBeGreaterThan(0);
    expect(bundle.approvalSummary.statuses).toContain("pending");
    expect(bundle.approvalSummary.latestDecision?.decisionId).toBe("DEC-1");
    expect(bundle.humanReviewSummary.requestCount).toBeGreaterThan(0);
    expect(bundle.humanReviewSummary.sources).toContain("tool");
    expect(bundle.humanReviewSummary.latestRequest?.reviewId).toBe("REV-1");
  });
});
