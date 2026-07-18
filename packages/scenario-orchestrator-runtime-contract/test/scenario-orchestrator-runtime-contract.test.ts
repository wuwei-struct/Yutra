import type {
  ScenarioOrchestratorDocument
} from "@yutra/scenario-orchestrator-core";
import {
  CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT
} from "@yutra/scenario-orchestrator-core";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  MANDATORY_RUNTIME_ADAPTER_CAPABILITIES,
  ORCHESTRATOR_SLOT_INVOCATION_EVENT_TYPES,
  RUNTIME_ADAPTER_FORBIDDEN_ORCHESTRATOR_EVENTS,
  SLOT_TRACE_CORRELATION_FIELDS,
  YUTRA_RUNTIME_ADAPTER_CONTRACT_V1,
  createCanonicalInputHash,
  createSlotActionClosureReport,
  createSlotAuditBridge,
  createSlotInvocationIdempotencyKey,
  createSlotTraceCorrelation,
  explainRuntimeAdapterContract,
  isSlotActionClosureComplete,
  mapSlotInvocationResultToSignal,
  normalizeRuntimeAdapterCapabilities,
  resolveOrchestratorRuntimeCompatibility,
  sha256BrowserSafe,
  validateRuntimeAdapterDescriptor,
  validateSlotInvocationRequest,
  validateSlotInvocationResult,
  type RuntimeAdapterCapabilityId,
  type RuntimeCompatibilityInput,
  type ScenarioRuntimeAdapterDescriptor,
  type ScenarioSlotInvocationRequest,
  type ScenarioSlotInvocationResult
} from "../src";

function compileCustomer() {
  return {
    orchestratorDocument: structuredClone(
      CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT
    )
  };
}

function availableDescriptor(): ScenarioRuntimeAdapterDescriptor {
  return {
    ...structuredClone(YUTRA_RUNTIME_ADAPTER_CONTRACT_V1),
    adapterId: "test-runtime-adapter",
    implementationStatus: "available",
    capabilities: normalizeRuntimeAdapterCapabilities(
      Object.fromEntries(
        MANDATORY_RUNTIME_ADAPTER_CAPABILITIES.map((capabilityId) => [
          capabilityId,
          true
        ])
      ) as Partial<Record<RuntimeAdapterCapabilityId, boolean>>
    )
  };
}

function compatibilityInput(
  descriptor: ScenarioRuntimeAdapterDescriptor = availableDescriptor()
): RuntimeCompatibilityInput {
  const document = compileCustomer().orchestratorDocument;
  return {
    orchestratorDocument: structuredClone(document),
    adapterDescriptor: descriptor,
    agentDslVersionsBySlot: Object.fromEntries(
      document.slots.map((slot) => [slot.slotId, "1.0.0"])
    ),
    actionClosureBySlot: Object.fromEntries(
      document.slots.map((slot) => [
        slot.slotId,
        createSlotActionClosureReport({
          slotId: slot.slotId,
          artifactHash: slot.artifactRef.agentArtifactHash,
          referencedActionIds: ["demo_action"],
          resolvableActionIds: ["demo_action"]
        })
      ])
    )
  };
}

function invocationRequest(): ScenarioSlotInvocationRequest {
  const slot = compileCustomer().orchestratorDocument.slots[0]!;
  const canonicalInputHash = createCanonicalInputHash({ question: "demo" });
  return {
    schemaVersion: "1.0.0-preview",
    orchestratorRunId: "orchestrator-run-demo",
    invocationId: "invocation-demo-1",
    invocationIndex: 1,
    idempotencyKey: createSlotInvocationIdempotencyKey({
      orchestratorRunId: "orchestrator-run-demo",
      invocationIndex: 1,
      slotId: slot.slotId,
      agentArtifactHash: slot.artifactRef.agentArtifactHash,
      canonicalInputHash
    }),
    orchestratorId: "customer-complaint-orchestrator",
    compositionId: "customer-complaint-composition-demo",
    slotId: slot.slotId,
    archetypeId: slot.archetypeId,
    artifactRef: {
      agentArtifactPath: slot.artifactRef.agentArtifactPath,
      agentArtifactHash: slot.artifactRef.agentArtifactHash,
      configHash: slot.artifactRef.configHash
    },
    traceParent: {
      orchestratorRunId: "orchestrator-run-demo",
      parentSequence: 3,
      parentSpanId: "span-demo"
    },
    input: {
      namespace: `slots.${slot.slotId}.input`,
      value: { question: "demo" },
      byteLength: 19,
      redactionApplied: true
    },
    budget: {
      timeoutMs: 1000,
      maxRuntimeSteps: 32
    },
    sideEffectPolicy: {
      maximumAllowedLevel: "read",
      requireExplicitDeclaration: true
    },
    retryPolicy: {
      orchestratorRetryAllowed: false,
      invocationAttempt: 1
    }
  };
}

function invocationResult(
  request: ScenarioSlotInvocationRequest = invocationRequest()
): ScenarioSlotInvocationResult {
  return {
    schemaVersion: "1.0.0-preview",
    invocationId: request.invocationId,
    idempotencyKey: request.idempotencyKey,
    runtimeRunId: "runtime-run-demo",
    status: "completed",
    projectionEvidence: {
      runtimeStatus: "completed",
      runtimeFinalState: "done",
      outputMarkers: {
        "slotResult.semanticMarker": "slot_result_available"
      }
    },
    outcome: "slot_result_available",
    output: {
      namespace: `slots.${request.slotId}.output`,
      value: { result: "demo" },
      byteLength: 17,
      redactionApplied: true
    },
    traceReference: {
      runtimeRunId: "runtime-run-demo",
      parentOrchestratorRunId: request.orchestratorRunId,
      firstSequence: 1,
      lastSequence: 3,
      eventCount: 3
    },
    auditReference: {
      runtimeRunId: "runtime-run-demo",
      status: "available",
      redacted: true
    },
    sideEffectSummary: {
      declaredLevel: "read",
      externalEffectsOccurred: false,
      effectCount: 0
    },
    resourceUsage: {
      runtimeSteps: 3,
      elapsedMs: 15
    }
  };
}

describe("@yutra/scenario-orchestrator-runtime-contract", () => {
  it("validates the current contract-only descriptor", () => {
    expect(validateRuntimeAdapterDescriptor(
      YUTRA_RUNTIME_ADAPTER_CONTRACT_V1
    )).toMatchObject({ ok: true });
  });

  it("keeps the current contract-only descriptor incompatible", () => {
    const report = resolveOrchestratorRuntimeCompatibility(
      compatibilityInput(YUTRA_RUNTIME_ADAPTER_CONTRACT_V1)
    );
    expect(report.compatible).toBe(false);
    expect(report.currentRuntimeSupported).toBe(false);
    expect(report.blockers[0]?.code).toBe("implementation_unavailable");
  });

  it("accepts an available descriptor with the complete mandatory contract", () => {
    const report = resolveOrchestratorRuntimeCompatibility(
      compatibilityInput()
    );
    expect(report).toMatchObject({
      compatible: true,
      status: "compatible",
      schemaVersionSupported: true,
      executionModelSupported: true,
      allAgentDslVersionsSupported: true,
      allMandatoryCapabilitiesSupported: true,
      allActionClosuresComplete: true,
      currentRuntimeSupported: true
    });
  });

  it.each([
    "slot_execution",
    "agent_artifact_hash_verification",
    "action_closure_preflight",
    "idempotent_invocation",
    "trace_parent_binding"
  ] as const)("fails closed when %s is missing", (capabilityId) => {
    const descriptor = availableDescriptor();
    descriptor.capabilities[capabilityId] = false;
    const report = resolveOrchestratorRuntimeCompatibility(
      compatibilityInput(descriptor)
    );
    expect(report.compatible).toBe(false);
    expect(report.blockers).toContainEqual(
      expect.objectContaining({
        code: "mandatory_capability_missing",
        capabilityId
      })
    );
  });

  it("rejects an unsupported Orchestrator schema", () => {
    const descriptor = availableDescriptor();
    descriptor.supportedOrchestratorSchemaVersions = ["2.0.0-preview"];
    const report = resolveOrchestratorRuntimeCompatibility(
      compatibilityInput(descriptor)
    );
    expect(report.schemaVersionSupported).toBe(false);
    expect(report.compatible).toBe(false);
  });

  it("rejects an unsupported execution model", () => {
    const input = compatibilityInput();
    (input.orchestratorDocument as unknown as {
      executionModel: string;
    }).executionModel = "parallel_slots";
    const report = resolveOrchestratorRuntimeCompatibility(input);
    expect(report.executionModelSupported).toBe(false);
    expect(report.compatible).toBe(false);
  });

  it("rejects an unsupported Slot Agent DSL version", () => {
    const input = compatibilityInput();
    input.agentDslVersionsBySlot.complaint_resolution = "9.0.0";
    const report = resolveOrchestratorRuntimeCompatibility(input);
    expect(report.allAgentDslVersionsSupported).toBe(false);
  });

  it("rejects unresolved Actions before invocation", () => {
    const input = compatibilityInput();
    const slot = input.orchestratorDocument.slots[0]!;
    input.actionClosureBySlot[slot.slotId] =
      createSlotActionClosureReport({
        slotId: slot.slotId,
        artifactHash: slot.artifactRef.agentArtifactHash,
        referencedActionIds: ["missing_action"],
        resolvableActionIds: []
      });
    const report = resolveOrchestratorRuntimeCompatibility(input);
    expect(report.allActionClosuresComplete).toBe(false);
    expect(report.blockers).toContainEqual(
      expect.objectContaining({ code: "action_closure_incomplete" })
    );
  });

  it("rejects Action Closure bound to another artifact hash", () => {
    const input = compatibilityInput();
    input.actionClosureBySlot.complaint_resolution!.artifactHash =
      `sha256:${"0".repeat(64)}`;
    expect(
      resolveOrchestratorRuntimeCompatibility(input).blockers
    ).toContainEqual(expect.objectContaining({ code: "artifact_hash_mismatch" }));
  });

  it("keeps compatibility blocker ordering deterministic", () => {
    const input = compatibilityInput(YUTRA_RUNTIME_ADAPTER_CONTRACT_V1);
    const first = resolveOrchestratorRuntimeCompatibility(input);
    const second = resolveOrchestratorRuntimeCompatibility(
      structuredClone(input)
    );
    expect(second.blockers).toEqual(first.blockers);
  });

  it("normalizes Action Closure deterministically", () => {
    const report = createSlotActionClosureReport({
      slotId: "slot",
      artifactHash: `sha256:${"a".repeat(64)}`,
      referencedActionIds: ["b", "a", "a"],
      resolvableActionIds: ["a", "b"]
    });
    expect(report.referencedActionIds).toEqual(["a", "b"]);
    expect(report.unresolvedActionIds).toEqual([]);
    expect(isSlotActionClosureComplete(report)).toBe(true);
  });

  it("validates a complete Slot invocation request", () => {
    expect(
      validateSlotInvocationRequest(
        invocationRequest(),
        availableDescriptor()
      )
    ).toMatchObject({ ok: true });
  });

  it("rejects a missing idempotency key", () => {
    const request = invocationRequest();
    request.idempotencyKey = "";
    expect(
      validateSlotInvocationRequest(request, availableDescriptor()).issues
        .map((issue) => issue.code)
    ).toContain("RUNTIME_ADAPTER_IDEMPOTENCY_REQUIRED");
  });

  it("rejects a malformed artifact hash", () => {
    const request = invocationRequest();
    request.artifactRef.agentArtifactHash = "not-a-hash";
    expect(
      validateSlotInvocationRequest(request, availableDescriptor()).issues
        .map((issue) => issue.code)
    ).toContain("RUNTIME_ADAPTER_ARTIFACT_HASH_INVALID");
  });

  it("rejects cross-Slot input namespaces and scenario.output", () => {
    const request = invocationRequest();
    request.input.namespace = "scenario.output";
    expect(
      validateSlotInvocationRequest(request, availableDescriptor()).issues
        .map((issue) => issue.code)
    ).toContain("RUNTIME_ADAPTER_INPUT_NAMESPACE_INVALID");
  });

  it("rejects unredacted input", () => {
    const request = invocationRequest();
    (request.input as { redactionApplied: boolean }).redactionApplied = false;
    expect(
      validateSlotInvocationRequest(request, availableDescriptor()).ok
    ).toBe(false);
  });

  it("rejects oversized input and excessive timeout", () => {
    const request = invocationRequest();
    request.input.byteLength = 999999;
    request.budget.timeoutMs = 999999;
    const codes = validateSlotInvocationRequest(
      request,
      availableDescriptor()
    ).issues.map((issue) => issue.code);
    expect(codes).toContain("RUNTIME_ADAPTER_INPUT_TOO_LARGE");
    expect(codes).toContain("RUNTIME_ADAPTER_TIMEOUT_INVALID");
  });

  it("rejects retry attempts and executable input", () => {
    const request = invocationRequest();
    (request.retryPolicy as { invocationAttempt: number }).invocationAttempt = 2;
    request.input.value = { run: () => "forbidden" };
    expect(
      validateSlotInvocationRequest(request, availableDescriptor()).ok
    ).toBe(false);
  });

  it("validates a complete Slot invocation result", () => {
    const request = invocationRequest();
    expect(
      validateSlotInvocationResult(invocationResult(request), {
        request,
        adapterDescriptor: availableDescriptor()
      })
    ).toMatchObject({ ok: true });
  });

  it("rejects completed without outcome or output", () => {
    const request = invocationRequest();
    const result = invocationResult(request);
    delete result.outcome;
    delete result.output;
    expect(
      validateSlotInvocationResult(result, {
        request,
        adapterDescriptor: availableDescriptor()
      }).issues.map((issue) => issue.code)
    ).toContain("RUNTIME_ADAPTER_RESULT_INVALID");
  });

  it.each(["failed", "timed_out", "cancelled"] as const)(
    "rejects %s without an error",
    (status) => {
      const request = invocationRequest();
      const result = invocationResult(request);
      result.status = status;
      delete result.error;
      expect(
        validateSlotInvocationResult(result, {
          request,
          adapterDescriptor: availableDescriptor()
        }).ok
      ).toBe(false);
    }
  );

  it("rejects output outside the current Slot namespace", () => {
    const request = invocationRequest();
    const result = invocationResult(request);
    result.output!.namespace = "scenario.output";
    expect(
      validateSlotInvocationResult(result, {
        request,
        adapterDescriptor: availableDescriptor()
      }).issues.map((issue) => issue.code)
    ).toContain("RUNTIME_ADAPTER_OUTPUT_NAMESPACE_INVALID");
  });

  it("rejects external effects declared as none", () => {
    const request = invocationRequest();
    const result = invocationResult(request);
    result.sideEffectSummary = {
      declaredLevel: "none",
      externalEffectsOccurred: true,
      effectCount: 1
    };
    expect(
      validateSlotInvocationResult(result, {
        request,
        adapterDescriptor: availableDescriptor()
      }).issues.map((issue) => issue.code)
    ).toContain("RUNTIME_ADAPTER_SIDE_EFFECT_LEVEL_EXCEEDED");
  });

  it("rejects unavailable Audit when the contract requires it", () => {
    const request = invocationRequest();
    const result = invocationResult(request);
    result.auditReference.status = "unavailable";
    expect(
      validateSlotInvocationResult(result, {
        request,
        adapterDescriptor: availableDescriptor()
      }).issues.map((issue) => issue.code)
    ).toContain("RUNTIME_ADAPTER_AUDIT_REQUIRED");
  });

  it("does not let a Slot declare Scenario completion", () => {
    const request = invocationRequest();
    const result = invocationResult(request);
    result.outcome = "$scenario_done";
    expect(
      validateSlotInvocationResult(result, {
        request,
        adapterDescriptor: availableDescriptor()
      }).ok
    ).toBe(false);
  });

  it("creates deterministic browser-safe SHA-256 and idempotency keys", () => {
    expect(sha256BrowserSafe("abc")).toBe(
      "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    const firstInput = createCanonicalInputHash({ b: 2, a: 1 });
    const secondInput = createCanonicalInputHash({
      a: 1,
      b: 2,
      generatedAt: "ignored",
      localPath: "ignored"
    });
    expect(firstInput).toBe(secondInput);
    const args = {
      orchestratorRunId: "run",
      invocationIndex: 1,
      slotId: "slot",
      agentArtifactHash: `sha256:${"a".repeat(64)}`,
      canonicalInputHash: firstInput
    };
    expect(createSlotInvocationIdempotencyKey(args)).toBe(
      createSlotInvocationIdempotencyKey(structuredClone(args))
    );
    expect(
      createSlotInvocationIdempotencyKey({
        ...args,
        canonicalInputHash: createCanonicalInputHash({ a: 2 })
      })
    ).not.toBe(createSlotInvocationIdempotencyKey(args));
  });

  it("excludes sensitive fields from idempotency hashing", () => {
    expect(() =>
      createCanonicalInputHash({ secret: "not-allowed" })
    ).toThrow("Sensitive field");
  });

  it("retains Trace and Audit parent-child bindings", () => {
    const request = invocationRequest();
    const result = invocationResult(request);
    const trace = createSlotTraceCorrelation(request);
    const audit = createSlotAuditBridge(request, result);
    expect(Object.keys(trace).sort()).toEqual(
      [...SLOT_TRACE_CORRELATION_FIELDS].sort()
    );
    expect(trace.parentSpanId).toBe(request.traceParent.parentSpanId);
    expect(audit).toMatchObject({
      runtimeRunId: result.runtimeRunId,
      auditAvailable: true,
      redacted: true
    });
  });

  it("does not assign Route or Binding events to the Adapter", () => {
    expect(ORCHESTRATOR_SLOT_INVOCATION_EVENT_TYPES).toHaveLength(3);
    expect(RUNTIME_ADAPTER_FORBIDDEN_ORCHESTRATOR_EVENTS).toEqual([
      "orchestrator.route.selected",
      "orchestrator.binding.applied"
    ]);
  });

  it("maps outcomes without selecting the next Scenario Route", () => {
    expect(mapSlotInvocationResultToSignal(invocationResult())).toEqual({
      type: "slot_completed",
      outcome: "slot_result_available"
    });
  });

  it("supports bilingual contract explanation", () => {
    const report = resolveOrchestratorRuntimeCompatibility(
      compatibilityInput(YUTRA_RUNTIME_ADAPTER_CONTRACT_V1)
    );
    expect(
      explainRuntimeAdapterContract(
        YUTRA_RUNTIME_ADAPTER_CONTRACT_V1,
        report,
        "en"
      )
    ).toContain("does not implement or execute scenario orchestration");
    expect(
      explainRuntimeAdapterContract(
        YUTRA_RUNTIME_ADAPTER_CONTRACT_V1,
        report,
        "zh-CN"
      )
    ).toContain("不实现也不执行场景编排");
  });

  it("rejects unknown Descriptor fields and unsafe public exposure", () => {
    const descriptor = {
      ...structuredClone(YUTRA_RUNTIME_ADAPTER_CONTRACT_V1),
      unknown: true,
      publicExposure: {
        ...YUTRA_RUNTIME_ADAPTER_CONTRACT_V1.publicExposure,
        containsSecret: true
      }
    };
    const validation = validateRuntimeAdapterDescriptor(descriptor);
    expect(validation.ok).toBe(false);
    expect(validation.issues.map((issue) => issue.code)).toContain(
      "RUNTIME_ADAPTER_PUBLIC_BOUNDARY_INVALID"
    );
  });

  it("does not invoke a Slot or network API", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const report = resolveOrchestratorRuntimeCompatibility(
      compatibilityInput()
    );
    expect(report.compatible).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect("invokeSlot" in YUTRA_RUNTIME_ADAPTER_CONTRACT_V1).toBe(false);
    fetchSpy.mockRestore();
  });

  it("keeps the contract package independent from Runtime and Builder", () => {
    const packageJson = readFileSync(
      resolve(import.meta.dirname, "..", "package.json"),
      "utf8"
    );
    expect(packageJson).not.toContain("@yutra/runtime");
    expect(packageJson).not.toContain("@yutra/builder");
  });

  it("does not mutate the Orchestrator Document during compatibility inspection", () => {
    const input = compatibilityInput();
    const before = JSON.stringify(input.orchestratorDocument);
    resolveOrchestratorRuntimeCompatibility(input);
    expect(JSON.stringify(input.orchestratorDocument)).toBe(before);
  });

  it("fails closed for a descriptor with no declared capabilities", () => {
    const descriptor = {
      ...availableDescriptor(),
      capabilities: {}
    } as unknown as ScenarioRuntimeAdapterDescriptor;
    const report = resolveOrchestratorRuntimeCompatibility(
      compatibilityInput(descriptor)
    );
    expect(report.compatible).toBe(false);
  });

  it("requires cancellation when explicitly requested by policy", () => {
    const report = resolveOrchestratorRuntimeCompatibility({
      ...compatibilityInput(),
      requiredCapabilities: ["cancellation"]
    });
    expect(report.compatible).toBe(false);
    expect(report.blockers).toContainEqual(
      expect.objectContaining({
        code: "mandatory_capability_missing",
        capabilityId: "cancellation"
      })
    );
  });

  it("keeps snapshot resume optional for the current non-resumable handoff", () => {
    const report = resolveOrchestratorRuntimeCompatibility(
      compatibilityInput()
    );
    expect(report.compatible).toBe(true);
    expect(report.warnings).toContainEqual(
      expect.objectContaining({
        capabilityId: "snapshot_resume"
      })
    );
  });

  it("accepts the current Orchestrator document type without a Runtime import", () => {
    const document: ScenarioOrchestratorDocument =
      compatibilityInput().orchestratorDocument;
    expect(document.executionModel).toBe(
      "single_active_slot_call_return"
    );
  });
});
