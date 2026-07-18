import {
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  ECOMMERCE_REFUND_COMPOSITION_DEMO
} from "@yutra/scenario-composition-core";
import { describe, expect, it } from "vitest";
import {
  CUSTOMER_COMPLAINT_ORCHESTRATOR_PROFILE,
  ECOMMERCE_REFUND_ORCHESTRATOR_PROFILE,
  compileScenarioOrchestratorPreview,
  validateScenarioOrchestratorCompileProfile
} from "../src/index";

describe("Orchestrator Compile Profile outcome projection", () => {
  it("covers all five canonical Slots and all accepted outcomes", () => {
    const slots = [
      ...CUSTOMER_COMPLAINT_ORCHESTRATOR_PROFILE.slotProfiles,
      ...ECOMMERCE_REFUND_ORCHESTRATOR_PROFILE.slotProfiles
    ];
    expect(slots).toHaveLength(5);
    for (const slot of slots) {
      expect(new Set(slot.outcomeProjection.rules.map((rule) => rule.outcome))).toEqual(
        new Set(slot.acceptedOutcomes)
      );
    }
  });

  it("rejects an incomplete Profile projection", () => {
    const profile = structuredClone(CUSTOMER_COMPLAINT_ORCHESTRATOR_PROFILE);
    profile.slotProfiles[0]!.outcomeProjection.rules.pop();
    expect(
      validateScenarioOrchestratorCompileProfile(
        profile,
        CUSTOMER_COMPLAINT_COMPOSITION_DEMO
      ).map((issue) => issue.code)
    ).toContain("ORCHESTRATOR_OUTCOME_PROJECTION_INCOMPLETE");
  });

  it("binds projection contracts into the Document and provenance", () => {
    for (const compositionPlan of [
      CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
      ECOMMERCE_REFUND_COMPOSITION_DEMO
    ]) {
      const output = compileScenarioOrchestratorPreview({ compositionPlan });
      expect(output.ok).toBe(true);
      if (!output.ok) continue;
      for (const slot of output.result.orchestratorDocument.slots) {
        const provenance = output.result.orchestratorDocument.provenance.slotSources.find(
          (source) => source.slotId === slot.slotId
        );
        expect(provenance?.outcomeProjectionIds).toEqual(
          slot.outcomeProjection.rules.map((rule) => rule.projectionId)
        );
      }
    }
  });

  it("changes the deterministic Orchestrator hash when projection semantics change", () => {
    const first = compileScenarioOrchestratorPreview({
      compositionPlan: CUSTOMER_COMPLAINT_COMPOSITION_DEMO
    });
    const profile = structuredClone(CUSTOMER_COMPLAINT_ORCHESTRATOR_PROFILE);
    profile.slotProfiles[0]!.outcomeProjection.rules[0]!.priority = 99;
    const second = compileScenarioOrchestratorPreview({
      compositionPlan: CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
      compileProfile: profile
    });
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.result.orchestratorHash).not.toBe(first.result.orchestratorHash);
    }
  });
});
