import type { z } from "zod";
import type {
  RuntimeAdapterContractErrorCode,
  RuntimeAdapterContractIssue,
  RuntimeAdapterValidationResult
} from "./errors";
import {
  scenarioSlotInvocationRequestSchema,
  scenarioSlotInvocationResultSchema
} from "./invocation-schema";
import type {
  ScenarioRuntimeAdapterDescriptor,
  ScenarioSideEffectLevel,
  ScenarioSlotInvocationRequest,
  ScenarioSlotInvocationResult
} from "./types";

const FORBIDDEN_INPUT_KEYS = new Set([
  "adapter",
  "adapterConfig",
  "credential",
  "endpoint",
  "password",
  "secret",
  "token"
]);
const SIDE_EFFECT_ORDER: ScenarioSideEffectLevel[] = [
  "none",
  "read",
  "write",
  "external",
  "financial",
  "approval"
];

function issue(
  code: RuntimeAdapterContractErrorCode,
  message: string,
  path?: string[]
): RuntimeAdapterContractIssue {
  return { code, message, path };
}

function isSafeJsonValue(value: unknown, seen = new WeakSet<object>()): boolean {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (
    value === undefined ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    return false;
  }
  if (seen.has(value)) return false;
  seen.add(value);
  const entries = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry] as const)
    : Object.entries(value as Record<string, unknown>);
  for (const [key, nested] of entries) {
    if (FORBIDDEN_INPUT_KEYS.has(key)) return false;
    if (!isSafeJsonValue(nested, seen)) return false;
  }
  seen.delete(value);
  return true;
}

function schemaIssues(
  issues: z.ZodIssue[],
  fallbackCode: RuntimeAdapterContractErrorCode
): RuntimeAdapterContractIssue[] {
  return issues.map((schemaIssue) => {
    const path = schemaIssue.path.map(String);
    let code = fallbackCode;
    if (path.includes("idempotencyKey")) {
      code = "RUNTIME_ADAPTER_IDEMPOTENCY_REQUIRED";
    } else if (
      path.includes("agentArtifactHash") ||
      path.includes("configHash")
    ) {
      code = "RUNTIME_ADAPTER_ARTIFACT_HASH_INVALID";
    } else if (path.includes("redactionApplied")) {
      code = "RUNTIME_ADAPTER_INPUT_NAMESPACE_INVALID";
    } else if (path.includes("timeoutMs")) {
      code = "RUNTIME_ADAPTER_TIMEOUT_INVALID";
    }
    return issue(code, schemaIssue.message, path);
  });
}

export function validateSlotInvocationRequest(
  input: unknown,
  adapterDescriptor: ScenarioRuntimeAdapterDescriptor
): RuntimeAdapterValidationResult<ScenarioSlotInvocationRequest> {
  const parsed = scenarioSlotInvocationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: schemaIssues(
        parsed.error.issues,
        "RUNTIME_ADAPTER_RESULT_INVALID"
      )
    };
  }
  const request = parsed.data as ScenarioSlotInvocationRequest;
  const issues: RuntimeAdapterContractIssue[] = [];
  if (
    request.input.namespace !== `slots.${request.slotId}.input` ||
    request.artifactRef.agentArtifactPath !==
      `slots/${request.slotId}/agent.yutra.yaml`
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_INPUT_NAMESPACE_INVALID",
        `Slot ${request.slotId} input and artifact references must remain in the Slot namespace.`,
        ["input", "namespace"]
      )
    );
  }
  if (
    request.traceParent.orchestratorRunId !== request.orchestratorRunId
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_TRACE_BINDING_REQUIRED",
        "Trace parent must bind to the same Orchestrator run.",
        ["traceParent", "orchestratorRunId"]
      )
    );
  }
  if (
    request.input.byteLength > adapterDescriptor.limits.maxInvocationInputBytes
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_INPUT_TOO_LARGE",
        "Slot invocation input exceeds the Adapter limit.",
        ["input", "byteLength"]
      )
    );
  }
  if (
    request.budget.timeoutMs > adapterDescriptor.limits.maxTimeoutMs
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_TIMEOUT_INVALID",
        "Slot invocation timeout exceeds the Adapter limit.",
        ["budget", "timeoutMs"]
      )
    );
  }
  if (!isSafeJsonValue(request.input.value)) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_INPUT_NAMESPACE_INVALID",
        "Slot input must be finite, acyclic JSON without adapter, endpoint, credential, or executable fields.",
        ["input", "value"]
      )
    );
  }
  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: request, issues: [] };
}

export function validateSlotInvocationResult(
  input: unknown,
  context: {
    request: ScenarioSlotInvocationRequest;
    adapterDescriptor: ScenarioRuntimeAdapterDescriptor;
    auditRequired?: boolean;
  }
): RuntimeAdapterValidationResult<ScenarioSlotInvocationResult> {
  const parsed = scenarioSlotInvocationResultSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: schemaIssues(
        parsed.error.issues,
        "RUNTIME_ADAPTER_RESULT_INVALID"
      )
    };
  }
  const result = parsed.data as ScenarioSlotInvocationResult;
  const { request, adapterDescriptor } = context;
  const issues: RuntimeAdapterContractIssue[] = [];
  if (result.projectionEvidence.runtimeStatus !== result.status) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_RESULT_INVALID",
        "Projection evidence Runtime status must match the normalized Slot status.",
        ["projectionEvidence", "runtimeStatus"]
      )
    );
  }
  if (
    Object.keys(result.projectionEvidence.outputMarkers).some(
      (path) =>
        !/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(path) ||
        path.split(".").some((segment) =>
          ["__proto__", "prototype", "constructor"].includes(segment)
        )
    )
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_RESULT_INVALID",
        "Projection evidence contains an unsafe output marker path.",
        ["projectionEvidence", "outputMarkers"]
      )
    );
  }
  if (
    result.invocationId !== request.invocationId ||
    result.idempotencyKey !== request.idempotencyKey ||
    result.traceReference.runtimeRunId !== result.runtimeRunId ||
    result.auditReference.runtimeRunId !== result.runtimeRunId
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_RESULT_INVALID",
        "Slot result identifiers must bind to the invocation and Runtime run.",
        ["invocationId"]
      )
    );
  }
  if (
    result.traceReference.parentOrchestratorRunId !==
    request.orchestratorRunId
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_TRACE_BINDING_REQUIRED",
        "Slot Trace must retain the parent Orchestrator run.",
        ["traceReference", "parentOrchestratorRunId"]
      )
    );
  }
  if (
    result.traceReference.lastSequence <
      result.traceReference.firstSequence ||
    (result.traceReference.eventCount === 0 &&
      result.traceReference.lastSequence !==
        result.traceReference.firstSequence)
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_RESULT_INVALID",
        "Slot Trace reference sequence bounds are invalid.",
        ["traceReference"]
      )
    );
  }
  if (result.status === "completed") {
    if (!result.outcome || !result.output) {
      issues.push(
        issue(
          "RUNTIME_ADAPTER_RESULT_INVALID",
          "A completed Slot result requires an outcome and namespaced output.",
          ["status"]
        )
      );
    }
    if (
      result.outcome === "$scenario_done" ||
      result.outcome === "scenario_completed"
    ) {
      issues.push(
        issue(
          "RUNTIME_ADAPTER_RESULT_INVALID",
          "A Slot Runtime cannot declare the Scenario completed.",
          ["outcome"]
        )
      );
    }
  }
  if (
    result.status === "handoff_required" &&
    !result.outcome &&
    !result.error?.safeMessage
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_RESULT_INVALID",
        "A handoff result requires an outcome or safe reason.",
        ["status"]
      )
    );
  }
  if (
    ["failed", "cancelled", "timed_out"].includes(result.status) &&
    !result.error
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_RESULT_INVALID",
        `${result.status} requires a safe non-retryable error.`,
        ["error"]
      )
    );
  }
  if (
    result.output &&
    (result.output.namespace !== `slots.${request.slotId}.output` ||
      result.output.byteLength >
        adapterDescriptor.limits.maxInvocationOutputBytes ||
      !isSafeJsonValue(result.output.value))
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_OUTPUT_NAMESPACE_INVALID",
        `Slot ${request.slotId} output must remain in its redacted output namespace and Adapter size limit.`,
        ["output"]
      )
    );
  }
  const declaredRank = SIDE_EFFECT_ORDER.indexOf(
    result.sideEffectSummary.declaredLevel
  );
  const maximumRank = SIDE_EFFECT_ORDER.indexOf(
    request.sideEffectPolicy.maximumAllowedLevel
  );
  if (
    declaredRank > maximumRank ||
    (result.sideEffectSummary.externalEffectsOccurred &&
      (declaredRank === 0 || result.sideEffectSummary.effectCount === 0))
  ) {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_SIDE_EFFECT_LEVEL_EXCEEDED",
        "Reported side effects conflict with the invocation boundary.",
        ["sideEffectSummary"]
      )
    );
  }
  const auditRequired =
    context.auditRequired !== false ||
    declaredRank >= SIDE_EFFECT_ORDER.indexOf("external");
  if (auditRequired && result.auditReference.status !== "available") {
    issues.push(
      issue(
        "RUNTIME_ADAPTER_AUDIT_REQUIRED",
        "The Orchestrator policy requires an available redacted Audit reference.",
        ["auditReference", "status"]
      )
    );
  }
  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: result, issues: [] };
}
