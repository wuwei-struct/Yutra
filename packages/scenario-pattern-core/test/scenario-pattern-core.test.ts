import { createArchetypeRegistry } from "@yutra/archetype-core";
import { describe, expect, it } from "vitest";
import {
  BUILTIN_SCENARIO_PATTERNS,
  createScenarioPatternRegistry,
  explainScenarioPattern,
  getScenarioPattern,
  listScenarioPatternsByCrossCuttingArchetype,
  listScenarioPatternsByPrimaryArchetype,
  listScenarioPatternsBySupportingArchetype,
  listScenarioPatternsByTrigger,
  resolveScenarioPatternComposition,
  validateScenarioPattern,
  type ScenarioPatternManifest,
  type ScenarioPatternSupportContext
} from "../src";

const archetypeRegistry = createArchetypeRegistry();
const enabledThree: ScenarioPatternSupportContext = {
  compilerEnabledArchetypeIds: ["request-resolution", "approval-decision", "knowledge-answering"],
  workbenchEnabledArchetypeIds: ["request-resolution", "approval-decision", "knowledge-answering"]
};

function pattern(patternId: ScenarioPatternManifest["patternId"]): ScenarioPatternManifest {
  return BUILTIN_SCENARIO_PATTERNS.find((item) => item.patternId === patternId)!;
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("@yutra/scenario-pattern-core", () => {
  it("validates all three builtin demo patterns", () => {
    expect(BUILTIN_SCENARIO_PATTERNS).toHaveLength(3);
    for (const item of BUILTIN_SCENARIO_PATTERNS) {
      expect(validateScenarioPattern(item, archetypeRegistry)).toEqual({ ok: true, issues: [] });
    }
  });

  it("keeps customer complaint as a scenario pattern with request-resolution primary", () => {
    const complaint = pattern("customer-complaint-demo");
    expect(complaint.patternId).toBe("customer-complaint-demo");
    expect(complaint.primaryArchetypeId).toBe("request-resolution");
    expect(archetypeRegistry.has("customer-complaint-demo" as never)).toBe(false);
  });

  it("composes customer complaint with knowledge answering and approval decision", () => {
    expect(pattern("customer-complaint-demo").supportingArchetypeIds).toEqual([
      "knowledge-answering",
      "approval-decision"
    ]);
  });

  it("composes ecommerce refund with three cross-cutting archetypes", () => {
    expect(pattern("ecommerce-refund-demo").crossCuttingArchetypeIds).toEqual([
      "policy-guard",
      "adapter-connector",
      "human-handoff"
    ]);
  });

  it("uses a system event trigger for renewal churn warning", () => {
    expect(pattern("renewal-churn-warning-demo").triggerPattern).toBe("system_event");
  });

  it("rejects a cross-cutting primary archetype", () => {
    const invalid = { ...copy(pattern("ecommerce-refund-demo")), primaryArchetypeId: "human-handoff" };
    const result = validateScenarioPattern(invalid, archetypeRegistry);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "SCENARIO_PATTERN_PRIMARY_NOT_PRODUCT")).toBe(true);
  });

  it("rejects a product archetype in cross-cutting references", () => {
    const invalid = { ...copy(pattern("ecommerce-refund-demo")), crossCuttingArchetypeIds: ["request-resolution"] };
    const result = validateScenarioPattern(invalid, archetypeRegistry);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "SCENARIO_PATTERN_CROSS_CUTTING_LAYER_MISMATCH")).toBe(true);
  });

  it("rejects an unknown supporting archetype", () => {
    const invalid = { ...copy(pattern("ecommerce-refund-demo")), supportingArchetypeIds: ["unknown-product"] };
    const result = validateScenarioPattern(invalid, archetypeRegistry);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "SCENARIO_PATTERN_SUPPORTING_ARCHETYPE_INVALID")).toBe(true);
  });

  it("rejects primary duplication in supporting references", () => {
    const base = copy(pattern("ecommerce-refund-demo"));
    const result = validateScenarioPattern(
      { ...base, supportingArchetypeIds: [base.primaryArchetypeId, ...base.supportingArchetypeIds] },
      archetypeRegistry
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "SCENARIO_PATTERN_PRIMARY_DUPLICATED_AS_SUPPORTING")).toBe(true);
  });

  it("rejects duplicate supporting references", () => {
    const base = copy(pattern("customer-complaint-demo"));
    const result = validateScenarioPattern(
      { ...base, supportingArchetypeIds: [base.supportingArchetypeIds[0], base.supportingArchetypeIds[0]] },
      archetypeRegistry
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "SCENARIO_PATTERN_DUPLICATE_ARCHETYPE")).toBe(true);
  });

  it("rejects unsafe public exposure", () => {
    const base = copy(pattern("customer-complaint-demo"));
    const result = validateScenarioPattern(
      { ...base, publicExposure: { ...base.publicExposure, containsCustomerData: true } },
      archetypeRegistry
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "SCENARIO_PATTERN_PUBLIC_BOUNDARY_INVALID")).toBe(true);
  });

  it("rejects invalid triggers and unknown manifest fields", () => {
    const base = copy(pattern("customer-complaint-demo"));
    const result = validateScenarioPattern({ ...base, triggerPattern: "webhook", unexpected: true }, archetypeRegistry);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "SCENARIO_PATTERN_TRIGGER_INVALID")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "SCENARIO_PATTERN_SCHEMA_INVALID")).toBe(true);
  });

  it("derives deduplicated primitive coverage and primary taxonomy", () => {
    const summary = resolveScenarioPatternComposition(pattern("customer-complaint-demo"), archetypeRegistry, enabledThree);
    expect(new Set(summary.primitiveCoverage).size).toBe(summary.primitiveCoverage.length);
    expect(summary.primitiveCoverage).toEqual(expect.arrayContaining(["collect", "retrieve", "evaluate", "execute", "handoff", "audit"]));
    expect(summary.primaryOutput.en).toBe("business action result");
    expect(summary.acceptanceObject.en).toContain("request was completed");
  });

  it("computes fully supported, partially supported, and contract-only states", () => {
    const complaint = pattern("customer-complaint-demo");
    const full = resolveScenarioPatternComposition(complaint, archetypeRegistry, enabledThree);
    const partial = resolveScenarioPatternComposition(complaint, archetypeRegistry, {
      compilerEnabledArchetypeIds: ["request-resolution"],
      workbenchEnabledArchetypeIds: ["request-resolution"]
    });
    const contractOnly = resolveScenarioPatternComposition(pattern("renewal-churn-warning-demo"), archetypeRegistry, {
      compilerEnabledArchetypeIds: [],
      workbenchEnabledArchetypeIds: []
    });
    expect(full.compilerSupport).toBe("fully_supported");
    expect(full.workbenchSupport).toBe("fully_supported");
    expect(partial.compilerSupport).toBe("partially_supported");
    expect(partial.workbenchSupport).toBe("partially_supported");
    expect(contractOnly.compilerSupport).toBe("contract_only");
    expect(contractOnly.workbenchSupport).toBe("contract_only");
  });

  it("supports deterministic registry queries and safe copies", () => {
    const registry = createScenarioPatternRegistry();
    expect(registry.list()).toHaveLength(3);
    expect(listScenarioPatternsByPrimaryArchetype("request-resolution")).toHaveLength(2);
    expect(listScenarioPatternsBySupportingArchetype("approval-decision").map((item) => item.patternId)).toEqual([
      "ecommerce-refund-demo",
      "customer-complaint-demo"
    ]);
    expect(listScenarioPatternsByCrossCuttingArchetype("feedback-optimization")[0]?.patternId).toBe(
      "renewal-churn-warning-demo"
    );
    expect(listScenarioPatternsByTrigger("system_event")[0]?.patternId).toBe("renewal-churn-warning-demo");
    const mutable = registry.get("customer-complaint-demo")!;
    mutable.name.en = "changed";
    expect(registry.get("customer-complaint-demo")?.name.en).toBe("Customer Complaint Demo");
  });

  it("explains scenario patterns in English and Chinese", () => {
    const english = explainScenarioPattern("customer-complaint-demo", "en", enabledThree)!;
    const chinese = explainScenarioPattern("customer-complaint-demo", "zh-CN", enabledThree)!;
    expect(english).toContain("Scenario Pattern");
    expect(english).toContain("A scenario pattern is a composition preset, not a new archetype.");
    expect(english).toContain("fully_supported");
    expect(chinese).toContain("场景组合范式");
    expect(chinese).toContain("不是新的主母型");
  });

  it("keeps every builtin pattern inside the public demo boundary", () => {
    for (const item of BUILTIN_SCENARIO_PATTERNS) {
      expect(item.publicExposure).toEqual({
        mode: "demo_only",
        containsCustomerData: false,
        containsRealEndpoint: false,
        containsSecret: false,
        containsCustomerSop: false,
        containsCommercialDeliveryAsset: false
      });
    }
    const serialized = JSON.stringify(BUILTIN_SCENARIO_PATTERNS);
    expect(serialized).not.toMatch(/https?:\/\//i);
    expect(serialized).not.toMatch(/API_KEY|PRIVATE_KEY|PASSWORD|bearer\s/i);
  });

  it("returns explicit undefined for an unknown registry id", () => {
    expect(getScenarioPattern("unknown" as never)).toBeUndefined();
  });
});
