import {
  executeRun,
  type ActionExecutionPolicy,
  type RuntimeInput
} from "@yutra/runtime";
import {
  createCanonicalInputHash,
  createSlotInvocationIdempotencyKey,
  resolveOrchestratorRuntimeCompatibility,
  validateSlotInvocationRequest,
  validateSlotInvocationResult,
  type ScenarioSlotInvocationRequest,
  type ScenarioSlotInvocationResult
} from "@yutra/scenario-orchestrator-runtime-contract";
import { inspectSlotActionClosure, parseAndValidateSlotAgentDsl } from "./action-closure-preflight";
import { DemoAdapterAuditLedger } from "./audit-ledger";
import { YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1 } from "./descriptor";
import {
  DEMO_RUNTIME_ERROR_CODES,
  DemoRuntimeAdapterError,
  asDemoRuntimeError
} from "./errors";
import { InMemoryInvocationLedger } from "./in-memory-idempotency-ledger";
import { normalizeRuntimeResult } from "./normalize-runtime-result";
import { createDispatchEnforcedActionRegistry } from "./dispatch-enforcement";
import { inspectSlotSideEffectCoverage } from "./side-effect-preflight";
import { SlotTraceParentLedger } from "./trace-parent-ledger";
import type {
  InMemoryScenarioRuntimeAdapter,
  InMemoryScenarioRuntimeAdapterOptions
} from "./types";

function jsonByteLength(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    throw new DemoRuntimeAdapterError(
      DEMO_RUNTIME_ERROR_CODES.INPUT_NAMESPACE_INVALID,
      "Slot input must be finite, acyclic JSON."
    );
  }
}

function runtimeInput(request: ScenarioSlotInvocationRequest): RuntimeInput {
  const value = request.input.value;
  return {
    context:
      typeof value === "object" && value !== null && !Array.isArray(value)
        ? structuredClone(value as Record<string, unknown>)
        : { value: structuredClone(value) }
  };
}

function requestFingerprint(request: ScenarioSlotInvocationRequest): string {
  const clone = structuredClone(request);
  clone.idempotencyKey = "";
  clone.input.byteLength = jsonByteLength(clone.input.value);
  return createCanonicalInputHash(clone);
}

function validateIdempotencyKey(request: ScenarioSlotInvocationRequest): void {
  const canonicalInputHash = createCanonicalInputHash(request.input.value);
  const expected = createSlotInvocationIdempotencyKey({
    orchestratorRunId: request.orchestratorRunId,
    invocationIndex: request.invocationIndex,
    slotId: request.slotId,
    agentArtifactHash: request.artifactRef.agentArtifactHash,
    canonicalInputHash
  });
  if (request.idempotencyKey !== expected) {
    throw new DemoRuntimeAdapterError(
      DEMO_RUNTIME_ERROR_CODES.IDEMPOTENCY_CONFLICT,
      "Invocation idempotency key does not match the canonical Slot request."
    );
  }
}

export function createInMemoryScenarioRuntimeAdapter(
  options: InMemoryScenarioRuntimeAdapterOptions
): InMemoryScenarioRuntimeAdapter {
  const runtimeFactory = options.runtimeFactory ?? executeRun;
  const now = options.now ?? Date.now;
  const invocationLedger = new InMemoryInvocationLedger();
  const traceParentLedger = new SlotTraceParentLedger();
  const auditLedger = new DemoAdapterAuditLedger();
  let activeInvocation = false;

  const invokeCanonical = async (
    request: ScenarioSlotInvocationRequest,
    markRuntimeInvocation: () => void
  ): Promise<ScenarioSlotInvocationResult> => {
    if (activeInvocation) {
      throw new DemoRuntimeAdapterError(
        DEMO_RUNTIME_ERROR_CODES.BUSY,
        "The in-memory demo Adapter permits one active Slot invocation."
      );
    }
    activeInvocation = true;
    try {
      const artifact = options.artifactStore.get(
        request.artifactRef.agentArtifactPath
      );
      if (!artifact) {
        throw new DemoRuntimeAdapterError(
          DEMO_RUNTIME_ERROR_CODES.ARTIFACT_NOT_FOUND,
          "The requested Slot Agent artifact is not registered.",
          { slotId: request.slotId }
        );
      }
      if (artifact.artifactHash !== request.artifactRef.agentArtifactHash) {
        throw new DemoRuntimeAdapterError(
          DEMO_RUNTIME_ERROR_CODES.ARTIFACT_HASH_MISMATCH,
          "The requested Slot Agent artifact hash does not match the store.",
          { slotId: request.slotId }
        );
      }
      if (artifact.configHash !== request.artifactRef.configHash) {
        throw new DemoRuntimeAdapterError(
          DEMO_RUNTIME_ERROR_CODES.CONFIG_HASH_MISMATCH,
          "The requested Slot config hash does not match the store.",
          { slotId: request.slotId }
        );
      }
      if (artifact.archetypeId !== request.archetypeId) {
        throw new DemoRuntimeAdapterError(
          DEMO_RUNTIME_ERROR_CODES.RESULT_INVALID,
          "The requested Slot archetype does not match the artifact.",
          { slotId: request.slotId }
        );
      }

      const spec = parseAndValidateSlotAgentDsl(artifact.artifactContent);
      const closure = inspectSlotActionClosure({
        slotId: request.slotId,
        agentDsl: artifact.artifactContent,
        artifactHash: artifact.artifactHash,
        actionRegistry: options.actionRegistry
      });
      if (!closure.complete) {
        const unresolved = closure.unresolvedActionIds.slice(0, 10).join(", ");
        throw new DemoRuntimeAdapterError(
          DEMO_RUNTIME_ERROR_CODES.ACTION_CLOSURE_INCOMPLETE,
          `Slot Action Closure is incomplete: ${unresolved}.`,
          { slotId: request.slotId }
        );
      }
      const sideEffectCoverage = inspectSlotSideEffectCoverage({
        closure,
        resolveSideEffectLevel: options.resolveSideEffectLevel
      });
      const dispatch = createDispatchEnforcedActionRegistry({
        actionRegistry: options.actionRegistry,
        coverage: sideEffectCoverage,
        maximumAllowedLevel: request.sideEffectPolicy.maximumAllowedLevel
      });
      const actionPolicies = Object.fromEntries(
        Object.entries(sideEffectCoverage.actionLevels).map(([actionId, sideEffect]) => [
          actionId,
          {
            sideEffect:
              sideEffect === "financial" || sideEffect === "approval"
                ? "external"
                : sideEffect
          } satisfies ActionExecutionPolicy
        ])
      );

      const startedAt = now();
      markRuntimeInvocation();
      const runtimeResult = await runtimeFactory({
        spec,
        input: runtimeInput(request),
        options: {
          actionRegistry: dispatch.actionRegistry,
          actionPolicies,
          retryPolicy: { maxAttempts: 1, backoffMs: 0 },
          maxSteps: request.budget.maxRuntimeSteps,
          maxDurationMs: request.budget.timeoutMs,
          actionTimeoutMs: request.budget.timeoutMs,
          maxExternalCalls: request.budget.maxRuntimeSteps,
          environment: "demo"
        }
      });
      const dispatchViolation = dispatch.violation();
      if (dispatchViolation) throw dispatchViolation;
      const result = normalizeRuntimeResult({
        runtimeResult,
        request,
        sideEffects: dispatch.summary(),
        elapsedMs: now() - startedAt,
        maxOutputBytes:
          YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1.limits.maxInvocationOutputBytes
      });
      const validation = validateSlotInvocationResult(result, {
        request,
        adapterDescriptor: YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1,
        auditRequired: true
      });
      if (!validation.ok) {
        throw new DemoRuntimeAdapterError(
          DEMO_RUNTIME_ERROR_CODES.RESULT_INVALID,
          "Normalized Slot result failed the Runtime Adapter contract."
        );
      }
      traceParentLedger.bind({
        invocationId: request.invocationId,
        runtimeRunId: result.runtimeRunId,
        orchestratorRunId: request.orchestratorRunId,
        orchestratorId: request.orchestratorId,
        compositionId: request.compositionId,
        slotId: request.slotId,
        parentSpanId: request.traceParent.parentSpanId,
        invocationIndex: request.invocationIndex,
        agentArtifactHash: request.artifactRef.agentArtifactHash,
        configHash: request.artifactRef.configHash
      });
      auditLedger.record({
        invocationId: request.invocationId,
        runtimeRunId: result.runtimeRunId,
        slotId: request.slotId,
        artifactHash: request.artifactRef.agentArtifactHash,
        configHash: request.artifactRef.configHash,
        status: result.status,
        redacted: true,
        sideEffectSummary: result.sideEffectSummary,
        traceReference: result.traceReference
      });
      return result;
    } finally {
      activeInvocation = false;
    }
  };

  return {
    descriptor: YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1,
    artifactStore: options.artifactStore,
    invocationLedger,
    traceParentLedger,
    auditLedger,
    inspectCompatibility(input) {
      return resolveOrchestratorRuntimeCompatibility({
        ...input,
        adapterDescriptor: YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1
      });
    },
    async invokeSlot(input) {
      if (
        YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1.implementationStatus !==
        "available"
      ) {
        throw new DemoRuntimeAdapterError(
          DEMO_RUNTIME_ERROR_CODES.NOT_AVAILABLE,
          "The in-memory demo Runtime Adapter is unavailable."
        );
      }
      const actualInputBytes =
        typeof input === "object" &&
        input !== null &&
        "input" in input &&
        typeof input.input === "object" &&
        input.input !== null &&
        "value" in input.input
          ? jsonByteLength(input.input.value)
          : 0;
      const normalizedInput =
        typeof input === "object" && input !== null
          ? structuredClone(input)
          : input;
      if (
        typeof normalizedInput === "object" &&
        normalizedInput !== null &&
        "input" in normalizedInput &&
        typeof normalizedInput.input === "object" &&
        normalizedInput.input !== null
      ) {
        normalizedInput.input.byteLength = actualInputBytes;
      }
      const validation = validateSlotInvocationRequest(
        normalizedInput,
        YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1
      );
      if (!validation.ok) {
        const first = validation.issues[0];
        const code =
          first?.code === "RUNTIME_ADAPTER_INPUT_TOO_LARGE"
            ? DEMO_RUNTIME_ERROR_CODES.INPUT_TOO_LARGE
            : first?.code === "RUNTIME_ADAPTER_TIMEOUT_INVALID"
              ? DEMO_RUNTIME_ERROR_CODES.TIMEOUT
              : DEMO_RUNTIME_ERROR_CODES.INPUT_NAMESPACE_INVALID;
        throw new DemoRuntimeAdapterError(
          code,
          "Slot Invocation Request failed the demo Adapter contract."
        );
      }
      const request = validation.value;
      validateIdempotencyKey(request);
      try {
        return await invocationLedger.execute(
          request.idempotencyKey,
          requestFingerprint(request),
          (markRuntimeInvocation) =>
            invokeCanonical(request, markRuntimeInvocation)
        );
      } catch (error) {
        throw asDemoRuntimeError(
          error,
          DEMO_RUNTIME_ERROR_CODES.RESULT_INVALID,
          "The in-memory Slot invocation failed closed."
        );
      }
    }
  };
}
