import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BUILTIN_SCENARIO_PATTERNS,
  createScenarioPatternRegistry,
  validateScenarioPattern
} from "../../packages/scenario-pattern-core/src";

const root = resolve(__dirname, "..", "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-11A scenario pattern composition core conformance", () => {
  it("provides the independent scenario-pattern-core package", () => {
    expect(existsSync(resolve(root, "packages/scenario-pattern-core/package.json"))).toBe(true);
    expect(JSON.parse(read("packages/scenario-pattern-core/package.json")).name).toBe("@yutra/scenario-pattern-core");
  });

  it("exports the ScenarioPatternManifest contract", () => {
    expect(read("packages/scenario-pattern-core/src/index.ts")).toContain("ScenarioPatternManifest");
  });

  it("provides three valid builtin demo patterns", () => {
    expect(BUILTIN_SCENARIO_PATTERNS.map((pattern) => pattern.patternId)).toEqual([
      "ecommerce-refund-demo",
      "customer-complaint-demo",
      "renewal-churn-warning-demo"
    ]);
    expect(BUILTIN_SCENARIO_PATTERNS.every((pattern) => validateScenarioPattern(pattern).ok)).toBe(true);
  });

  it("keeps customer complaint as a scenario pattern", () => {
    const complaint = createScenarioPatternRegistry().get("customer-complaint-demo")!;
    expect(complaint.primaryArchetypeId).toBe("request-resolution");
    expect(complaint.supportingArchetypeIds).toEqual(["knowledge-answering", "approval-decision"]);
    expect(read("docs/scenario-pattern-core.md")).toContain("Customer complaint remains a Scenario Pattern");
  });

  it("states that scenario patterns are not new archetypes", () => {
    expect(read("docs/scenario-pattern-core.md")).toContain("A scenario pattern is a composition preset, not a new archetype.");
    expect(read("docs/archetype-taxonomy.md")).toContain("@yutra/scenario-pattern-core");
  });

  it("defines primary, supporting, and cross-cutting roles", () => {
    const doc = read("docs/scenario-pattern-core.md");
    expect(doc).toContain("Primary Product Archetype");
    expect(doc).toContain("Supporting Product Archetypes");
    expect(doc).toContain("Cross-cutting Archetypes");
  });

  it("keeps every builtin manifest demo-only", () => {
    for (const pattern of BUILTIN_SCENARIO_PATTERNS) {
      expect(pattern.publicExposure).toEqual({
        mode: "demo_only",
        containsCustomerData: false,
        containsRealEndpoint: false,
        containsSecret: false,
        containsCustomerSop: false,
        containsCommercialDeliveryAsset: false
      });
    }
  });

  it("contains no live endpoint, customer data, or customer SOP", () => {
    const serialized = JSON.stringify(BUILTIN_SCENARIO_PATTERNS);
    expect(serialized).not.toMatch(/https?:\/\//i);
    expect(serialized).not.toMatch(/API_KEY|PRIVATE_KEY|PASSWORD|bearer\s/i);
    expect(BUILTIN_SCENARIO_PATTERNS.every((pattern) => pattern.publicExposure.containsCustomerData === false)).toBe(true);
    expect(BUILTIN_SCENARIO_PATTERNS.every((pattern) => pattern.publicExposure.containsCustomerSop === false)).toBe(true);
  });

  it("links the Scenario Pattern Core documentation from both READMEs", () => {
    expect(read("README.md")).toContain("docs/scenario-pattern-core.md");
    expect(read("README.zh-CN.md")).toContain("docs/scenario-pattern-core.md");
  });

  it("preserves the published release tag record", () => {
    const candidate = read("docs/vnext-preview-release-candidate.md");
    expect(candidate).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(candidate).toContain("releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451");
  });
});
