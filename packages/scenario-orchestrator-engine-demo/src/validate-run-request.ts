import { DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES, DemoOrchestratorEngineError } from "./errors";
import type { ScenarioRunRequest } from "./types";

const REQUEST_KEYS = [
  "schemaVersion", "orchestratorRunId", "idempotencyKey", "orchestratorId",
  "compositionId", "previewBundleHash", "input", "sideEffectPolicy", "budget"
];
const UNSAFE = new Set(["__proto__", "prototype", "constructor"]);
const FORBIDDEN_INPUT_KEYS = /^(?:endpoint|secret|token|password|adapterConfig|adapter_config)$/i;

export function jsonByteLength(value: unknown): number {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error("not JSON");
    return new TextEncoder().encode(serialized).byteLength;
  } catch {
    throw new DemoOrchestratorEngineError(
      DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.INPUT_INVALID,
      "Scenario input must be finite, acyclic JSON."
    );
  }
}

function safeJson(value: unknown): boolean {
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") return false;
  if (!value || typeof value !== "object") return true;
  if (Array.isArray(value)) return value.every(safeJson);
  return Object.entries(value).every(
    ([key, child]) =>
      !UNSAFE.has(key) && !FORBIDDEN_INPUT_KEYS.test(key) && safeJson(child)
  );
}

function exactKeys(value: unknown, allowed: readonly string[]): boolean {
  return !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => allowed.includes(key));
}

export function validateScenarioRunRequest(
  input: unknown,
  expected: { orchestratorId: string; compositionId: string; previewBundleHash: string }
): ScenarioRunRequest {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.INPUT_INVALID, "Scenario Run Request is invalid.");
  }
  const candidate = input as Record<string, unknown>;
  if (Object.keys(candidate).some((key) => !REQUEST_KEYS.includes(key))) {
    throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.INPUT_INVALID, "Scenario Run Request contains unknown fields.");
  }
  const request = structuredClone(input) as ScenarioRunRequest;
  const budgetValues = request.budget ? Object.values(request.budget) : [];
  if (
    request.schemaVersion !== "1.0.0-preview" ||
    !request.orchestratorRunId ||
    !request.idempotencyKey ||
    request.orchestratorId !== expected.orchestratorId ||
    request.compositionId !== expected.compositionId ||
    request.previewBundleHash !== expected.previewBundleHash ||
    request.input?.namespace !== "scenario.input" ||
    request.input?.redactionApplied !== true ||
    !exactKeys(request.input, ["namespace", "value", "byteLength", "redactionApplied"]) ||
    !exactKeys(request.sideEffectPolicy, ["maximumAllowedLevel"]) ||
    (request.budget !== undefined &&
      !exactKeys(request.budget, [
        "maxSlotInvocations",
        "maxRouteEvaluations",
        "maxBindingApplications",
        "timeoutMsPerSlot"
      ])) ||
    budgetValues.some((value) => !Number.isSafeInteger(value) || Number(value) < 0) ||
    !["none", "read"].includes(request.sideEffectPolicy?.maximumAllowedLevel) ||
    !safeJson(request.input?.value)
  ) {
    throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.INPUT_INVALID, "Scenario Run Request failed the strict demo contract.");
  }
  request.input.byteLength = jsonByteLength(request.input.value);
  return request;
}
