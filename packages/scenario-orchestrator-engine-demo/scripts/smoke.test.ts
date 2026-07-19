import { describe, expect, it } from "vitest";
import {
  createBuiltinDemoEngineOptions,
  createBuiltinScenarioRunRequest,
  createInMemoryScenarioOrchestratorEngine,
  type BuiltinDemoCompositionId
} from "../src/index";

describe("in-memory Scenario Engine smoke", () => {
  it("runs completed, handoff, fail-closed, and replay paths", async () => {
    const cases: Array<{
      compositionId: BuiltinDemoCompositionId;
      name: string;
      value: Record<string, unknown>;
    }> = [
      { compositionId: "customer-complaint-composition-demo", name: "policy", value: { demoPath: "policy_explanation" } },
      { compositionId: "customer-complaint-composition-demo", name: "compensation", value: { demoPath: "compensation" } },
      { compositionId: "ecommerce-refund-composition-demo", name: "refund", value: { demoPath: "authorization" } },
      { compositionId: "customer-complaint-composition-demo", name: "handoff", value: { requires_handoff: true } },
      { compositionId: "customer-complaint-composition-demo", name: "fail-closed", value: { denyOverlay: "complaint_policy_guard" } }
    ];
    const summaries: Array<Record<string, unknown>> = [];
    for (const item of cases) {
      const options = createBuiltinDemoEngineOptions(item.compositionId);
      const engine = createInMemoryScenarioOrchestratorEngine(options);
      const request = createBuiltinScenarioRunRequest({
        compileResult: options.compileResult,
        orchestratorRunId: `smoke-${item.name}`,
        value: item.value
      });
      const first = await engine.runScenario(request);
      const replay = await engine.runScenario(structuredClone(request));
      expect(replay).toEqual(first);
      const audit = engine.audit(first.orchestratorRunId);
      expect(audit?.sideEffectSummary.externalEffectsOccurred).toBe(false);
      summaries.push({
        orchestratorRunId: first.orchestratorRunId,
        status: first.status,
        terminalId: first.terminalId,
        scenarioCompleted: first.scenarioCompleted,
        slotInvocationCount: first.slotInvocations.length,
        projectedOutcomes: first.slotInvocations.map((slot) => slot.semanticOutcome),
        traceEventCount: first.traceSummary.eventCount,
        budgetUsage: first.budgetUsage,
        externalEffectsOccurred: false
      });
    }
    console.log(JSON.stringify({ ok: true, scenarios: summaries }));
    expect(summaries).toHaveLength(5);
  });
});
