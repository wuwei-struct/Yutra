import {
  evaluateSlotOutcomeProjection,
  type ScenarioOrchestratorRoute
} from "@yutra/scenario-orchestrator-core";
import {
  createCanonicalInputHash,
  createSlotInvocationIdempotencyKey,
  type ScenarioSlotInvocationRequest,
  type ScenarioSlotInvocationResult
} from "@yutra/scenario-orchestrator-runtime-contract";
import { applyIdentityBindings } from "./data-binding-engine";
import {
  DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES,
  DemoOrchestratorEngineError
} from "./errors";
import { ExecutionBudget } from "./execution-budget";
import { OrchestratorAuditLedger } from "./orchestrator-audit-ledger";
import { OrchestratorTraceLedger } from "./orchestrator-trace-ledger";
import { evaluateScenarioOverlays } from "./overlay-evaluator";
import { resolveScenarioRoute } from "./route-resolver";
import { ScenarioCallStack } from "./scenario-call-stack";
import { ScenarioContextStore } from "./scenario-context-store";
import { InMemoryScenarioRunLedger } from "./scenario-run-ledger";
import type {
  EngineOptions,
  OrchestratorAuditSummary,
  ScenarioOrchestratorEngine,
  ScenarioRunRequest,
  ScenarioRunResult,
  ScenarioRunStatus,
  ScenarioSlotInvocationSummary,
  ScenarioTerminalId
} from "./types";
import { jsonByteLength, validateScenarioRunRequest } from "./validate-run-request";

function validateBundle(options: EngineOptions): void {
  const result = options.compileResult;
  if (
    result.previewOnly !== true ||
    result.runtimeExecutable !== false ||
    result.currentRuntimeSupported !== false ||
    result.orchestratorDocument.orchestratorId !== result.orchestratorId ||
    result.orchestratorDocument.compositionRef.compositionId !== result.compositionId ||
    result.orchestratorDocument.provenance.planHash !== result.planHash ||
    result.orchestratorDocument.provenance.bundleHash !== result.compositionBundleHash ||
    result.orchestratorDocument.provenance.orchestratorHash !== result.orchestratorHash
  ) {
    throw new DemoOrchestratorEngineError(
      DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.BUNDLE_INVALID,
      "Scenario Orchestrator Preview Bundle failed the Engine closure check."
    );
  }
}

function outputPayload(result: ScenarioSlotInvocationResult): unknown {
  if (!result.output?.value || typeof result.output.value !== "object" || Array.isArray(result.output.value)) return undefined;
  return (result.output.value as Record<string, unknown>).payload;
}

function resultError(error: unknown): { code: string; safeMessage: string; retryable: false } {
  if (error instanceof DemoOrchestratorEngineError) {
    return { code: error.code, safeMessage: error.message, retryable: false };
  }
  return {
    code: DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.SLOT_FAILED,
    safeMessage: "The in-memory Scenario Engine failed closed.",
    retryable: false
  };
}

export function createInMemoryScenarioOrchestratorEngine(
  options: EngineOptions
): ScenarioOrchestratorEngine {
  validateBundle(options);
  const document = structuredClone(options.compileResult.orchestratorDocument);
  const compatibility = options.runtimeAdapter.inspectCompatibility({
    orchestratorDocument: document,
    adapterDescriptor: options.runtimeAdapter.descriptor,
    ...options.compatibility
  });
  if (!compatibility.compatible) {
    throw new DemoOrchestratorEngineError(
      DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.ADAPTER_INCOMPATIBLE,
      "Scenario Runtime Adapter is incompatible with the Orchestrator contract."
    );
  }
  for (const slot of document.slots) {
    const artifact = options.artifactStore.get(slot.artifactRef.agentArtifactPath);
    if (
      !artifact ||
      artifact.artifactHash !== slot.artifactRef.agentArtifactHash ||
      artifact.configHash !== slot.artifactRef.configHash
    ) {
      throw new DemoOrchestratorEngineError(
        DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.SLOT_ARTIFACT_MISSING,
        `Slot ${slot.slotId} artifact is absent from the in-memory Store.`
      );
    }
  }

  const traces = new OrchestratorTraceLedger();
  const audits = new OrchestratorAuditLedger();
  const runs = new InMemoryScenarioRunLedger();
  const createId = options.createId ?? (() => "demo");

  async function execute(request: ScenarioRunRequest): Promise<ScenarioRunResult> {
    const context = new ScenarioContextStore(
      request.input.value,
      document.slots.map((slot) => slot.slotId)
    );
    const primary = document.slots.find((slot) => slot.role === "primary");
    if (!primary) throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.BUNDLE_INVALID, "Primary Slot is missing.");
    context.writeNamespace(primary.inputNamespace, request.input.value);
    const stack = new ScenarioCallStack();
    const budget = new ExecutionBudget(request, {
      maxSlotInvocations: document.executionPolicy.budgets.maxSlotInvocations,
      maxRouteEvaluations: document.executionPolicy.budgets.maxRouteEvaluations,
      maxBindingApplications: document.executionPolicy.budgets.maxBindingApplications,
      timeoutMsPerSlot: Math.min(options.runtimeAdapter.descriptor.limits.maxTimeoutMs, 2_000)
    });
    const summaries: ScenarioSlotInvocationSummary[] = [];
    const base = {
      orchestratorRunId: request.orchestratorRunId,
      orchestratorId: document.orchestratorId,
      compositionId: options.compileResult.compositionId,
      planHash: options.compileResult.planHash,
      bundleHash: options.compileResult.compositionBundleHash,
      orchestratorHash: options.compileResult.orchestratorHash
    };
    const emit = (type: string, details: Record<string, string | number | boolean | undefined> = {}) =>
      traces.emit(base, type, details);
    emit("orchestrator.started", { executionModel: document.executionModel });

    let terminalId: ScenarioTerminalId | undefined;
    let status: ScenarioRunStatus | undefined;
    let terminalError: ScenarioRunResult["error"];
    let activeSlotId = primary.slotId;
    let lastPrimaryOutcome: string | undefined;
    let lastPrimaryOutput: unknown;

    const overlayDecision = (
      stage: "scenario_start" | "slot_before" | "route_before" | "terminal_before",
      activeSlot?: string,
      route?: string,
      auditAvailable?: boolean
    ) =>
      evaluateScenarioOverlays({
        overlays: document.overlayRefs,
        registry: options.overlayEvaluators,
        context: {
          stage,
          activeSlotId: activeSlot,
          routeId: route,
          scenarioInput: context.read("scenario.input"),
          adapterId: options.runtimeAdapter.descriptor.adapterId,
          adapterMode: options.runtimeAdapter.descriptor.publicExposure.mode,
          auditAvailable
        },
        onEvaluated: (overlayId, decision) =>
          emit("orchestrator.overlay.evaluated", { overlayId, stage, decision })
      });

    try {
      const startDecision = overlayDecision("scenario_start");
      if (startDecision === "deny") throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.OVERLAY_DENIED, "Scenario start was denied by an Overlay.");
      if (startDecision === "handoff") {
        terminalId = "$human_handoff";
        status = "handoff_required";
      }

      while (!terminalId) {
        const slot = document.slots.find((candidate) => candidate.slotId === activeSlotId);
        if (!slot) throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.BUNDLE_INVALID, "Active Slot is not declared.");
        const beforeDecision = overlayDecision("slot_before", slot.slotId);
        if (beforeDecision === "deny") throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.OVERLAY_DENIED, "Slot invocation was denied by an Overlay.");
        if (beforeDecision === "handoff") {
          terminalId = "$human_handoff";
          status = "handoff_required";
          break;
        }

        try {
          budget.consume("slotInvocations");
        } catch (error) {
          emit("orchestrator.budget.exhausted", { budget: "slotInvocations" });
          throw error;
        }
        const invocationIndex = budget.usage.slotInvocations;
        const invocationId = `${request.orchestratorRunId}-slot-${invocationIndex}-${createId()}`;
        const slotInput = context.read(slot.inputNamespace) ?? {};
        const invocationRequest: ScenarioSlotInvocationRequest = {
          schemaVersion: "1.0.0-preview",
          orchestratorRunId: request.orchestratorRunId,
          invocationId,
          invocationIndex,
          idempotencyKey: createSlotInvocationIdempotencyKey({
            orchestratorRunId: request.orchestratorRunId,
            invocationIndex,
            slotId: slot.slotId,
            agentArtifactHash: slot.artifactRef.agentArtifactHash,
            canonicalInputHash: createCanonicalInputHash(slotInput)
          }),
          orchestratorId: document.orchestratorId,
          compositionId: options.compileResult.compositionId,
          slotId: slot.slotId,
          archetypeId: slot.archetypeId,
          artifactRef: {
            agentArtifactPath: slot.artifactRef.agentArtifactPath,
            agentArtifactHash: slot.artifactRef.agentArtifactHash,
            configHash: slot.artifactRef.configHash
          },
          traceParent: {
            orchestratorRunId: request.orchestratorRunId,
            parentSequence: traces.list(request.orchestratorRunId).length,
            parentSpanId: `${request.orchestratorRunId}-parent-${invocationIndex}`
          },
          input: {
            namespace: slot.inputNamespace,
            value: slotInput,
            byteLength: jsonByteLength(slotInput),
            redactionApplied: true
          },
          budget: {
            timeoutMs: budget.limits.timeoutMsPerSlot,
            maxRuntimeSteps: 25
          },
          sideEffectPolicy: {
            maximumAllowedLevel: request.sideEffectPolicy.maximumAllowedLevel,
            requireExplicitDeclaration: true
          },
          retryPolicy: {
            orchestratorRetryAllowed: false,
            invocationAttempt: 1
          }
        };
        emit("orchestrator.slot.invocation.started", { slotId: slot.slotId, invocationIndex });
        let slotResult: ScenarioSlotInvocationResult;
        try {
          slotResult = await options.runtimeAdapter.invokeSlot(invocationRequest);
        } catch {
          emit("orchestrator.slot.invocation.failed", { slotId: slot.slotId, invocationIndex });
          throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.SLOT_FAILED, `Slot ${slot.slotId} failed closed.`);
        }
        if (slotResult.status === "failed" || slotResult.status === "timed_out" || slotResult.status === "cancelled") {
          emit("orchestrator.slot.invocation.failed", { slotId: slot.slotId, invocationIndex, runtimeStatus: slotResult.status });
          throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.SLOT_FAILED, `Slot ${slot.slotId} did not complete.`);
        }
        if (slotResult.auditReference.status !== "available") {
          throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.AUDIT_FAILED, `Slot ${slot.slotId} has no audit reference.`);
        }
        emit("orchestrator.slot.invocation.completed", {
          slotId: slot.slotId,
          invocationIndex,
          runtimeStatus: slotResult.status,
          runtimeRunId: slotResult.runtimeRunId
        });
        if (slotResult.output) context.writeNamespace(slot.outputNamespace, slotResult.output.value);

        const projection = evaluateSlotOutcomeProjection({
          contract: slot.outcomeProjection,
          evidence: slotResult.projectionEvidence
        });
        const summary: ScenarioSlotInvocationSummary = {
          invocationIndex,
          invocationId,
          slotId: slot.slotId,
          runtimeStatus: slotResult.projectionEvidence.runtimeStatus,
          ...(slotResult.projectionEvidence.runtimeFinalState
            ? { runtimeFinalState: slotResult.projectionEvidence.runtimeFinalState }
            : {}),
          ...(projection.outcome ? { semanticOutcome: projection.outcome } : {}),
          ...(projection.projectionId ? { projectionId: projection.projectionId } : {}),
          runtimeRunId: slotResult.runtimeRunId,
          traceReference: structuredClone(slotResult.traceReference),
          auditReference: structuredClone(slotResult.auditReference)
        };
        summaries.push(summary);
        if (!projection.matched || !projection.outcome) {
          throw new DemoOrchestratorEngineError(
            projection.failureCode === "ORCHESTRATOR_OUTCOME_PROJECTION_AMBIGUOUS"
              ? DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.PROJECTION_AMBIGUOUS
              : DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.PROJECTION_FAILED,
            `Slot ${slot.slotId} outcome projection failed closed.`
          );
        }
        if (slot.role === "primary") {
          lastPrimaryOutcome = projection.outcome;
          lastPrimaryOutput = slotResult.output?.value;
        }

        const routeContext = {
          scenarioInput: context.read("scenario.input"),
          activeSlotId: slot.slotId,
          semanticOutcome: projection.outcome,
          slotOutput: slotResult.output?.value,
          callerSlotId: stack.peek()?.callerSlotId,
          invocationIndex
        };
        let route: ScenarioOrchestratorRoute;
        try {
          route = resolveScenarioRoute({
            routes: document.routes,
            activeSlotId: slot.slotId,
            semanticOutcome: projection.outcome,
            registry: options.routeConditions,
            context: routeContext,
            onEvaluated: (candidate, matched) => {
              try {
                budget.consume("routeEvaluations");
              } catch (error) {
                emit("orchestrator.budget.exhausted", { budget: "routeEvaluations" });
                throw error;
              }
              emit("orchestrator.route.evaluated", { routeId: candidate.routeId, matched });
            }
          });
        } catch (error) {
          throw error;
        }
        const routeDecision = overlayDecision("route_before", slot.slotId, route.routeId, true);
        if (routeDecision === "deny") throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.OVERLAY_DENIED, "Route was denied by an Overlay.");
        if (routeDecision === "handoff") {
          terminalId = "$human_handoff";
          status = "handoff_required";
          break;
        }
        emit("orchestrator.route.selected", { routeId: route.routeId, effect: route.effect.type });

        if (route.effect.type === "invoke_slot") {
          const effect = route.effect;
          if (slot.role !== "primary") {
            throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.SUPPORTING_CALL_FORBIDDEN, "Supporting Slot cannot invoke another Supporting Slot.");
          }
          const target = document.slots.find((candidate) => candidate.slotId === effect.targetSlotId);
          if (!target || target.role !== "supporting" || !target.callableBySlotIds.includes(slot.slotId)) {
            throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.SUPPORTING_CALL_FORBIDDEN, "Route target is not an explicitly callable Supporting Slot.");
          }
          const resolveInput = options.slotInputResolvers[route.routeId];
          if (!resolveInput) throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.BINDING_TARGET_INVALID, `Route ${route.routeId} has no explicit Supporting input resolver.`);
          context.writeNamespace(target.inputNamespace, resolveInput({
            scenarioInput: context.read("scenario.input"),
            route,
            callerSlotId: slot.slotId,
            targetSlotId: target.slotId
          }));
          stack.push({
            callerSlotId: slot.slotId,
            calleeSlotId: target.slotId,
            invokedByRouteId: route.routeId,
            returnToSlotId: effect.returnToSlotId,
            invocationIndex
          });
          activeSlotId = target.slotId;
          continue;
        }
        if (route.effect.type === "resume_caller") {
          if (slot.role !== "supporting") throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.RESUME_WITHOUT_CALLER, "Primary Slot cannot resume a caller.");
          const frame = stack.peek();
          if (!frame || frame.calleeSlotId !== slot.slotId) throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.RESUME_WITHOUT_CALLER, "Supporting Slot has no matching caller frame.");
          try {
            applyIdentityBindings({
              bindings: document.bindings,
              fromSlotId: slot.slotId,
              toSlotId: frame.returnToSlotId,
              slotOutput: outputPayload(slotResult),
              context,
              consume: () => {
                try {
                  budget.consume("bindingApplications");
                } catch (error) {
                  emit("orchestrator.budget.exhausted", { budget: "bindingApplications" });
                  throw error;
                }
              },
              onApplied: (bindingId) => emit("orchestrator.binding.applied", { bindingId })
            });
          } catch (error) {
            emit("orchestrator.binding.failed", { slotId: slot.slotId });
            throw error;
          }
          stack.pop();
          activeSlotId = frame.returnToSlotId;
          continue;
        }
        if (route.effect.type === "terminate") {
          if (slot.role !== "primary" || route.effect.terminalId !== "$scenario_done" || stack.depth !== 0) {
            throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.OUTPUT_INVALID, "Only an unstacked Primary Slot may complete the Scenario.");
          }
          const terminalDecision = overlayDecision("terminal_before", slot.slotId, route.routeId, true);
          if (terminalDecision === "deny") throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.OVERLAY_DENIED, "Scenario completion was denied by an Overlay.");
          if (terminalDecision === "handoff") {
            terminalId = "$human_handoff";
            status = "handoff_required";
          } else {
            terminalId = "$scenario_done";
            status = "completed";
          }
          break;
        }
        if (route.effect.type === "request_handoff") {
          terminalId = "$human_handoff";
          status = "handoff_required";
          break;
        }
        terminalId = "$fail_closed";
        status = "failed";
        terminalError = {
          code: DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.SLOT_FAILED,
          safeMessage: "An explicit fail-closed Route terminated the Scenario.",
          retryable: false
        };
      }
    } catch (error) {
      terminalId = "$fail_closed";
      status = "failed";
      terminalError = resultError(error);
    }

    if (status === "handoff_required") emit("orchestrator.handoff.requested", { terminalId: "$human_handoff" });
    else if (status === "completed") emit("orchestrator.completed", { terminalId: "$scenario_done" });
    else emit("orchestrator.failed", { terminalId: "$fail_closed", errorCode: terminalError?.code });

    const events = traces.list(request.orchestratorRunId);
    const traceSummary = {
      eventCount: events.length,
      firstSequence: events[0]?.sequence ?? 0,
      lastSequence: events.at(-1)?.sequence ?? 0,
      terminalEventType: events.at(-1)?.type ?? "orchestrator.failed"
    };
    const scenarioOutput =
      status === "completed"
        ? {
            namespace: "scenario.output" as const,
            value: {
              primarySlotId: primary.slotId,
              semanticOutcome: lastPrimaryOutcome,
              completedByExplicitTerminal: true,
              primaryOutputAvailable: lastPrimaryOutput !== undefined
            },
            byteLength: 0,
            redactionApplied: true as const
          }
        : undefined;
    if (scenarioOutput) {
      scenarioOutput.byteLength = jsonByteLength(scenarioOutput.value);
      context.writeNamespace("scenario.output", scenarioOutput.value);
    }
    const result: ScenarioRunResult = {
      schemaVersion: "1.0.0-preview",
      orchestratorRunId: request.orchestratorRunId,
      orchestratorId: document.orchestratorId,
      compositionId: options.compileResult.compositionId,
      status: status ?? "failed",
      terminalId: terminalId ?? "$fail_closed",
      scenarioCompleted: status === "completed",
      ...(scenarioOutput ? { output: scenarioOutput } : {}),
      ...(terminalError ? { error: terminalError } : {}),
      slotInvocations: summaries,
      traceSummary,
      auditReference: {
        orchestratorRunId: request.orchestratorRunId,
        status: "available",
        redacted: true
      },
      budgetUsage: structuredClone(budget.usage)
    };
    const audit: OrchestratorAuditSummary = {
      orchestratorRunId: request.orchestratorRunId,
      orchestratorId: document.orchestratorId,
      compositionId: options.compileResult.compositionId,
      status: result.status,
      terminalId: result.terminalId,
      redacted: true,
      planHash: options.compileResult.planHash,
      bundleHash: options.compileResult.compositionBundleHash,
      orchestratorHash: options.compileResult.orchestratorHash,
      slotInvocationReferences: summaries.map((summary) => ({
        slotId: summary.slotId,
        ...(summary.runtimeRunId ? { runtimeRunId: summary.runtimeRunId } : {})
      })),
      projectionSummaries: summaries.map((summary) => ({
        slotId: summary.slotId,
        ...(summary.semanticOutcome ? { semanticOutcome: summary.semanticOutcome } : {}),
        ...(summary.projectionId ? { projectionId: summary.projectionId } : {})
      })),
      traceSummary,
      budgetUsage: structuredClone(budget.usage),
      sideEffectSummary: { externalEffectsOccurred: false }
    };
    audits.record(audit);
    return result;
  }

  return {
    document: structuredClone(document),
    runScenario(input) {
      const request = validateScenarioRunRequest(input, {
        orchestratorId: options.compileResult.orchestratorId,
        compositionId: options.compileResult.compositionId,
        previewBundleHash: options.compileResult.previewBundleHash
      });
      return runs.execute(request, () => execute(request));
    },
    trace(runId) { return traces.list(runId); },
    audit(runId) { return audits.get(runId); }
  };
}
