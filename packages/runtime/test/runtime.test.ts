import { describe, expect, it } from "vitest";
import type { AgentSpec } from "@yutra/spec";
import { executeRun } from "../src/execute-run";

const baseSpec: AgentSpec = {
  agent: "runtime-test-agent",
  version: "0.1.0",
  initial_state: "start",
  actions: [
    { name: "set_ready", side_effect: "write" },
    { name: "fail_action", side_effect: "write" }
  ],
  guards: [{ name: "is_ready", expression: "ctx.ready == true" }],
  states: {
    start: {
      actions: ["set_ready"],
      transitions: [{ to: "done" }]
    },
    done: {
      final: true
    }
  }
};

describe("@yutra/runtime executeRun", () => {
  it("runtime can execute minimal agent to completion", async () => {
    const result = await executeRun({
      spec: baseSpec,
      options: {
        actionRegistry: {
          set_ready: async () => ({ ok: true, contextPatch: { ready: true } })
        }
      }
    });

    expect(result.status).toBe("completed");
    expect(result.finalState).toBe("done");
  });

  it("runtime can resolve initial state from entry_state or initial_state", async () => {
    const specWithIntent: AgentSpec = {
      ...baseSpec,
      intents: [{ name: "go", entry_state: "done" }]
    };

    const result = await executeRun({
      spec: specWithIntent,
      input: { intent: "go" },
      options: {
        actionRegistry: {}
      }
    });

    expect(result.finalState).toBe("done");
    expect(result.status).toBe("completed");
  });

  it("runtime action success updates context", async () => {
    const result = await executeRun({
      spec: baseSpec,
      options: {
        actionRegistry: {
          set_ready: async () => ({ ok: true, contextPatch: { ready: true, score: 1 } })
        }
      }
    });

    expect(result.context.ready).toBe(true);
    expect(result.context.score).toBe(1);
  });

  it("runtime invalid guard or unmet guard behaves as expected", async () => {
    const specWithStateGuard: AgentSpec = {
      ...baseSpec,
      guards: [{ name: "must_have_flag", expression: "ctx.flag" }],
      states: {
        ...baseSpec.states,
        start: {
          guards: ["must_have_flag"],
          actions: ["set_ready"],
          transitions: [{ to: "done" }]
        }
      }
    };

    const result = await executeRun({
      spec: specWithStateGuard,
      options: {
        actionRegistry: {
          set_ready: async () => ({ ok: true })
        }
      }
    });

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe("RUNTIME_GUARD_NOT_PASSED");
  });

  it("runtime can resolve transition to next state", async () => {
    const spec: AgentSpec = {
      ...baseSpec,
      states: {
        start: {
          actions: ["set_ready"],
          transitions: [
            { to: "done", when: "ctx.ready == true" },
            { to: "start", when: "false" }
          ]
        },
        done: { final: true }
      }
    };

    const result = await executeRun({
      spec,
      options: {
        actionRegistry: {
          set_ready: async () => ({ ok: true, contextPatch: { ready: true } })
        }
      }
    });

    expect(result.status).toBe("completed");
    expect(result.finalState).toBe("done");
  });

  it("runtime stops on final state", async () => {
    const spec: AgentSpec = {
      ...baseSpec,
      initial_state: "done"
    };

    const result = await executeRun({
      spec,
      options: {
        actionRegistry: {}
      }
    });

    expect(result.status).toBe("completed");
    expect(result.steps).toBe(1);
  });

  it("runtime emits structured failure on action error", async () => {
    const spec: AgentSpec = {
      ...baseSpec,
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
        actionRegistry: {
          fail_action: async () => ({
            ok: false,
            error: { code: "ACTION_FAIL", message: "fail for test" }
          })
        }
      }
    });

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe("ACTION_FAIL");
    expect(result.traceEvents?.some((event) => event.type === "action.failed")).toBe(true);
  });

  it("runtime maxSteps prevents infinite loop", async () => {
    const spec: AgentSpec = {
      ...baseSpec,
      states: {
        start: {
          transitions: [{ to: "start" }]
        },
        done: { final: true }
      }
    };

    const result = await executeRun({
      spec,
      options: {
        maxSteps: 3,
        actionRegistry: {}
      }
    });

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe("RUNTIME_MAX_STEPS_EXCEEDED");
  });
});
