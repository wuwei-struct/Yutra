import { describe, expect, it } from "vitest";
import {
  BUILTIN_SCENARIO_COMPOSITION_PLANS,
  COMPOSITION_PRECEDENCE_RULES,
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  ECOMMERCE_REFUND_COMPOSITION_DEMO,
  RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT,
  explainScenarioComposition,
  resolveCompositionReadiness,
  validateScenarioComposition,
  type CompositionSupportContext,
  type ScenarioCompositionPlan
} from "../src";

const supportedContext: CompositionSupportContext = {
  compilerEnabledArchetypeIds: ["request-resolution", "approval-decision", "knowledge-answering"],
  workbenchEnabledArchetypeIds: ["request-resolution", "approval-decision", "knowledge-answering"],
  availableCrossCuttingArchetypeIds: [
    "human-handoff",
    "policy-guard",
    "adapter-connector",
    "feedback-optimization"
  ]
};

function clonePlan(plan = CUSTOMER_COMPLAINT_COMPOSITION_DEMO): ScenarioCompositionPlan {
  return structuredClone(plan);
}

function issueCodes(plan: unknown): string[] {
  return validateScenarioComposition(plan).issues.map((issue) => issue.code);
}

describe("scenario composition contract", () => {
  it("validates both builtin compile-plan contracts", () => {
    expect(BUILTIN_SCENARIO_COMPOSITION_PLANS).toHaveLength(2);
    expect(BUILTIN_SCENARIO_COMPOSITION_PLANS.every((plan) => validateScenarioComposition(plan).ok)).toBe(true);
  });

  it("uses request-resolution as the customer complaint primary", () => {
    const primary = CUSTOMER_COMPLAINT_COMPOSITION_DEMO.slots.find((slot) => slot.role === "primary");
    expect(primary?.slotId).toBe("complaint_resolution");
    expect(primary?.archetypeId).toBe("request-resolution");
  });

  it("uses knowledge-answering and approval-decision as supporting slots", () => {
    expect(
      CUSTOMER_COMPLAINT_COMPOSITION_DEMO.slots
        .filter((slot) => slot.role === "supporting")
        .map((slot) => slot.archetypeId)
    ).toEqual(["knowledge-answering", "approval-decision"]);
  });

  it("uses human-handoff and policy-guard as customer complaint overlays", () => {
    expect(CUSTOMER_COMPLAINT_COMPOSITION_DEMO.crossCuttingOverlays.map((overlay) => overlay.archetypeId)).toEqual([
      "human-handoff",
      "policy-guard"
    ]);
  });

  it("preserves each Pack Config in its own slot namespace", () => {
    const slots = CUSTOMER_COMPLAINT_COMPOSITION_DEMO.slots;
    expect(new Set(slots.map((slot) => slot.slotId)).size).toBe(3);
    expect(new Set(slots.map((slot) => slot.packConfigId)).size).toBe(3);
    expect(slots.every((slot) => slot.packConfig.packConfigId === slot.packConfigId)).toBe(true);
  });

  it("does not expose a merged Pack Config", () => {
    expect(CUSTOMER_COMPLAINT_COMPOSITION_DEMO).not.toHaveProperty("mergedPackConfig");
    expect(CUSTOMER_COMPLAINT_COMPOSITION_DEMO).not.toHaveProperty("flattenedConfig");
  });

  it("rejects a slot and Pack Config archetype mismatch", () => {
    const plan = clonePlan();
    plan.slots[1]!.packConfig.archetypeId = "approval-decision";
    expect(issueCodes(plan)).toContain("COMPOSITION_PACK_CONFIG_ARCHETYPE_MISMATCH");
  });

  it("rejects a supporting archetype outside the Pattern", () => {
    const plan = clonePlan();
    plan.slots[1]!.archetypeId = "data-insight";
    expect(issueCodes(plan)).toContain("COMPOSITION_PATTERN_ARCHETYPE_MISMATCH");
  });

  it("rejects duplicate supporting archetype assignments across Slots", () => {
    const plan = clonePlan();
    plan.slots[2]!.archetypeId = plan.slots[1]!.archetypeId;
    plan.slots[2]!.packConfig = structuredClone(plan.slots[1]!.packConfig);
    plan.slots[2]!.packConfigId = plan.slots[1]!.packConfigId;
    expect(issueCodes(plan)).toContain("COMPOSITION_PATTERN_ARCHETYPE_MISMATCH");
  });

  it("rejects an unknown Scenario Pattern with a stable error", () => {
    const plan = clonePlan() as unknown as Record<string, unknown>;
    (plan.patternRef as Record<string, unknown>).patternId = "unknown-pattern";
    expect(issueCodes(plan)).toContain("COMPOSITION_PATTERN_NOT_FOUND");
  });

  it("rejects a Product Archetype used as a cross-cutting overlay", () => {
    const plan = clonePlan() as unknown as Record<string, unknown>;
    const overlays = plan.crossCuttingOverlays as Array<Record<string, unknown>>;
    overlays[0]!.archetypeId = "request-resolution";
    expect(issueCodes(plan)).toContain("COMPOSITION_OVERLAY_LAYER_MISMATCH");
  });

  it("rejects duplicate slots", () => {
    const plan = clonePlan();
    plan.slots[1]!.slotId = plan.slots[0]!.slotId;
    expect(issueCodes(plan)).toContain("COMPOSITION_SLOT_DUPLICATE");
  });

  it("rejects multiple primary slots", () => {
    const plan = clonePlan();
    plan.slots[1]!.role = "primary";
    expect(issueCodes(plan)).toContain("COMPOSITION_MULTIPLE_PRIMARY_SLOTS");
  });

  it("rejects an unknown route source", () => {
    const plan = clonePlan();
    plan.routes[0]!.fromSlotId = "missing_slot";
    expect(issueCodes(plan)).toContain("COMPOSITION_ROUTE_SOURCE_NOT_FOUND");
  });

  it("rejects an unknown route target", () => {
    const plan = clonePlan();
    plan.routes[0]!.toSlotId = "missing_slot";
    expect(issueCodes(plan)).toContain("COMPOSITION_ROUTE_TARGET_NOT_FOUND");
  });

  it("rejects direct self-routes", () => {
    const plan = clonePlan();
    plan.routes[0]!.toSlotId = plan.routes[0]!.fromSlotId;
    expect(issueCodes(plan)).toContain("COMPOSITION_ROUTE_SELF_REFERENCE");
  });

  it("rejects a missing binding target", () => {
    const plan = clonePlan();
    plan.dataBindings[0]!.toSlotId = "missing_slot";
    expect(issueCodes(plan)).toContain("COMPOSITION_BINDING_TARGET_NOT_FOUND");
  });

  it("rejects transforms other than identity", () => {
    const plan = clonePlan() as unknown as Record<string, unknown>;
    const bindings = plan.dataBindings as Array<Record<string, unknown>>;
    bindings[0]!.transform = "script";
    expect(issueCodes(plan)).toContain("COMPOSITION_BINDING_TRANSFORM_UNSUPPORTED");
  });

  it("rejects an incomplete precedence policy", () => {
    const plan = clonePlan();
    plan.precedencePolicy.rules = plan.precedencePolicy.rules.slice(0, -1);
    expect(issueCodes(plan)).toContain("COMPOSITION_PRECEDENCE_INCOMPLETE");
  });

  it("provides the complete ordered precedence policy", () => {
    expect(CUSTOMER_COMPLAINT_COMPOSITION_DEMO.precedencePolicy.rules).toEqual(COMPOSITION_PRECEDENCE_RULES);
  });

  it("rejects conflict modes other than fail_closed", () => {
    const plan = clonePlan() as unknown as Record<string, unknown>;
    (plan.precedencePolicy as Record<string, unknown>).conflictMode = "last_write_wins";
    expect(issueCodes(plan)).toContain("COMPOSITION_CONFLICT_MODE_INVALID");
  });

  it("rejects any public boundary risk flag", () => {
    const plan = clonePlan() as unknown as Record<string, unknown>;
    (plan.publicExposure as Record<string, unknown>).containsSecret = true;
    expect(issueCodes(plan)).toContain("COMPOSITION_PUBLIC_BOUNDARY_INVALID");
  });

  it("marks customer complaint compile-ready at the contract layer only", () => {
    const readiness = resolveCompositionReadiness(CUSTOMER_COMPLAINT_COMPOSITION_DEMO, supportedContext);
    expect(readiness.status).toBe("compile_ready");
    expect(readiness.contractValid).toBe(true);
    expect(readiness.compositionCompilerAvailable).toBe(false);
  });

  it("marks ecommerce refund compile-ready at the contract layer only", () => {
    const readiness = resolveCompositionReadiness(ECOMMERCE_REFUND_COMPOSITION_DEMO, supportedContext);
    expect(readiness.status).toBe("compile_ready");
    expect(readiness.compositionCompilerAvailable).toBe(false);
  });

  it("keeps renewal churn contract-only and ineligible for compiler input", () => {
    const readiness = resolveCompositionReadiness(RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT, supportedContext);
    expect(RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT.eligibleForCompilerInput).toBe(false);
    expect(readiness.status).toBe("contract_only");
    expect(readiness.compositionCompilerAvailable).toBe(false);
  });

  it("explains the composition contract in English", () => {
    const explanation = explainScenarioComposition(CUSTOMER_COMPLAINT_COMPOSITION_DEMO, "en", supportedContext);
    expect(explanation).toContain("Execution Model: orchestrated_subflows");
    expect(explanation).toContain("does not deep-merge Pack Configs");
    expect(explanation).toContain("compositionCompilerAvailable=false");
  });

  it("explains the composition contract in Chinese", () => {
    const explanation = explainScenarioComposition(CUSTOMER_COMPLAINT_COMPOSITION_DEMO, "zh-CN", supportedContext);
    expect(explanation).toContain("执行模型：orchestrated_subflows");
    expect(explanation).toContain("不进行通用深合并");
    expect(explanation).toContain("主要产出物");
  });

  it("rejects unknown deep-merge fields explicitly", () => {
    const plan = clonePlan() as unknown as Record<string, unknown>;
    plan.mergedPackConfig = {};
    expect(issueCodes(plan)).toContain("COMPOSITION_DEEP_MERGE_NOT_ALLOWED");
  });

  it("contains no endpoint, secret, customer SOP, or commercial delivery asset", () => {
    const serialized = JSON.stringify({
      plans: BUILTIN_SCENARIO_COMPOSITION_PLANS,
      draft: RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT
    });
    expect(serialized).not.toMatch(/https?:\/\//i);
    expect(serialized).not.toMatch(/API_KEY|PRIVATE_KEY|PASSWORD|bearer\s/i);
    expect(BUILTIN_SCENARIO_COMPOSITION_PLANS.every((plan) => plan.publicExposure.containsCustomerSop === false)).toBe(true);
    expect(
      BUILTIN_SCENARIO_COMPOSITION_PLANS.every(
        (plan) => plan.publicExposure.containsCommercialDeliveryAsset === false
      )
    ).toBe(true);
  });
});
