import { evaluateSlotOutcomeProjection } from "@yutra/scenario-orchestrator-core";
import { describe, expect, it } from "vitest";
import {
  createInMemoryScenarioRuntimeAdapter,
  EXPLICIT_DEMO_ACTION_REGISTRY,
  resolveExplicitDemoSideEffect
} from "../src/index";
import {
  customerComplaintFixture,
  ecommerceRefundFixture,
  invocationRequest,
  registerCompiledSlots
} from "../test/fixtures/compiled-slot-fixtures";

describe("Slot outcome projection and side-effect alignment smoke", () => {
  it("projects five canonical Slot results without routing or bindings", async () => {
    const customer = customerComplaintFixture();
    const refund = ecommerceRefundFixture();
    const cases = [
      { result: customer, slotId: "complaint_resolution", value: { demoPath: "policy_explanation" } },
      { result: customer, slotId: "policy_explanation", value: {} },
      { result: customer, slotId: "compensation_decision", value: undefined },
      { result: refund, slotId: "refund_resolution", value: { demoPath: "authorization" } },
      { result: refund, slotId: "refund_authorization", value: undefined }
    ];
    const adapters = new Map([
      [
        customer.compositionId,
        createInMemoryScenarioRuntimeAdapter({
          artifactStore: registerCompiledSlots(customer),
          actionRegistry: EXPLICIT_DEMO_ACTION_REGISTRY,
          resolveSideEffectLevel: resolveExplicitDemoSideEffect
        })
      ],
      [
        refund.compositionId,
        createInMemoryScenarioRuntimeAdapter({
          artifactStore: registerCompiledSlots(refund),
          actionRegistry: EXPLICIT_DEMO_ACTION_REGISTRY,
          resolveSideEffectLevel: resolveExplicitDemoSideEffect
        })
      ]
    ]);
    const summaries: Array<Record<string, unknown>> = [];

    for (const [index, item] of cases.entries()) {
      const adapter = adapters.get(item.result.compositionId);
      const slot = item.result.orchestratorDocument.slots.find(
        (candidate) => candidate.slotId === item.slotId
      );
      if (!adapter || !slot) throw new Error(`Missing alignment fixture ${item.slotId}.`);
      const result = await adapter.invokeSlot(
        invocationRequest({
          result: item.result,
          slotId: item.slotId,
          invocationIndex: index + 1,
          ...(item.value ? { value: item.value } : {})
        })
      );
      const projection = evaluateSlotOutcomeProjection({
        contract: slot.outcomeProjection,
        evidence: result.projectionEvidence
      });
      const candidateRouteCount = item.result.orchestratorDocument.routes.filter(
        (route) => route.fromSlotId === item.slotId && route.outcome === projection.outcome
      ).length;

      expect(projection.matched).toBe(true);
      expect(slot.acceptedOutcomes).toContain(projection.outcome);
      expect(candidateRouteCount).toBeGreaterThan(0);
      expect(result.sideEffectSummary.externalEffectsOccurred).toBe(false);
      summaries.push({
        slotId: item.slotId,
        runtimeStatus: result.projectionEvidence.runtimeStatus,
        runtimeFinalState: result.projectionEvidence.runtimeFinalState,
        semanticMarker:
          result.projectionEvidence.outputMarkers["slotResult.semanticMarker"],
        projectedOutcome: projection.outcome,
        matchedProjectionId: projection.projectionId,
        candidateRouteCount,
        externalEffectsOccurred: result.sideEffectSummary.externalEffectsOccurred,
        routeExecuted: false,
        bindingApplied: false,
        scenarioCompleted: false
      });
    }

    console.log(JSON.stringify({ ok: true, slots: summaries }));
    expect(summaries).toHaveLength(5);
  });
});
