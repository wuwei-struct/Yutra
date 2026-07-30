import {
  createBuiltinDemoEngineOptions,
  createBuiltinScenarioRunRequest,
  createInMemoryScenarioOrchestratorEngine,
  type BuiltinDemoCompositionId,
  type OrchestratorTraceEvent
} from "@yutra/scenario-orchestrator-engine-demo";
import type {
  ScenarioRunPreviewDemoCase,
  ScenarioRunPreviewRequest,
  ScenarioRunPreviewResponse,
  ScenarioRunPreviewResult,
  ScenarioRunPreviewTimelineItem
} from "./types";

type DemoCaseDefinition = {
  compositionId: BuiltinDemoCompositionId;
  value: Readonly<Record<string, unknown>>;
};

const DEMO_CASES: Readonly<Record<ScenarioRunPreviewDemoCase, DemoCaseDefinition>> =
  Object.freeze({
    complaint_policy: {
      compositionId: "customer-complaint-composition-demo",
      value: { demoPath: "policy_explanation" }
    },
    complaint_compensation: {
      compositionId: "customer-complaint-composition-demo",
      value: { demoPath: "compensation" }
    },
    complaint_handoff: {
      compositionId: "customer-complaint-composition-demo",
      value: { demoPath: "handoff", requires_handoff: true }
    },
    refund_authorization: {
      compositionId: "ecommerce-refund-composition-demo",
      value: { demoPath: "authorization" }
    },
    overlay_deny: {
      compositionId: "customer-complaint-composition-demo",
      value: { denyOverlay: "complaint_policy_guard" }
    }
  });

const SAFE_TRACE_DETAIL_KEYS = new Set([
  "slotId",
  "routeId",
  "bindingId",
  "overlayId",
  "stage",
  "decision",
  "effect",
  "runtimeStatus",
  "terminalId",
  "errorCode",
  "invocationIndex"
]);

let runSequence = 0;

export class ScenarioRunPreviewApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: 400 | 404 | 422 | 500
  ) {
    super(message);
    this.name = "ScenarioRunPreviewApiError";
  }
}

export function parseScenarioRunPreviewRequest(
  input: unknown
): ScenarioRunPreviewRequest {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ScenarioRunPreviewApiError(
      "SCENARIO_RUN_REQUEST_INVALID",
      "Request must be an object containing only compositionId and demoCase.",
      400
    );
  }
  const record = input as Record<string, unknown>;
  if (
    Object.keys(record).length !== 2 ||
    typeof record.compositionId !== "string" ||
    typeof record.demoCase !== "string"
  ) {
    throw new ScenarioRunPreviewApiError(
      "SCENARIO_RUN_REQUEST_INVALID",
      "Request must contain only string compositionId and demoCase fields.",
      400
    );
  }
  const compositionIds = new Set([
    "customer-complaint-composition-demo",
    "ecommerce-refund-composition-demo"
  ]);
  if (!compositionIds.has(record.compositionId)) {
    throw new ScenarioRunPreviewApiError(
      "SCENARIO_RUN_COMPOSITION_NOT_FOUND",
      "Scenario Composition is not available for manual Run Preview.",
      404
    );
  }
  const definition = DEMO_CASES[record.demoCase as ScenarioRunPreviewDemoCase];
  if (!definition || definition.compositionId !== record.compositionId) {
    throw new ScenarioRunPreviewApiError(
      "SCENARIO_RUN_CASE_NOT_SUPPORTED",
      "Demo case is not available for this canonical Scenario Composition.",
      422
    );
  }
  return {
    compositionId: record.compositionId as ScenarioRunPreviewRequest["compositionId"],
    demoCase: record.demoCase as ScenarioRunPreviewDemoCase
  };
}

function safeTraceDetails(
  event: OrchestratorTraceEvent
): Record<string, string | number | boolean> {
  const details: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(event.details)) {
    if (
      SAFE_TRACE_DETAIL_KEYS.has(key) &&
      (typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean")
    ) {
      details[key] = value;
    }
  }
  return details;
}

function timeline(
  events: OrchestratorTraceEvent[],
  slots: ScenarioRunPreviewResult["slotInvocations"]
): ScenarioRunPreviewTimelineItem[] {
  const items: ScenarioRunPreviewTimelineItem[] = [];
  for (const event of events) {
    const details = safeTraceDetails(event);
    items.push({
      index: items.length + 1,
      source: "orchestrator_trace",
      type: event.type,
      sequence: event.sequence,
      ...(typeof details.slotId === "string" ? { slotId: details.slotId } : {}),
      ...(typeof details.routeId === "string" ? { routeId: details.routeId } : {}),
      ...(typeof details.bindingId === "string"
        ? { bindingId: details.bindingId }
        : {}),
      ...(typeof details.overlayId === "string"
        ? { overlayId: details.overlayId }
        : {}),
      ...(typeof details.decision === "string"
        ? { decision: details.decision }
        : {}),
      ...(typeof details.runtimeStatus === "string"
        ? { runtimeStatus: details.runtimeStatus }
        : {}),
      ...(typeof details.terminalId === "string"
        ? { terminalId: details.terminalId }
        : {}),
      ...(typeof details.errorCode === "string"
        ? { errorCode: details.errorCode }
        : {})
    });
    if (event.type === "orchestrator.slot.invocation.completed") {
      const slot = slots.find(
        (candidate) =>
          candidate.slotId === details.slotId &&
          candidate.invocationIndex === details.invocationIndex
      );
      if (slot?.semanticOutcome && slot.projectionId) {
        items.push({
          index: items.length + 1,
          source: "projection_evidence",
          type: "Outcome Projection",
          slotId: slot.slotId,
          semanticOutcome: slot.semanticOutcome,
          projectionId: slot.projectionId,
          runtimeStatus: slot.runtimeStatus
        });
      }
    }
  }
  return items;
}

function auditStatus(value: unknown): "available" | "unavailable" {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as { status?: unknown }).status === "available"
  ) {
    return "available";
  }
  return "unavailable";
}

export async function runCanonicalScenarioPreview(
  request: ScenarioRunPreviewRequest
): Promise<ScenarioRunPreviewResponse> {
  const definition = DEMO_CASES[request.demoCase];
  if (!definition || definition.compositionId !== request.compositionId) {
    throw new ScenarioRunPreviewApiError(
      "SCENARIO_RUN_CASE_NOT_SUPPORTED",
      "Demo case is not available for this canonical Scenario Composition.",
      422
    );
  }
  const options = createBuiltinDemoEngineOptions(request.compositionId);
  const engine = createInMemoryScenarioOrchestratorEngine(options);
  runSequence += 1;
  const runRequest = createBuiltinScenarioRunRequest({
    compileResult: options.compileResult,
    orchestratorRunId: `studio-scenario-preview-${runSequence}`,
    value: structuredClone(definition.value)
  });
  const result = await engine.runScenario(runRequest);
  const events = engine.trace(result.orchestratorRunId);
  const audit = engine.audit(result.orchestratorRunId);
  if (!audit || !audit.redacted) {
    throw new ScenarioRunPreviewApiError(
      "SCENARIO_RUN_AUDIT_UNAVAILABLE",
      "Redacted Scenario audit summary is unavailable.",
      500
    );
  }
  if (audit.sideEffectSummary.externalEffectsOccurred !== false) {
    throw new ScenarioRunPreviewApiError(
      "SCENARIO_RUN_EXTERNAL_EFFECT_FORBIDDEN",
      "Scenario Run Preview reported an external side effect.",
      500
    );
  }
  const slotInvocations = result.slotInvocations.map((slot) => ({
    invocationIndex: slot.invocationIndex,
    slotId: slot.slotId,
    runtimeStatus: slot.runtimeStatus,
    ...(slot.runtimeFinalState
      ? { runtimeFinalState: slot.runtimeFinalState }
      : {}),
    ...(slot.semanticOutcome ? { semanticOutcome: slot.semanticOutcome } : {}),
    ...(slot.projectionId ? { projectionId: slot.projectionId } : {}),
    ...(slot.runtimeRunId ? { runtimeRunId: slot.runtimeRunId } : {}),
    traceReferenceAvailable: Boolean(slot.traceReference),
    auditReferenceStatus: auditStatus(slot.auditReference)
  }));
  const selectedRoutes = events
    .filter((event) => event.type === "orchestrator.route.selected")
    .map((event) => {
      const details = safeTraceDetails(event);
      return {
        routeId: String(details.routeId ?? ""),
        effect: String(details.effect ?? "")
      };
    });
  const appliedBindings = events
    .filter((event) => event.type === "orchestrator.binding.applied")
    .map((event) => ({
      bindingId: String(safeTraceDetails(event).bindingId ?? "")
    }));
  const evaluatedOverlays = events
    .filter((event) => event.type === "orchestrator.overlay.evaluated")
    .map((event) => {
      const details = safeTraceDetails(event);
      return {
        overlayId: String(details.overlayId ?? ""),
        stage: String(details.stage ?? ""),
        decision: String(details.decision ?? "")
      };
    });
  const safeResult: ScenarioRunPreviewResult = {
    compositionId: request.compositionId,
    orchestratorRunId: result.orchestratorRunId,
    demoCase: request.demoCase,
    status: result.status,
    terminalId: result.terminalId,
    scenarioCompleted: result.scenarioCompleted,
    slotInvocationCount: slotInvocations.length,
    slotInvocations,
    projectedOutcomes: slotInvocations.flatMap((slot) =>
      slot.semanticOutcome && slot.projectionId
        ? [
            {
              slotId: slot.slotId,
              semanticOutcome: slot.semanticOutcome,
              projectionId: slot.projectionId
            }
          ]
        : []
    ),
    selectedRoutes,
    appliedBindings,
    evaluatedOverlays,
    traceSummary: structuredClone(result.traceSummary),
    timeline: timeline(events, slotInvocations),
    budgetUsage: structuredClone(result.budgetUsage),
    auditSummary: {
      status: "available",
      redacted: true,
      externalEffectsOccurred: false
    },
    externalEffectsOccurred: false,
    manualTriggerOnly: true,
    inMemoryOnly: true,
    persisted: false
  };
  return { ok: true, result: safeResult };
}
