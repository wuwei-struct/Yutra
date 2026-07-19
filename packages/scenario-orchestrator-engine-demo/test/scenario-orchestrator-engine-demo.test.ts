import { describe, expect, it } from "vitest";
import {
  BUILTIN_DEMO_ROUTE_CONDITIONS,
  createBuiltinDemoEngineOptions,
  createBuiltinScenarioRunRequest,
  createInMemoryScenarioOrchestratorEngine,
  type BuiltinDemoCompositionId,
  type EngineOptions
} from "../src/index";

function setup(compositionId: BuiltinDemoCompositionId, mutate?: (options: EngineOptions) => void) {
  const options = createBuiltinDemoEngineOptions(compositionId);
  mutate?.(options);
  const engine = createInMemoryScenarioOrchestratorEngine(options);
  return { engine, options };
}

function request(
  options: EngineOptions,
  runId: string,
  value: Record<string, unknown>,
  budget?: Parameters<typeof createBuiltinScenarioRunRequest>[0]["budget"]
) {
  return createBuiltinScenarioRunRequest({
    compileResult: options.compileResult,
    orchestratorRunId: runId,
    value,
    ...(budget ? { budget } : {})
  });
}

describe("in-memory Scenario Orchestrator Engine", () => {
  it.each([
    ["customer-complaint-composition-demo", "policy_explanation", ["complaint_resolution", "policy_explanation", "complaint_resolution"]],
    ["customer-complaint-composition-demo", "compensation", ["complaint_resolution", "compensation_decision", "complaint_resolution"]],
    ["ecommerce-refund-composition-demo", "authorization", ["refund_resolution", "refund_authorization", "refund_resolution"]]
  ] as const)("completes %s path %s through explicit call-return", async (compositionId, demoPath, expectedSlots) => {
    const { engine, options } = setup(compositionId);
    const result = await engine.runScenario(request(options, `${compositionId}-${demoPath}`, { demoPath }));
    expect(result.status).toBe("completed");
    expect(result.terminalId).toBe("$scenario_done");
    expect(result.scenarioCompleted).toBe(true);
    expect(result.output?.namespace).toBe("scenario.output");
    expect(result.slotInvocations.map((item) => item.slotId)).toEqual(expectedSlots);
    expect(result.slotInvocations.at(-1)?.semanticOutcome).toBe("primary_acceptance_satisfied");
    expect(result.slotInvocations.every((item) => item.runtimeFinalState === "done")).toBe(true);
    expect(result.slotInvocations.some((item) => item.semanticOutcome !== item.runtimeFinalState)).toBe(true);
    expect(result.budgetUsage.bindingApplications).toBe(1);
    const events = engine.trace(result.orchestratorRunId);
    expect(events.map((event) => event.type)).toEqual(expect.arrayContaining([
      "orchestrator.started",
      "orchestrator.slot.invocation.started",
      "orchestrator.slot.invocation.completed",
      "orchestrator.route.evaluated",
      "orchestrator.route.selected",
      "orchestrator.binding.applied",
      "orchestrator.completed"
    ]));
    expect(events.map((event) => event.sequence)).toEqual(events.map((_, index) => index + 1));
    expect(events.every((event) =>
      !Object.prototype.hasOwnProperty.call(event.details, "input") &&
      !Object.prototype.hasOwnProperty.call(event.details, "output")
    )).toBe(true);
    expect(engine.audit(result.orchestratorRunId)).toMatchObject({
      status: "completed",
      terminalId: "$scenario_done",
      redacted: true,
      sideEffectSummary: { externalEffectsOccurred: false }
    });
  });

  it.each([
    "customer-complaint-composition-demo",
    "ecommerce-refund-composition-demo"
  ] as const)("terminates %s handoff without Scenario completion", async (compositionId) => {
    const { engine, options } = setup(compositionId);
    const result = await engine.runScenario(request(options, `${compositionId}-handoff`, {
      demoPath: "handoff",
      requires_handoff: true
    }));
    expect(result.status).toBe("handoff_required");
    expect(result.terminalId).toBe("$human_handoff");
    expect(result.scenarioCompleted).toBe(false);
    expect(result.output).toBeUndefined();
    expect(engine.trace(result.orchestratorRunId).at(-1)?.type).toBe("orchestrator.handoff.requested");
  });

  it("fails closed for an unknown explicit condition and never uses finalState", async () => {
    const { engine, options } = setup("customer-complaint-composition-demo", (engineOptions) => {
      engineOptions.routeConditions = {};
    });
    const result = await engine.runScenario(request(options, "unknown-condition", { demoPath: "policy_explanation" }));
    expect(result).toMatchObject({
      status: "failed",
      terminalId: "$fail_closed",
      scenarioCompleted: false,
      error: { code: "DEMO_ORCHESTRATOR_ENGINE_CONDITION_UNKNOWN" }
    });
    expect(engine.trace(result.orchestratorRunId).at(-1)?.type).toBe("orchestrator.failed");
  });

  it("fails closed when semantic projection evidence is absent", async () => {
    const options = createBuiltinDemoEngineOptions("customer-complaint-composition-demo");
    const delegate = options.runtimeAdapter;
    options.runtimeAdapter = {
      descriptor: delegate.descriptor,
      inspectCompatibility: (input) => delegate.inspectCompatibility(input),
      invokeSlot: async (input) => {
        const result = await delegate.invokeSlot(input);
        return {
          ...result,
          projectionEvidence: { ...result.projectionEvidence, outputMarkers: {} }
        };
      }
    };
    const engine = createInMemoryScenarioOrchestratorEngine(options);
    const result = await engine.runScenario(request(options, "projection-missing", { demoPath: "policy_explanation" }));
    expect(result.error?.code).toBe("DEMO_ORCHESTRATOR_ENGINE_PROJECTION_FAILED");
    expect(result.terminalId).toBe("$fail_closed");
  });

  it("applies deny Overlay before any Slot invocation", async () => {
    const { engine, options } = setup("customer-complaint-composition-demo");
    const result = await engine.runScenario(request(options, "overlay-deny", {
      denyOverlay: "complaint_policy_guard"
    }));
    expect(result.status).toBe("failed");
    expect(result.budgetUsage.slotInvocations).toBe(0);
    expect(result.error?.code).toBe("DEMO_ORCHESTRATOR_ENGINE_OVERLAY_DENIED");
  });

  it("honors route and binding budgets without widening contract limits", async () => {
    const { engine, options } = setup("customer-complaint-composition-demo");
    const result = await engine.runScenario(request(options, "binding-budget", { demoPath: "policy_explanation" }, {
      maxBindingApplications: 0,
      maxSlotInvocations: 99,
      maxRouteEvaluations: 99,
      timeoutMsPerSlot: 99_999
    }));
    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe("DEMO_ORCHESTRATOR_ENGINE_BUDGET_EXHAUSTED");
    expect(engine.trace(result.orchestratorRunId).some((event) => event.type === "orchestrator.budget.exhausted")).toBe(true);
  });

  it("replays a Scenario idempotently without new Slot invocations", async () => {
    const { engine, options } = setup("ecommerce-refund-composition-demo");
    const runRequest = request(options, "scenario-replay", { demoPath: "authorization" });
    const [first, second] = await Promise.all([
      engine.runScenario(runRequest),
      engine.runScenario(structuredClone(runRequest))
    ]);
    expect(second).toEqual(first);
    expect(engine.trace(runRequest.orchestratorRunId).filter((event) => event.type === "orchestrator.started")).toHaveLength(1);
  });

  it("rejects the same idempotency key for a different request", async () => {
    const { engine, options } = setup("customer-complaint-composition-demo");
    const first = request(options, "scenario-conflict-a", { demoPath: "policy_explanation" });
    const second = request(options, "scenario-conflict-b", { demoPath: "compensation" });
    second.idempotencyKey = first.idempotencyKey;
    await engine.runScenario(first);
    expect(() => engine.runScenario(second)).toThrowError(expect.objectContaining({
      code: "DEMO_ORCHESTRATOR_ENGINE_IDEMPOTENCY_CONFLICT"
    }));
  });

  it("strictly rejects unknown request fields", async () => {
    const { engine, options } = setup("customer-complaint-composition-demo");
    const invalid = { ...request(options, "invalid-request", {}), route: "injected" };
    expect(() => engine.runScenario(invalid as never)).toThrowError(expect.objectContaining({
      code: "DEMO_ORCHESTRATOR_ENGINE_INPUT_INVALID"
    }));
  });

  it("has exact canonical condition evaluators without a universal fallback", () => {
    expect(BUILTIN_DEMO_ROUTE_CONDITIONS.unknown).toBeUndefined();
    expect(BUILTIN_DEMO_ROUTE_CONDITIONS.primary_acceptance_satisfied?.({
      scenarioInput: {},
      activeSlotId: "primary",
      semanticOutcome: "different",
      slotOutput: {},
      invocationIndex: 1
    })).toBe(false);
  });
});
