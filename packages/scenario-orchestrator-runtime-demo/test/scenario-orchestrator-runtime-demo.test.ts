import {
  executeRun,
  RUNTIME_ERROR_CODES,
  type ActionRegistry,
  type RuntimeResult
} from "@yutra/runtime";
import {
  YUTRA_RUNTIME_ADAPTER_CONTRACT_V1,
  sha256BrowserSafe,
  validateRuntimeAdapterDescriptor
} from "@yutra/scenario-orchestrator-runtime-contract";
import { describe, expect, it } from "vitest";
import {
  DEMO_RUNTIME_ERROR_CODES,
  DemoRuntimeAdapterError,
  InMemorySlotArtifactStore,
  YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1,
  createInMemoryScenarioRuntimeAdapter,
  inspectSlotActionClosure
} from "../src/index";
import {
  EXPLICIT_DEMO_ACTION_REGISTRY,
  EXPLICIT_DEMO_SIDE_EFFECT_LEVELS,
  resolveExplicitDemoSideEffect
} from "./fixtures/explicit-demo-action-registry";
import {
  actionClosures,
  agentDslVersions,
  customerComplaintFixture,
  ecommerceRefundFixture,
  invocationRequest,
  registerCompiledSlots
} from "./fixtures/compiled-slot-fixtures";

function createAdapter(
  result = customerComplaintFixture(),
  overrides: Partial<Parameters<typeof createInMemoryScenarioRuntimeAdapter>[0]> = {}
) {
  let time = 100;
  return createInMemoryScenarioRuntimeAdapter({
    artifactStore: registerCompiledSlots(result),
    actionRegistry: EXPLICIT_DEMO_ACTION_REGISTRY,
    resolveSideEffectLevel: resolveExplicitDemoSideEffect,
    now: () => time++,
    ...overrides
  });
}

function expectCode(error: unknown, code: string): void {
  expect(error).toBeInstanceOf(DemoRuntimeAdapterError);
  expect((error as DemoRuntimeAdapterError).code).toBe(code);
}

function runtimeResult(
  status: RuntimeResult["status"],
  finalState = "done",
  error?: RuntimeResult["error"]
): RuntimeResult {
  return {
    runId: "fixture-runtime-run",
    agent: "fixture-agent",
    status,
    finalState,
    steps: 1,
    visitedStates: ["start", finalState],
    context: {},
    error,
    traceEvents: []
  };
}

describe("@yutra/scenario-orchestrator-runtime-demo descriptor", () => {
  it("validates the demo-only available Descriptor", () => {
    expect(
      validateRuntimeAdapterDescriptor(
        YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1
      ).ok
    ).toBe(true);
    expect(YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1.implementationStatus).toBe(
      "available"
    );
    expect(YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1.publicExposure.mode).toBe(
      "demo_only"
    );
  });

  it("declares every mandatory execution capability", () => {
    const capabilities =
      YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1.capabilities;
    for (const id of [
      "slot_execution",
      "agent_artifact_hash_verification",
      "action_closure_preflight",
      "idempotent_invocation",
      "timeout_enforcement",
      "trace_parent_binding",
      "audit_reference",
      "side_effect_reporting",
      "context_redaction"
    ] as const) {
      expect(capabilities[id], id).toBe(true);
    }
  });

  it("keeps cancellation and snapshot resume disabled", () => {
    expect(
      YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1.capabilities.cancellation
    ).toBe(false);
    expect(
      YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1.capabilities.snapshot_resume
    ).toBe(false);
  });

  it("does not modify the contract-only current Yutra Descriptor", () => {
    expect(YUTRA_RUNTIME_ADAPTER_CONTRACT_V1.implementationStatus).toBe(
      "contract_only"
    );
  });

  it("reports a complete customer complaint fixture as compatible", () => {
    const result = customerComplaintFixture();
    const adapter = createAdapter(result);
    const report = adapter.inspectCompatibility({
      orchestratorDocument: result.orchestratorDocument,
      adapterDescriptor: YUTRA_RUNTIME_ADAPTER_CONTRACT_V1,
      agentDslVersionsBySlot: agentDslVersions(result),
      actionClosureBySlot: actionClosures(result)
    });
    expect(report.compatible).toBe(true);
    expect(report.currentRuntimeSupported).toBe(true);
  });

  it("fails compatibility when a Slot Action Closure is incomplete", () => {
    const result = customerComplaintFixture();
    const closures = actionClosures(result);
    closures.policy_explanation = {
      ...closures.policy_explanation!,
      resolvableActionIds: [],
      unresolvedActionIds: ["retrieve_demo_knowledge"],
      complete: false
    };
    const report = createAdapter(result).inspectCompatibility({
      orchestratorDocument: result.orchestratorDocument,
      adapterDescriptor: YUTRA_RUNTIME_ADAPTER_CONTRACT_V1,
      agentDslVersionsBySlot: agentDslVersions(result),
      actionClosureBySlot: closures
    });
    expect(report.compatible).toBe(false);
    expect(report.blockers.some((item) => item.code === "action_closure_incomplete")).toBe(true);
  });
});

describe("InMemorySlotArtifactStore", () => {
  it("registers, reads, lists, and clears immutable records", () => {
    const result = customerComplaintFixture();
    const store = registerCompiledSlots(result);
    expect(store.list()).toHaveLength(3);
    const record = store.get("slots/complaint_resolution/agent.yutra.yaml");
    expect(record?.archetypeId).toBe("request-resolution");
    expect(Object.isFrozen(record)).toBe(true);
    store.clear();
    expect(store.list()).toHaveLength(0);
  });

  it("normalizes Windows separators into canonical Slot paths", () => {
    const result = customerComplaintFixture();
    const slot = result.compositionResult.slots[0]!;
    const store = new InMemorySlotArtifactStore();
    store.register({
      artifactPath: `slots\\${slot.slotId}\\agent.yutra.yaml`,
      artifactContent: slot.artifacts["agent.yutra.yaml"],
      artifactHash: slot.artifactHashes["agent.yutra.yaml"],
      configHash: slot.configHash,
      archetypeId: slot.archetypeId,
      agentDslVersion: "0.1.0"
    });
    expect(store.has(`slots/${slot.slotId}/agent.yutra.yaml`)).toBe(true);
  });

  it("rejects an artifact hash mismatch at registration", () => {
    const result = customerComplaintFixture();
    const slot = result.compositionResult.slots[0]!;
    const store = new InMemorySlotArtifactStore();
    expect(() =>
      store.register({
        artifactPath: `slots/${slot.slotId}/agent.yutra.yaml`,
        artifactContent: `${slot.artifacts["agent.yutra.yaml"]}\n`,
        artifactHash: slot.artifactHashes["agent.yutra.yaml"],
        configHash: slot.configHash,
        archetypeId: slot.archetypeId,
        agentDslVersion: "0.1.0"
      })
    ).toThrow(DEMO_RUNTIME_ERROR_CODES.ARTIFACT_HASH_MISMATCH);
  });

  it("rejects path traversal", () => {
    const store = new InMemorySlotArtifactStore();
    expect(() => store.has("../agent.yutra.yaml")).toThrow(
      DEMO_RUNTIME_ERROR_CODES.ARTIFACT_PATH_INVALID
    );
  });

  it("rejects duplicate paths with different content", () => {
    const result = customerComplaintFixture();
    const store = registerCompiledSlots(result);
    const slot = result.compositionResult.slots[0]!;
    expect(() =>
      store.register({
        artifactPath: `slots/${slot.slotId}/agent.yutra.yaml`,
        artifactContent: "different",
        artifactHash: `sha256:${"0".repeat(64)}`,
        configHash: slot.configHash,
        archetypeId: slot.archetypeId,
        agentDslVersion: "0.1.0"
      })
    ).toThrow(DEMO_RUNTIME_ERROR_CODES.ARTIFACT_HASH_MISMATCH);
  });
});

describe("Action Closure and side-effect preflight", () => {
  it("resolves every explicitly registered customer complaint Action", () => {
    const result = customerComplaintFixture();
    for (const closure of Object.values(actionClosures(result))) {
      expect(closure.complete, closure.slotId).toBe(true);
      expect(closure.unresolvedActionIds).toEqual([]);
    }
  });

  it("fails closed for an unknown Action without a fallback", () => {
    const result = customerComplaintFixture();
    const slot = result.compositionResult.slots[0]!;
    const closure = inspectSlotActionClosure({
      slotId: slot.slotId,
      agentDsl: slot.artifacts["agent.yutra.yaml"],
      artifactHash: slot.artifactHashes["agent.yutra.yaml"],
      actionRegistry: {}
    });
    expect(closure.complete).toBe(false);
    expect(closure.unresolvedActionIds.length).toBeGreaterThan(0);
  });

  it("fails invocation when an Action side effect is unclassified", async () => {
    const result = customerComplaintFixture();
    const adapter = createAdapter(result, {
      resolveSideEffectLevel: (id) =>
        id === "classify_request"
          ? undefined
          : EXPLICIT_DEMO_SIDE_EFFECT_LEVELS[id]
    });
    await adapter
      .invokeSlot(
        invocationRequest({ result, slotId: "complaint_resolution" })
      )
      .then(() => {
        throw new Error("expected rejection");
      })
      .catch((error) =>
        expectCode(
          error,
          DEMO_RUNTIME_ERROR_CODES.ACTION_SIDE_EFFECT_UNCLASSIFIED
        )
      );
  });

  it("rejects a side effect above the request and demo boundary", async () => {
    const result = customerComplaintFixture();
    const adapter = createAdapter(result, {
      resolveSideEffectLevel: (id) =>
        id === "execute_resolution"
          ? "write"
          : EXPLICIT_DEMO_SIDE_EFFECT_LEVELS[id]
    });
    await expect(
      adapter.invokeSlot(
        invocationRequest({ result, slotId: "complaint_resolution" })
      )
    ).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.SIDE_EFFECT_LEVEL_EXCEEDED
    });
  });
});

describe("single-Slot invocation", () => {
  for (const slotId of [
    "complaint_resolution",
    "policy_explanation",
    "compensation_decision"
  ]) {
    it(`executes customer complaint Slot ${slotId} independently`, async () => {
      const result = customerComplaintFixture();
      const adapter = createAdapter(result);
      const output = await adapter.invokeSlot(
        invocationRequest({ result, slotId })
      );
      expect(output.status).toBe("completed");
      expect(output.outcome).toBe("done");
      expect(output.output?.namespace).toBe(`slots.${slotId}.output`);
      expect(output.output?.value).toMatchObject({
        payload: {
          slotCompleted: true,
          scenarioCompleted: false
        }
      });
    });
  }

  for (const slotId of ["refund_resolution", "refund_authorization"]) {
    it(`executes ecommerce refund Slot ${slotId} independently`, async () => {
      const result = ecommerceRefundFixture();
      const output = await createAdapter(result).invokeSlot(
        invocationRequest({ result, slotId })
      );
      expect(output.status).toBe("completed");
      expect(output.output?.namespace).toBe(`slots.${slotId}.output`);
    });
  }

  it("never maps Slot completion to Scenario completion", async () => {
    const result = customerComplaintFixture();
    const output = await createAdapter(result).invokeSlot(
      invocationRequest({ result, slotId: "complaint_resolution" })
    );
    expect(output.outcome).not.toBe("$scenario_done");
    expect(output.outcome).not.toBe("scenario_completed");
  });

  it("records Trace parent correlation without Orchestrator events", async () => {
    const result = customerComplaintFixture();
    const adapter = createAdapter(result);
    const request = invocationRequest({
      result,
      slotId: "policy_explanation"
    });
    const output = await adapter.invokeSlot(request);
    expect(adapter.traceParentLedger.get(request.invocationId)).toMatchObject({
      runtimeRunId: output.runtimeRunId,
      orchestratorRunId: request.orchestratorRunId,
      slotId: request.slotId,
      parentSpanId: request.traceParent.parentSpanId
    });
    expect(JSON.stringify(output)).not.toContain("orchestrator.route.selected");
    expect(JSON.stringify(output)).not.toContain("orchestrator.binding.applied");
  });

  it("records only a redacted demo Audit summary", async () => {
    const result = customerComplaintFixture();
    const adapter = createAdapter(result);
    const request = invocationRequest({
      result,
      slotId: "compensation_decision"
    });
    const output = await adapter.invokeSlot(request);
    const audit = adapter.auditLedger.get(request.invocationId);
    expect(audit).toMatchObject({
      redacted: true,
      runtimeRunId: output.runtimeRunId,
      slotId: request.slotId
    });
    expect(audit).not.toHaveProperty("input");
    expect(audit).not.toHaveProperty("output");
  });

  it("rejects cross-Slot input namespaces", async () => {
    const result = customerComplaintFixture();
    const request = invocationRequest({
      result,
      slotId: "complaint_resolution"
    });
    request.input.namespace = "slots.policy_explanation.input";
    await expect(createAdapter(result).invokeSlot(request)).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.INPUT_NAMESPACE_INVALID
    });
  });

  it("recomputes input byte length instead of trusting the caller", async () => {
    const result = customerComplaintFixture();
    const request = invocationRequest({
      result,
      slotId: "complaint_resolution"
    });
    request.input.byteLength = Number.MAX_SAFE_INTEGER;
    const output = await createAdapter(result).invokeSlot(request);
    expect(output.status).toBe("completed");
  });

  it("rejects an artifact hash mismatch before Runtime", async () => {
    const result = customerComplaintFixture();
    const request = invocationRequest({
      result,
      slotId: "complaint_resolution"
    });
    request.artifactRef.agentArtifactHash = `sha256:${"1".repeat(64)}`;
    await expect(createAdapter(result).invokeSlot(request)).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.IDEMPOTENCY_CONFLICT
    });
  });

  it("rejects an unregistered Slot artifact before Runtime", async () => {
    const result = customerComplaintFixture();
    const adapter = createAdapter(result, {
      artifactStore: new InMemorySlotArtifactStore()
    });
    await expect(
      adapter.invokeSlot(
        invocationRequest({ result, slotId: "complaint_resolution" })
      )
    ).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.ARTIFACT_NOT_FOUND
    });
  });

  it("rejects invalid Agent DSL before Runtime", async () => {
    const result = customerComplaintFixture();
    const slot = result.compositionResult.slots[0]!;
    const content = "not: valid-agent-dsl";
    const store = new InMemorySlotArtifactStore();
    store.register({
      artifactPath: `slots/${slot.slotId}/agent.yutra.yaml`,
      artifactContent: content,
      artifactHash: sha256BrowserSafe(content),
      configHash: slot.configHash,
      archetypeId: slot.archetypeId,
      agentDslVersion: "0.1.0"
    });
    const request = invocationRequest({
      result,
      slotId: "complaint_resolution"
    });
    request.artifactRef.agentArtifactHash = sha256BrowserSafe(content);
    request.idempotencyKey =
      invocationRequest({
        result: {
          ...result,
          compositionResult: {
            ...result.compositionResult,
            slots: result.compositionResult.slots.map((candidate) =>
              candidate.slotId === slot.slotId
                ? {
                    ...candidate,
                    artifactHashes: {
                      ...candidate.artifactHashes,
                      "agent.yutra.yaml": sha256BrowserSafe(content)
                    }
                  }
                : candidate
            )
          }
        },
        slotId: "complaint_resolution"
      }).idempotencyKey;
    await expect(
      createAdapter(result, { artifactStore: store }).invokeSlot(request)
    ).rejects.toMatchObject({ code: DEMO_RUNTIME_ERROR_CODES.DSL_INVALID });
  });

  it("rejects incomplete Action Closure before Runtime", async () => {
    const result = customerComplaintFixture();
    const incompleteRegistry = { ...EXPLICIT_DEMO_ACTION_REGISTRY };
    delete incompleteRegistry.notify_result;
    await expect(
      createAdapter(result, {
        actionRegistry: incompleteRegistry
      }).invokeSlot(
        invocationRequest({ result, slotId: "complaint_resolution" })
      )
    ).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.ACTION_CLOSURE_INCOMPLETE
    });
  });

  it("allows an explicit control-only classification without changing the compiler declaration", async () => {
    const result = customerComplaintFixture();
    const output = await createAdapter(result, {
      resolveSideEffectLevel: (id) =>
        id === "escalate_human"
          ? "none"
          : EXPLICIT_DEMO_SIDE_EFFECT_LEVELS[id]
    }).invokeSlot(
      invocationRequest({ result, slotId: "complaint_resolution" })
    );
    expect(output.status).toBe("completed");
    expect(output.sideEffectSummary.externalEffectsOccurred).toBe(false);
  });

  it("rejects a config hash mismatch before Runtime", async () => {
    const result = customerComplaintFixture();
    const request = invocationRequest({
      result,
      slotId: "complaint_resolution"
    });
    request.artifactRef.configHash = `sha256:${"1".repeat(64)}`;
    await expect(createAdapter(result).invokeSlot(request)).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.CONFIG_HASH_MISMATCH
    });
  });
});

describe("idempotency, timeout, failure, and concurrency", () => {
  it("rejects a non-canonical idempotency key", async () => {
    const result = customerComplaintFixture();
    const request = invocationRequest({
      result,
      slotId: "complaint_resolution"
    });
    request.idempotencyKey = "not-canonical";
    await expect(createAdapter(result).invokeSlot(request)).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.IDEMPOTENCY_CONFLICT
    });
  });

  it("recalculates and rejects oversized input", async () => {
    const result = customerComplaintFixture();
    await expect(
      createAdapter(result).invokeSlot(
        invocationRequest({
          result,
          slotId: "complaint_resolution",
          value: { payload: "x".repeat(70 * 1024) }
        })
      )
    ).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.INPUT_TOO_LARGE
    });
  });

  it("replays the same logical result without a second Runtime invocation", async () => {
    const result = customerComplaintFixture();
    let calls = 0;
    const adapter = createAdapter(result, {
      runtimeFactory: async (args) => {
        calls += 1;
        return executeRun(args);
      }
    });
    const request = invocationRequest({
      result,
      slotId: "complaint_resolution"
    });
    const first = await adapter.invokeSlot(request);
    const second = await adapter.invokeSlot(structuredClone(request));
    expect(second).toEqual(first);
    expect(calls).toBe(1);
    expect(adapter.invocationLedger.get(request.idempotencyKey)?.runtimeInvocationCount).toBe(1);
  });

  it("rejects the same idempotency key with a different request", async () => {
    const result = customerComplaintFixture();
    const adapter = createAdapter(result);
    const request = invocationRequest({
      result,
      slotId: "complaint_resolution"
    });
    await adapter.invokeSlot(request);
    const conflict = structuredClone(request);
    conflict.traceParent.parentSpanId = "different-parent";
    await expect(adapter.invokeSlot(conflict)).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.IDEMPOTENCY_CONFLICT
    });
  });

  it("shares one Promise for concurrent identical requests", async () => {
    const result = customerComplaintFixture();
    let calls = 0;
    const adapter = createAdapter(result, {
      runtimeFactory: async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return runtimeResult("completed");
      }
    });
    const request = invocationRequest({
      result,
      slotId: "complaint_resolution"
    });
    const [first, second] = await Promise.all([
      adapter.invokeSlot(request),
      adapter.invokeSlot(structuredClone(request))
    ]);
    expect(first).toEqual(second);
    expect(calls).toBe(1);
  });

  it("rejects a different concurrent invocation at max concurrency one", async () => {
    const result = customerComplaintFixture();
    let release!: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const adapter = createAdapter(result, {
      runtimeFactory: async () => {
        await wait;
        return runtimeResult("completed");
      }
    });
    const firstRequest = invocationRequest({
      result,
      slotId: "complaint_resolution",
      invocationIndex: 1
    });
    const secondRequest = invocationRequest({
      result,
      slotId: "policy_explanation",
      invocationIndex: 2
    });
    const first = adapter.invokeSlot(firstRequest);
    await expect(adapter.invokeSlot(secondRequest)).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.BUSY
    });
    release();
    await first;
  });

  it("maps an existing Runtime action timeout to timed_out", async () => {
    const result = customerComplaintFixture();
    const delayedRegistry: ActionRegistry = {
      ...EXPLICIT_DEMO_ACTION_REGISTRY,
      classify_request: async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return { ok: true };
      }
    };
    const adapter = createAdapter(result, {
      actionRegistry: delayedRegistry
    });
    const output = await adapter.invokeSlot(
      invocationRequest({
        result,
        slotId: "complaint_resolution",
        timeoutMs: 5
      })
    );
    expect(output.status).toBe("timed_out");
    expect(output.error).toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.TIMEOUT,
      retryable: false
    });
  });

  it("never maps timeout to completed", async () => {
    const result = customerComplaintFixture();
    const adapter = createAdapter(result, {
      runtimeFactory: async () =>
        runtimeResult("failed", "classify_request", {
          code: RUNTIME_ERROR_CODES.MAX_DURATION_EXCEEDED,
          message: "internal timeout detail"
        })
    });
    const output = await adapter.invokeSlot(
      invocationRequest({ result, slotId: "complaint_resolution" })
    );
    expect(output.status).toBe("timed_out");
    expect(output.output).toBeUndefined();
  });

  it("maps Runtime failure to a safe failed result without stack text", async () => {
    const result = customerComplaintFixture();
    const adapter = createAdapter(result, {
      runtimeFactory: async () =>
        runtimeResult("failed", "classify_request", {
          code: "FIXTURE_FAILURE",
          message: "private stack at local path"
        })
    });
    const output = await adapter.invokeSlot(
      invocationRequest({ result, slotId: "complaint_resolution" })
    );
    expect(output.status).toBe("failed");
    expect(output.error?.code).toBe("FIXTURE_FAILURE");
    expect(output.error?.safeMessage).not.toContain("stack");
    expect(output.error?.retryable).toBe(false);
  });

  it("maps Runtime handoff without declaring Scenario completion", async () => {
    const result = customerComplaintFixture();
    const output = await createAdapter(result, {
      runtimeFactory: async () => runtimeResult("handoff", "handoff")
    }).invokeSlot(
      invocationRequest({ result, slotId: "complaint_resolution" })
    );
    expect(output.status).toBe("handoff_required");
    expect(output.outcome).toBe("handoff");
    expect(output.output).toBeUndefined();
  });

  it("fails closed when normalized output exceeds the Adapter limit", async () => {
    const result = customerComplaintFixture();
    const adapter = createAdapter(result, {
      runtimeFactory: async () =>
        runtimeResult("completed", "x".repeat(70 * 1024))
    });
    await expect(
      adapter.invokeSlot(
        invocationRequest({ result, slotId: "complaint_resolution" })
      )
    ).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.OUTPUT_TOO_LARGE
    });
  });
});
