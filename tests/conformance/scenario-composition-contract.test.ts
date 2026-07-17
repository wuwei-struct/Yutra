import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT,
  resolveCompositionReadiness,
  type CompositionSupportContext
} from "../../packages/scenario-composition-core/src";

const root = resolve(__dirname, "..", "..");
const supportContext: CompositionSupportContext = {
  compilerEnabledArchetypeIds: ["request-resolution", "approval-decision", "knowledge-answering"],
  workbenchEnabledArchetypeIds: ["request-resolution", "approval-decision", "knowledge-answering"],
  availableCrossCuttingArchetypeIds: ["human-handoff", "policy-guard"]
};

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-11B.0 scenario composition contract conformance", () => {
  it("provides the independent scenario-composition-core package", () => {
    expect(existsSync(resolve(root, "packages/scenario-composition-core/package.json"))).toBe(true);
    expect(JSON.parse(read("packages/scenario-composition-core/package.json")).name).toBe(
      "@yutra/scenario-composition-core"
    );
  });

  it("supports orchestrated_subflows as the only execution model", () => {
    expect(read("packages/scenario-composition-core/src/types.ts")).toContain(
      'CompositionExecutionModel = "orchestrated_subflows"'
    );
    expect(CUSTOMER_COMPLAINT_COMPOSITION_DEMO.executionModel).toBe("orchestrated_subflows");
  });

  it("forbids deep merge and requires namespace isolation", () => {
    const doc = read("docs/scenario-composition-contract.md");
    expect(doc).toContain("Why Deep Merge Is Forbidden");
    expect(doc).toContain("Namespace Isolation");
    expect(doc).toContain("slots.<slotId>.config");
  });

  it("defines fail-closed precedence", () => {
    const doc = read("docs/scenario-composition-contract.md");
    expect(doc).toContain("deny_overrides");
    expect(doc).toContain("human_review_over_automation");
    expect(doc).toContain("primary_owns_terminal_response");
    expect(doc).toContain("fail_closed");
  });

  it("uses all three enabled Product Archetypes in customer complaint", () => {
    expect(CUSTOMER_COMPLAINT_COMPOSITION_DEMO.slots.map((slot) => slot.archetypeId)).toEqual([
      "request-resolution",
      "knowledge-answering",
      "approval-decision"
    ]);
  });

  it("separates contract readiness from composition compiler availability", () => {
    const readiness = resolveCompositionReadiness(CUSTOMER_COMPLAINT_COMPOSITION_DEMO, supportContext);
    expect(readiness.status).toBe("compile_ready");
    expect(readiness.compositionCompilerAvailable).toBe(false);
  });

  it("does not mark renewal churn compile-ready", () => {
    expect(RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT.eligibleForCompilerInput).toBe(false);
    expect(resolveCompositionReadiness(RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT, supportContext).status).toBe(
      "contract_only"
    );
  });

  it("links the contract from both READMEs", () => {
    expect(read("README.md")).toContain("docs/scenario-composition-contract.md");
    expect(read("README.zh-CN.md")).toContain("docs/scenario-composition-contract.md");
  });

  it("preserves the published release tag record", () => {
    const candidate = read("docs/vnext-preview-release-candidate.md");
    expect(candidate).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(candidate).toContain("releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451");
  });
});
