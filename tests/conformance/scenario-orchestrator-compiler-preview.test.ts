import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ECOMMERCE_REFUND_COMPOSITION_DEMO,
  RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT
} from "../../packages/scenario-composition-core/src";
import {
  compileScenarioOrchestratorPreview
} from "../../packages/scenario-orchestrator-compiler/src";
import {
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO
} from "../../packages/scenario-composition-core/src";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string =>
  readFileSync(resolve(root, path), "utf8");

describe("P6-11C.1 Scenario Orchestrator Compiler Preview conformance", () => {
  it("provides the independent compiler package and API", () => {
    expect(
      existsSync(
        resolve(root, "packages/scenario-orchestrator-compiler/package.json")
      )
    ).toBe(true);
    expect(compileScenarioOrchestratorPreview).toBeTypeOf("function");
  });

  it("generates a scenario_orchestrator preview contract artifact", () => {
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: CUSTOMER_COMPLAINT_COMPOSITION_DEMO
    });
    expect(output.ok).toBe(true);
    if (!output.ok) return;
    expect(
      output.result.orchestratorArtifacts["scenario.orchestrator.yaml"]
    ).toContain("kind: scenario_orchestrator");
    expect(output.result.previewOnly).toBe(true);
    expect(output.result.runtimeExecutable).toBe(false);
    expect(output.result.currentRuntimeSupported).toBe(false);
    expect(output.result.orchestratorDocument.executionModel).toBe(
      "single_active_slot_call_return"
    );
    expect(Object.keys(output.result.orchestratorArtifacts)).not.toContain(
      "agent.yutra.yaml"
    );
  });

  it("compiles customer complaint and ecommerce refund only", () => {
    expect(
      compileScenarioOrchestratorPreview({
        compositionPlan: CUSTOMER_COMPLAINT_COMPOSITION_DEMO
      }).ok
    ).toBe(true);
    expect(
      compileScenarioOrchestratorPreview({
        compositionPlan: ECOMMERCE_REFUND_COMPOSITION_DEMO
      }).ok
    ).toBe(true);
    expect(
      compileScenarioOrchestratorPreview({
        compositionPlan: RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT
      }).ok
    ).toBe(false);
  });

  it("documents the CLI and current Runtime boundary", () => {
    const docs = read("docs/scenario-orchestrator-compiler-preview.md");
    expect(docs).toContain("yutra orchestrator compile");
    expect(docs).toContain(
      "not executable by the current Yutra Runtime"
    );
    expect(docs).toContain("does not modify `@yutra/dsl`");
    expect(docs).toContain("No top-level `agent.yutra.yaml`");
  });

  it("links the Compiler Preview from both READMEs", () => {
    expect(read("README.md")).toContain(
      "docs/scenario-orchestrator-compiler-preview.md"
    );
    expect(read("README.zh-CN.md")).toContain(
      "docs/scenario-orchestrator-compiler-preview.md"
    );
  });

  it("preserves the published release record", () => {
    const publication = read("docs/vnext-preview-release-candidate.md");
    expect(publication).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(publication).toContain(
      "releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451"
    );
  });
});
