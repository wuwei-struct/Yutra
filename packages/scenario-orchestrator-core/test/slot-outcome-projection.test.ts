import { describe, expect, it } from "vitest";
import {
  CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT,
  evaluateSlotOutcomeProjection,
  validateSlotOutcomeProjectionContract,
  type SlotOutcomeProjectionContract,
  type SlotOutcomeProjectionEvidence
} from "../src/index";

const slot = CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT.slots.find(
  (candidate) => candidate.slotId === "complaint_resolution"
);
if (!slot) throw new Error("Missing complaint_resolution fixture.");

function evidence(marker?: string): SlotOutcomeProjectionEvidence {
  return {
    runtimeStatus: "completed",
    runtimeFinalState: "done",
    outputMarkers: marker ? { "slotResult.semanticMarker": marker } : {}
  };
}

describe("Slot Outcome Projection Contract", () => {
  it("covers every accepted outcome exactly", () => {
    expect(
      validateSlotOutcomeProjectionContract({
        contract: slot.outcomeProjection,
        slotId: slot.slotId,
        acceptedOutcomes: slot.acceptedOutcomes
      })
    ).toEqual([]);
  });

  it("rejects missing and extra outcomes", () => {
    const missing = structuredClone(slot.outcomeProjection);
    missing.rules.pop();
    expect(
      validateSlotOutcomeProjectionContract({
        contract: missing,
        slotId: slot.slotId,
        acceptedOutcomes: slot.acceptedOutcomes
      }).map((issue) => issue.code)
    ).toContain("ORCHESTRATOR_OUTCOME_PROJECTION_INCOMPLETE");

    const extra = structuredClone(slot.outcomeProjection);
    extra.rules.push({
      projectionId: "complaint_resolution.extra",
      priority: 100,
      all: [
        {
          source: "output_path",
          path: "slotResult.semanticMarker",
          operator: "equals",
          value: "extra"
        }
      ],
      outcome: "extra"
    });
    expect(
      validateSlotOutcomeProjectionContract({
        contract: extra,
        slotId: slot.slotId,
        acceptedOutcomes: slot.acceptedOutcomes
      }).map((issue) => issue.code)
    ).toContain("ORCHESTRATOR_OUTCOME_PROJECTION_EXTRA");
  });

  it("rejects duplicate priorities and unsafe output paths", () => {
    const duplicate = structuredClone(slot.outcomeProjection);
    duplicate.rules[1]!.priority = duplicate.rules[0]!.priority;
    expect(
      validateSlotOutcomeProjectionContract({
        contract: duplicate,
        slotId: slot.slotId,
        acceptedOutcomes: slot.acceptedOutcomes
      }).map((issue) => issue.code)
    ).toContain("ORCHESTRATOR_OUTCOME_PROJECTION_PRIORITY_CONFLICT");

    const unsafe = structuredClone(slot.outcomeProjection);
    const outputCondition = unsafe.rules[0]!.all.find(
      (condition) => condition.source === "output_path"
    );
    if (!outputCondition || outputCondition.source !== "output_path") {
      throw new Error("Missing output path condition.");
    }
    outputCondition.path = "slotResult.__proto__.semanticMarker";
    expect(
      validateSlotOutcomeProjectionContract({
        contract: unsafe,
        slotId: slot.slotId,
        acceptedOutcomes: slot.acceptedOutcomes
      }).map((issue) => issue.code)
    ).toContain("ORCHESTRATOR_OUTCOME_PROJECTION_PATH_UNSAFE");
  });

  it("does not derive multiple semantic outcomes from finalState=done", () => {
    const contract: SlotOutcomeProjectionContract = {
      slotId: "demo",
      rules: ["one", "two"].map((outcome, index) => ({
        projectionId: `demo.${outcome}`,
        priority: index + 1,
        all: [
          {
            source: "runtime_final_state",
            operator: "equals",
            value: "done"
          }
        ],
        outcome
      })),
      fallback: "fail_closed"
    };
    expect(
      validateSlotOutcomeProjectionContract({
        contract,
        slotId: "demo",
        acceptedOutcomes: ["one", "two"]
      }).map((issue) => issue.code)
    ).toContain("ORCHESTRATOR_OUTCOME_PROJECTION_AMBIGUOUS");
  });

  it("projects an explicit semantic marker deterministically", () => {
    const input = {
      contract: slot.outcomeProjection,
      evidence: evidence("policy_clarification_required")
    };
    const first = evaluateSlotOutcomeProjection(input);
    const second = evaluateSlotOutcomeProjection(structuredClone(input));
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      matched: true,
      outcome: "policy_clarification_required",
      fallbackApplied: false
    });
  });

  it("fails closed for missing and unknown markers", () => {
    expect(
      evaluateSlotOutcomeProjection({
        contract: slot.outcomeProjection,
        evidence: evidence()
      }).failureCode
    ).toBe("ORCHESTRATOR_OUTCOME_PROJECTION_NO_MATCH");
    expect(
      evaluateSlotOutcomeProjection({
        contract: slot.outcomeProjection,
        evidence: evidence("unknown_marker")
      }).failureCode
    ).toBe("ORCHESTRATOR_OUTCOME_PROJECTION_MARKER_UNKNOWN");
  });

  it("fails closed when malformed same-priority rules are ambiguous", () => {
    const ambiguous: SlotOutcomeProjectionContract = {
      slotId: "demo",
      rules: ["one", "two"].map((outcome) => ({
        projectionId: `demo.${outcome}`,
        priority: 10,
        all: [
          {
            source: "runtime_status",
            operator: "equals",
            value: "completed"
          }
        ],
        outcome
      })),
      fallback: "fail_closed"
    };
    expect(
      evaluateSlotOutcomeProjection({
        contract: ambiguous,
        evidence: evidence()
      }).failureCode
    ).toBe("ORCHESTRATOR_OUTCOME_PROJECTION_AMBIGUOUS");
  });
});
