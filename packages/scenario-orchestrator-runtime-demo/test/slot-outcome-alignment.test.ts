import { evaluateSlotOutcomeProjection } from "@yutra/scenario-orchestrator-core";
import { describe, expect, it } from "vitest";
import {
  DEMO_RUNTIME_ERROR_CODES,
  EXPLICIT_DEMO_ACTION_REGISTRY,
  EXPLICIT_DEMO_SIDE_EFFECT_LEVELS,
  createInMemoryScenarioRuntimeAdapter,
  resolveExplicitDemoSideEffect
} from "../src/index";
import {
  customerComplaintFixture,
  ecommerceRefundFixture,
  invocationRequest,
  registerCompiledSlots
} from "./fixtures/compiled-slot-fixtures";

function adapter(
  result: ReturnType<typeof customerComplaintFixture>,
  options: {
    actionRegistry?: typeof EXPLICIT_DEMO_ACTION_REGISTRY;
    resolveSideEffectLevel?: typeof resolveExplicitDemoSideEffect;
  } = {}
) {
  return createInMemoryScenarioRuntimeAdapter({
    artifactStore: registerCompiledSlots(result),
    actionRegistry: options.actionRegistry ?? EXPLICIT_DEMO_ACTION_REGISTRY,
    resolveSideEffectLevel:
      options.resolveSideEffectLevel ?? resolveExplicitDemoSideEffect
  });
}

async function project(input: {
  result: ReturnType<typeof customerComplaintFixture>;
  slotId: string;
  value?: Record<string, unknown>;
  invocationIndex?: number;
}) {
  const runtimeResult = await adapter(input.result).invokeSlot(
    invocationRequest(input)
  );
  const slot = input.result.orchestratorDocument.slots.find(
    (candidate) => candidate.slotId === input.slotId
  );
  if (!slot) throw new Error(`Missing Slot ${input.slotId}.`);
  return {
    runtimeResult,
    projection: evaluateSlotOutcomeProjection({
      contract: slot.outcomeProjection,
      evidence: runtimeResult.projectionEvidence
    }),
    candidateRoutes: input.result.orchestratorDocument.routes.filter(
      (route) =>
        route.fromSlotId === input.slotId &&
        route.outcome ===
          evaluateSlotOutcomeProjection({
            contract: slot.outcomeProjection,
            evidence: runtimeResult.projectionEvidence
          }).outcome
    )
  };
}

describe("canonical Slot outcome alignment", () => {
  const customerCases = [
    {
      slotId: "complaint_resolution",
      value: { demoPath: "policy_explanation" },
      outcome: "policy_clarification_required"
    },
    {
      slotId: "complaint_resolution",
      value: { demoPath: "compensation" },
      outcome: "compensation_approval_required"
    },
    {
      slotId: "complaint_resolution",
      value: { requires_handoff: true, demoPath: "handoff" },
      outcome: "human_review_required"
    },
    {
      slotId: "complaint_resolution",
      value: { supporting: { policyExplanation: "demo_available" } },
      outcome: "primary_acceptance_satisfied"
    },
    {
      slotId: "policy_explanation",
      value: {},
      outcome: "policy_explanation_available"
    },
    {
      slotId: "compensation_decision",
      value: undefined,
      outcome: "authorization_decision_available"
    }
  ];

  it.each(customerCases)(
    "projects customer complaint $slotId to $outcome",
    async ({ slotId, value, outcome }) => {
      const result = await project({
        result: customerComplaintFixture(),
        slotId,
        ...(value ? { value } : {}),
        invocationIndex: 1
      });
      expect(result.projection).toMatchObject({
        matched: true,
        outcome,
        fallbackApplied: false
      });
      expect(result.candidateRoutes.length).toBeGreaterThan(0);
      expect(result.runtimeResult.outcome).toBe(
        result.runtimeResult.projectionEvidence.runtimeFinalState
      );
      expect(result.runtimeResult.outcome).not.toBe(outcome);
    }
  );

  const refundCases = [
    {
      value: { demoPath: "authorization" },
      outcome: "authorization_required"
    },
    {
      value: { requires_handoff: true, demoPath: "handoff" },
      outcome: "human_review_required"
    },
    {
      value: { supporting: { authorizationDecision: "demo_available" } },
      outcome: "primary_acceptance_satisfied"
    }
  ];

  it.each(refundCases)(
    "projects refund_resolution to $outcome",
    async ({ value, outcome }) => {
      const result = await project({
        result: ecommerceRefundFixture(),
        slotId: "refund_resolution",
        value,
        invocationIndex: 1
      });
      expect(result.projection.outcome).toBe(outcome);
      expect(result.candidateRoutes.length).toBeGreaterThan(0);
    }
  );

  it("projects refund_authorization explicitly", async () => {
    const result = await project({
      result: ecommerceRefundFixture(),
      slotId: "refund_authorization"
    });
    expect(result.projection.outcome).toBe("authorization_decision_available");
    expect(result.candidateRoutes.length).toBeGreaterThan(0);
  });

  it("returns allowlisted evidence rather than a Scenario outcome", async () => {
    const result = await project({
      result: customerComplaintFixture(),
      slotId: "policy_explanation"
    });
    expect(result.runtimeResult.projectionEvidence).toEqual({
      runtimeStatus: "completed",
      runtimeFinalState: "done",
      outputMarkers: {
        "slotResult.semanticMarker": "policy_explanation_available"
      }
    });
    expect(result.runtimeResult.outcome).toBe("done");
  });
});

describe("classification coverage and actual dispatch enforcement", () => {
  it("does not block a low-risk path for an unexecuted external Action", async () => {
    const result = customerComplaintFixture();
    const output = await adapter(result, {
      resolveSideEffectLevel: (actionId) =>
        actionId === "escalate_human"
          ? "external"
          : EXPLICIT_DEMO_SIDE_EFFECT_LEVELS[actionId]
    }).invokeSlot(
      invocationRequest({
        result,
        slotId: "complaint_resolution",
        value: { demoPath: "policy_explanation" },
        maximumAllowedLevel: "read"
      })
    );
    expect(output.status).toBe("completed");
    expect(output.sideEffectSummary.externalEffectsOccurred).toBe(false);
  });

  it("blocks an actually dispatched external Action before its handler", async () => {
    const result = customerComplaintFixture();
    let handlerInvocationCount = 0;
    const actionRegistry = {
      ...EXPLICIT_DEMO_ACTION_REGISTRY,
      classify_request: async (...args: Parameters<typeof EXPLICIT_DEMO_ACTION_REGISTRY.classify_request>) => {
        handlerInvocationCount += 1;
        return EXPLICIT_DEMO_ACTION_REGISTRY.classify_request(...args);
      }
    };
    await expect(
      adapter(result, {
        actionRegistry,
        resolveSideEffectLevel: (actionId) =>
          actionId === "classify_request"
            ? "external"
            : EXPLICIT_DEMO_SIDE_EFFECT_LEVELS[actionId]
      }).invokeSlot(
        invocationRequest({
          result,
          slotId: "complaint_resolution",
          maximumAllowedLevel: "read"
        })
      )
    ).rejects.toMatchObject({
      code: DEMO_RUNTIME_ERROR_CODES.SIDE_EFFECT_LEVEL_EXCEEDED
    });
    expect(handlerInvocationCount).toBe(0);
  });

  it("keeps demo handoff as a control signal with no external effect", async () => {
    const result = customerComplaintFixture();
    const output = await adapter(result).invokeSlot(
      invocationRequest({
        result,
        slotId: "complaint_resolution",
        value: { requires_handoff: true },
        maximumAllowedLevel: "read"
      })
    );
    expect(output.projectionEvidence.controlSignal).toBe("handoff_required");
    expect(output.sideEffectSummary.externalEffectsOccurred).toBe(false);
  });

  it("keeps demo fail-closed as a control signal with no external effect", async () => {
    const result = customerComplaintFixture();
    const output = await adapter(result).invokeSlot(
      invocationRequest({
        result,
        slotId: "policy_explanation",
        value: { knowledge_hit: false },
        maximumAllowedLevel: "read"
      })
    );
    expect(output.projectionEvidence.controlSignal).toBe("fail_closed");
    expect(output.sideEffectSummary.externalEffectsOccurred).toBe(false);
  });
});
