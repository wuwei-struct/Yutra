import {
  RUNTIME_ERROR_CODES,
  type RuntimeResult
} from "@yutra/runtime";
import type {
  SlotProjectionScalar
} from "@yutra/scenario-orchestrator-core";
import type {
  ScenarioSlotInvocationRequest,
  ScenarioSlotInvocationResult
} from "@yutra/scenario-orchestrator-runtime-contract";
import {
  DEMO_RUNTIME_ERROR_CODES,
  DemoRuntimeAdapterError
} from "./errors";
import type { SlotDispatchSummary } from "./types";

function jsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function safeErrorMessage(result: RuntimeResult): string {
  if (
    result.error?.code === RUNTIME_ERROR_CODES.ACTION_TIMEOUT ||
    result.error?.code === RUNTIME_ERROR_CODES.MAX_DURATION_EXCEEDED
  ) {
    return "The Slot Runtime exceeded its invocation timeout.";
  }
  return "The Slot Runtime failed closed.";
}

function traceReference(
  runtimeResult: RuntimeResult,
  request: ScenarioSlotInvocationRequest
): ScenarioSlotInvocationResult["traceReference"] {
  const eventCount = runtimeResult.traceEvents?.length ?? 0;
  return {
    runtimeRunId: runtimeResult.runId,
    parentOrchestratorRunId: request.orchestratorRunId,
    firstSequence: eventCount === 0 ? 0 : 1,
    lastSequence: eventCount,
    eventCount
  };
}

export function normalizeRuntimeResult(input: {
  runtimeResult: RuntimeResult;
  request: ScenarioSlotInvocationRequest;
  sideEffects: SlotDispatchSummary;
  elapsedMs: number;
  maxOutputBytes: number;
}): ScenarioSlotInvocationResult {
  const { runtimeResult, request } = input;
  const slotResult =
    runtimeResult.context?.slotResult &&
    typeof runtimeResult.context.slotResult === "object" &&
    !Array.isArray(runtimeResult.context.slotResult)
      ? (runtimeResult.context.slotResult as Record<string, unknown>)
      : undefined;
  const semanticMarker =
    typeof slotResult?.semanticMarker === "string"
      ? slotResult.semanticMarker
      : undefined;
  const controlSignal: "handoff_required" | "fail_closed" | undefined =
    slotResult?.controlSignal === "handoff_required" ||
    slotResult?.controlSignal === "fail_closed"
      ? slotResult.controlSignal
      : undefined;
  const outputMarkers: Record<string, SlotProjectionScalar> = semanticMarker
    ? { "slotResult.semanticMarker": semanticMarker }
    : {};

  const normalizedStatus: ScenarioSlotInvocationResult["status"] =
    runtimeResult.status === "completed"
      ? "completed"
      : runtimeResult.status === "handoff"
        ? "handoff_required"
        : runtimeResult.error?.code === RUNTIME_ERROR_CODES.ACTION_TIMEOUT ||
            runtimeResult.error?.code === RUNTIME_ERROR_CODES.MAX_DURATION_EXCEEDED
          ? "timed_out"
          : "failed";
  const base = {
    schemaVersion: "1.0.0-preview" as const,
    invocationId: request.invocationId,
    idempotencyKey: request.idempotencyKey,
    runtimeRunId: runtimeResult.runId,
    projectionEvidence: {
      runtimeStatus: normalizedStatus,
      ...(runtimeResult.finalState
        ? { runtimeFinalState: runtimeResult.finalState }
        : {}),
      outputMarkers,
      ...(controlSignal ? { controlSignal } : {}),
      ...(runtimeResult.error?.code ? { errorCode: runtimeResult.error.code } : {})
    },
    traceReference: traceReference(runtimeResult, request),
    auditReference: {
      runtimeRunId: runtimeResult.runId,
      status: "available" as const,
      redacted: true as const
    },
    sideEffectSummary: {
      declaredLevel: input.sideEffects.highestExecutedLevel,
      externalEffectsOccurred: input.sideEffects.externalEffectsOccurred,
      effectCount: input.sideEffects.effectCount
    },
    resourceUsage: {
      runtimeSteps: runtimeResult.steps,
      elapsedMs: Math.max(0, Math.floor(input.elapsedMs))
    }
  };

  if (runtimeResult.status === "completed") {
    if (!runtimeResult.finalState) {
      throw new DemoRuntimeAdapterError(
        DEMO_RUNTIME_ERROR_CODES.RESULT_INVALID,
        "Completed Slot Runtime result has no explicit final state."
      );
    }
    const value = {
      ...(semanticMarker
        ? {
            slotResult: {
              semanticMarker,
              ...(controlSignal ? { controlSignal } : {})
            }
          }
        : {}),
      payload: {
        finalState: runtimeResult.finalState,
        slotCompleted: true,
        scenarioCompleted: false,
        ...(runtimeResult.context?.result !== undefined
          ? { result: structuredClone(runtimeResult.context.result) }
          : {})
      }
    };
    const byteLength = jsonByteLength(value);
    if (byteLength > input.maxOutputBytes) {
      throw new DemoRuntimeAdapterError(
        DEMO_RUNTIME_ERROR_CODES.OUTPUT_TOO_LARGE,
        "Redacted Slot output exceeds the Adapter limit."
      );
    }
    return {
      ...base,
      status: "completed",
      outcome: runtimeResult.finalState,
      output: {
        namespace: `slots.${request.slotId}.output`,
        value,
        byteLength,
        redactionApplied: true
      }
    };
  }

  if (runtimeResult.status === "handoff") {
    return {
      ...base,
      status: "handoff_required",
      outcome: runtimeResult.finalState ?? "slot_handoff_required"
    };
  }

  const timedOut =
    runtimeResult.error?.code === RUNTIME_ERROR_CODES.ACTION_TIMEOUT ||
    runtimeResult.error?.code === RUNTIME_ERROR_CODES.MAX_DURATION_EXCEEDED;
  return {
    ...base,
    status: timedOut ? "timed_out" : "failed",
    error: {
      code: timedOut
        ? DEMO_RUNTIME_ERROR_CODES.TIMEOUT
        : runtimeResult.error?.code ?? DEMO_RUNTIME_ERROR_CODES.RESULT_INVALID,
      safeMessage: safeErrorMessage(runtimeResult),
      retryable: false
    }
  };
}
