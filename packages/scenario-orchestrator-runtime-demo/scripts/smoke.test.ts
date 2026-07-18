import { describe, expect, it } from "vitest";
import {
  createInMemoryScenarioRuntimeAdapter
} from "../src/index";
import {
  EXPLICIT_DEMO_ACTION_REGISTRY,
  resolveExplicitDemoSideEffect
} from "../test/fixtures/explicit-demo-action-registry";
import {
  customerComplaintFixture,
  ecommerceRefundFixture,
  invocationRequest,
  registerCompiledSlots
} from "../test/fixtures/compiled-slot-fixtures";

describe("in-memory Scenario Slot Runtime Adapter smoke", () => {
  it("runs five canonical Slots independently without Scenario routing", async () => {
    const summaries: Array<Record<string, unknown>> = [];
    for (const fixture of [
      {
        result: customerComplaintFixture(),
        slots: [
          "complaint_resolution",
          "policy_explanation",
          "compensation_decision"
        ]
      },
      {
        result: ecommerceRefundFixture(),
        slots: ["refund_resolution", "refund_authorization"]
      }
    ]) {
      const adapter = createInMemoryScenarioRuntimeAdapter({
        artifactStore: registerCompiledSlots(fixture.result),
        actionRegistry: EXPLICIT_DEMO_ACTION_REGISTRY,
        resolveSideEffectLevel: resolveExplicitDemoSideEffect
      });
      for (const [index, slotId] of fixture.slots.entries()) {
        const request = invocationRequest({
          result: fixture.result,
          slotId,
          invocationIndex: index + 1
        });
        const first = await adapter.invokeSlot(request);
        const replay = await adapter.invokeSlot(structuredClone(request));
        expect(first.status).toBe("completed");
        expect(replay.runtimeRunId).toBe(first.runtimeRunId);
        expect(
          adapter.invocationLedger.get(request.idempotencyKey)
            ?.runtimeInvocationCount
        ).toBe(1);
        expect(adapter.traceParentLedger.get(request.invocationId)).toBeTruthy();
        expect(adapter.auditLedger.get(request.invocationId)?.redacted).toBe(
          true
        );
        summaries.push({
          compositionId: fixture.result.compositionId,
          slotId,
          status: first.status,
          namespace: first.output?.namespace,
          idempotencyReplay: true,
          scenarioCompleted: false,
          routeSelected: false,
          bindingApplied: false
        });
      }
    }
    console.log(JSON.stringify({ ok: true, slots: summaries }));
    expect(summaries).toHaveLength(5);
  });
});
