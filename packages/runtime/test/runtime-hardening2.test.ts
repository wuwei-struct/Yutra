import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AgentSpec } from "@yutra/spec";
import { RUNTIME_ERROR_CODES } from "../src/error-codes";
import { executeRun } from "../src/execute-run";
import { InMemoryIdempotencyStore } from "../src/idempotency";
import { JsonFileSnapshotStore, InMemorySnapshotStore } from "../src/snapshot-store";
import { resumeRun } from "../src/resume-run";

const hardeningSpec: AgentSpec = {
  agent: "runtime-hardening2",
  initial_state: "start",
  actions: [{ name: "external_action", side_effect: "external" }],
  states: {
    start: {
      actions: ["external_action", "external_action"],
      transitions: [{ to: "done" }]
    },
    done: { final: true }
  }
};

describe("@yutra/runtime hardening 2", () => {
  it("successful external action stores idempotency result", async () => {
    const store = new InMemoryIdempotencyStore();
    await executeRun({
      spec: hardeningSpec,
      options: {
        idempotencyStore: store,
        actionPolicies: {
          external_action: {
            idempotencyKey: "external_once",
            sideEffect: "external"
          }
        },
        actionRegistry: {
          external_action: async () => ({
            ok: true,
            output: { called: true },
            contextPatch: { called: true }
          })
        }
      }
    });

    expect(store.has("external_once")).toBe(true);
  });

  it("repeated action with same idempotency key does not re-execute side effect", async () => {
    const store = new InMemoryIdempotencyStore();
    let calls = 0;
    const result = await executeRun({
      spec: hardeningSpec,
      options: {
        idempotencyStore: store,
        actionPolicies: {
          external_action: {
            idempotencyKey: "external_once",
            sideEffect: "external"
          }
        },
        actionRegistry: {
          external_action: async () => {
            calls += 1;
            return {
              ok: true,
              output: { calls },
              contextPatch: { calls }
            };
          }
        }
      }
    });

    expect(result.status).toBe("completed");
    expect(calls).toBe(1);
    const succeededEvents = (result.traceEvents ?? []).filter((event) => event.type === "action.succeeded");
    expect(succeededEvents.some((event) => (event.payload as Record<string, unknown>)?.idempotencyHit === true)).toBe(
      true
    );
  });

  it("snapshot can be saved after state/action boundary", async () => {
    const snapshotStore = new InMemorySnapshotStore();
    const result = await executeRun({
      spec: hardeningSpec,
      options: {
        snapshotStore,
        actionPolicies: {
          external_action: {
            idempotencyKey: "external_once",
            sideEffect: "external"
          }
        },
        actionRegistry: {
          external_action: async () => ({
            ok: true,
            output: { called: true },
            contextPatch: { called: true }
          })
        }
      }
    });

    const snapshots = snapshotStore.list(result.runId);
    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots.some((item) => item.status === "running")).toBe(true);
  });

  it("runtime can resume from snapshot and complete", async () => {
    const idempotencyStore = new InMemoryIdempotencyStore();
    const snapshotStore = new InMemorySnapshotStore();
    let calls = 0;

    const interrupted = await executeRun({
      spec: hardeningSpec,
      options: {
        maxSteps: 1,
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          external_action: {
            idempotencyKey: "external_once",
            sideEffect: "external"
          }
        },
        actionRegistry: {
          external_action: async () => {
            calls += 1;
            return {
              ok: true,
              output: { calls },
              contextPatch: { calls }
            };
          }
        }
      }
    });

    expect(interrupted.status).toBe("failed");
    const resumeSnapshot = snapshotStore
      .list(interrupted.runId)
      .find((snapshot) => snapshot.status === "running");
    expect(resumeSnapshot).toBeTruthy();

    const resumed = await resumeRun({
      spec: hardeningSpec,
      snapshot: resumeSnapshot!,
      options: {
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          external_action: {
            idempotencyKey: "external_once",
            sideEffect: "external"
          }
        },
        actionRegistry: {
          external_action: async () => {
            calls += 1;
            return {
              ok: true,
              output: { calls },
              contextPatch: { calls }
            };
          }
        }
      }
    });

    expect(resumed.status).toBe("completed");
    expect(calls).toBe(1);
  });

  it("resumed run does not duplicate completed idempotent action", async () => {
    const idempotencyStore = new InMemoryIdempotencyStore();
    const snapshotStore = new InMemorySnapshotStore();
    let calls = 0;

    const first = await executeRun({
      spec: hardeningSpec,
      options: {
        maxSteps: 1,
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          external_action: {
            idempotencyKey: "shared_key",
            sideEffect: "external"
          }
        },
        actionRegistry: {
          external_action: async () => {
            calls += 1;
            return { ok: true, output: { calls }, contextPatch: { calls } };
          }
        }
      }
    });
    const resumeSnapshot = snapshotStore.list(first.runId).find((snapshot) => snapshot.status === "running");
    expect(resumeSnapshot).toBeTruthy();

    await resumeRun({
      spec: hardeningSpec,
      snapshot: resumeSnapshot!,
      options: {
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          external_action: {
            idempotencyKey: "shared_key",
            sideEffect: "external"
          }
        },
        actionRegistry: {
          external_action: async () => {
            calls += 1;
            return { ok: true, output: { calls }, contextPatch: { calls } };
          }
        }
      }
    });

    expect(calls).toBe(1);
  });

  it("context merge conflict fails with structured error", async () => {
    const spec: AgentSpec = {
      agent: "merge-conflict-agent",
      initial_state: "start",
      actions: [
        { name: "set_object" },
        { name: "set_array" }
      ],
      states: {
        start: {
          actions: ["set_object", "set_array"],
          transitions: [{ to: "done" }]
        },
        done: { final: true }
      }
    };

    const result = await executeRun({
      spec,
      options: {
        actionRegistry: {
          set_object: async () => ({ ok: true, contextPatch: { profile: { id: 1 } } }),
          set_array: async () => ({ ok: true, contextPatch: { profile: [1, 2] } })
        }
      }
    });

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.CONTEXT_MERGE_CONFLICT);
    expect(result.error?.details?.field).toBe("profile");
  });

  it("invalid context patch fails with stable error code", async () => {
    const spec: AgentSpec = {
      agent: "invalid-patch-agent",
      initial_state: "start",
      actions: [{ name: "set_bad_patch" }],
      states: {
        start: {
          actions: ["set_bad_patch"],
          transitions: [{ to: "done" }]
        },
        done: { final: true }
      }
    };

    const result = await executeRun({
      spec,
      options: {
        actionRegistry: {
          set_bad_patch: async () => ({
            ok: true,
            contextPatch: { bad: undefined as unknown as string }
          })
        }
      }
    });

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.CONTEXT_PATCH_INVALID);
  });

  it("resumed run trace contains resumed metadata without new event types", async () => {
    const idempotencyStore = new InMemoryIdempotencyStore();
    const snapshotStore = new InMemorySnapshotStore();

    const first = await executeRun({
      spec: hardeningSpec,
      options: {
        maxSteps: 1,
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          external_action: {
            idempotencyKey: "trace_resume",
            sideEffect: "external"
          }
        },
        actionRegistry: {
          external_action: async () => ({ ok: true, contextPatch: { done: true } })
        }
      }
    });

    const resumeSnapshot = snapshotStore.list(first.runId).find((snapshot) => snapshot.status === "running");
    const resumed = await resumeRun({
      spec: hardeningSpec,
      snapshot: resumeSnapshot!,
      options: {
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          external_action: {
            idempotencyKey: "trace_resume",
            sideEffect: "external"
          }
        },
        actionRegistry: {
          external_action: async () => ({ ok: true, contextPatch: { done: true } })
        }
      }
    });

    const runStarted = (resumed.traceEvents ?? []).find((event) => event.type === "run.started");
    expect((runStarted?.payload as Record<string, unknown>)?.isResumed).toBe(true);
    expect((runStarted?.payload as Record<string, unknown>)?.resumedFrom).toBeTruthy();
    const uniqueTypes = new Set((resumed.traceEvents ?? []).map((event) => event.type));
    expect(uniqueTypes.has("run.started")).toBe(true);
    expect(uniqueTypes.has("handoff.requested")).toBe(false);
  });

  it("snapshot can persist and reload from file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-snapshot-store-"));
    const filePath = join(dir, "snapshots.json");
    const store = new JsonFileSnapshotStore(filePath);
    const result = await executeRun({
      spec: hardeningSpec,
      options: {
        snapshotStore: store,
        actionPolicies: {
          external_action: {
            idempotencyKey: "file_store_key",
            sideEffect: "external"
          }
        },
        actionRegistry: {
          external_action: async () => ({ ok: true, contextPatch: { ok: true } })
        }
      }
    });

    const raw = await readFile(filePath, "utf8");
    expect(raw.length).toBeGreaterThan(0);
    const latest = store.latestByRun(result.runId);
    expect(latest).toBeTruthy();
    expect(latest?.runId).toBe(result.runId);
    await rm(dir, { recursive: true, force: true });
  });
});
