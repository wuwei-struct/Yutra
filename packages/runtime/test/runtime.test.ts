import { describe, expect, it } from "vitest";
import type { AgentSpec } from "@yutra/spec";
import { RUNTIME_ERROR_CODES } from "../src/error-codes";
import { executeRun } from "../src/execute-run";

const baseSpec: AgentSpec = {
  agent: "runtime-test-agent",
  version: "0.1.0",
  initial_state: "start",
  actions: [{ name: "set_ready", side_effect: "write" }],
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

describe("@yutra/runtime executeRun hardening", () => {
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
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.GUARD_EVALUATION_FAILED);
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
      },
      actions: [{ name: "fail_action", side_effect: "write" }]
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
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.MAX_STEPS_EXCEEDED);
  });

  it("action timeout produces structured timeout error", async () => {
    const result = await executeRun({
      spec: baseSpec,
      options: {
        actionTimeoutMs: 10,
        actionRegistry: {
          set_ready: async () => {
            await new Promise((resolve) => setTimeout(resolve, 40));
            return { ok: true };
          }
        }
      }
    });

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.ACTION_TIMEOUT);
  });

  it("retryable action retries until success", async () => {
    let attempts = 0;
    const result = await executeRun({
      spec: baseSpec,
      options: {
        retryPolicy: { maxAttempts: 3, backoffMs: 0 },
        actionRegistry: {
          set_ready: async () => {
            attempts += 1;
            if (attempts < 3) {
              return {
                ok: false,
                error: {
                  code: "TEMP_UNAVAILABLE",
                  message: "retry me",
                  retryable: true
                }
              };
            }
            return { ok: true, contextPatch: { ready: true } };
          }
        }
      }
    });

    expect(attempts).toBe(3);
    expect(result.status).toBe("completed");
  });

  it("non-retryable action fails immediately", async () => {
    let attempts = 0;
    const result = await executeRun({
      spec: baseSpec,
      options: {
        retryPolicy: { maxAttempts: 3, backoffMs: 0 },
        actionRegistry: {
          set_ready: async () => {
            attempts += 1;
            return {
              ok: false,
              error: {
                code: "BAD_REQUEST",
                message: "non-retryable",
                retryable: false
              }
            };
          }
        }
      }
    });

    expect(attempts).toBe(1);
    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe("BAD_REQUEST");
  });

  it("retry stops at maxAttempts", async () => {
    let attempts = 0;
    const result = await executeRun({
      spec: baseSpec,
      options: {
        retryPolicy: { maxAttempts: 2, backoffMs: 0 },
        actionRegistry: {
          set_ready: async () => {
            attempts += 1;
            return {
              ok: false,
              error: {
                code: "TEMP_UNAVAILABLE",
                message: "still failing",
                retryable: true
              }
            };
          }
        }
      }
    });

    expect(attempts).toBe(2);
    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe("TEMP_UNAVAILABLE");
  });

  it("maxDurationMs stops long-running run", async () => {
    const loopSpec: AgentSpec = {
      ...baseSpec,
      actions: [{ name: "tick", side_effect: "none" }],
      states: {
        start: {
          actions: ["tick"],
          transitions: [{ to: "start" }]
        },
        done: { final: true }
      }
    };
    const result = await executeRun({
      spec: loopSpec,
      options: {
        maxSteps: 100,
        maxDurationMs: 20,
        actionRegistry: {
          tick: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return { ok: true };
          }
        }
      }
    });

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.MAX_DURATION_EXCEEDED);
  });

  it("maxExternalCalls stops run when budget exceeded", async () => {
    const spec: AgentSpec = {
      ...baseSpec,
      actions: [{ name: "set_ready", side_effect: "external" }]
    };
    const result = await executeRun({
      spec,
      options: {
        maxExternalCalls: 0,
        actionRegistry: {
          set_ready: async () => ({ ok: true, contextPatch: { ready: true } })
        }
      }
    });

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.MAX_EXTERNAL_CALLS_EXCEEDED);
  });

  it("runtime error codes are stable and asserted", async () => {
    const spec: AgentSpec = {
      ...baseSpec,
      states: {
        start: {
          actions: ["missing_action"],
          transitions: [{ to: "done" }]
        },
        done: { final: true }
      },
      actions: [{ name: "missing_action", side_effect: "write" }]
    };
    const result = await executeRun({
      spec,
      options: {
        actionRegistry: {}
      }
    });

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.ACTION_NOT_FOUND);
  });

  it("action.failed trace payload contains attempt/retryable/finalAttempt", async () => {
    const result = await executeRun({
      spec: baseSpec,
      options: {
        retryPolicy: { maxAttempts: 2, backoffMs: 0 },
        actionRegistry: {
          set_ready: async () => ({
            ok: false,
            error: {
              code: "TEMP_FAIL",
              message: "retry",
              retryable: true
            }
          })
        }
      }
    });

    const failedEvents = (result.traceEvents ?? []).filter((event) => event.type === "action.failed");
    expect(failedEvents.length).toBe(2);
    const firstPayload = failedEvents[0].payload as Record<string, unknown>;
    const secondPayload = failedEvents[1].payload as Record<string, unknown>;

    expect(firstPayload.attempt).toBe(1);
    expect(firstPayload.retryable).toBe(true);
    expect(firstPayload.finalAttempt).toBe(false);
    expect(secondPayload.attempt).toBe(2);
    expect(secondPayload.finalAttempt).toBe(true);
  });
});
