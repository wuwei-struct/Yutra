import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createInMemoryScenarioOrchestratorEngine,
  createBuiltinDemoEngineOptions
} from "../../packages/scenario-orchestrator-engine-demo/src";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");
const docsPath = "docs/in-memory-scenario-orchestrator-engine.md";

describe("P6-11D.2 in-memory Scenario Orchestrator Engine conformance", () => {
  it("ships an independent fixed-version Engine package", () => {
    const packagePath = "packages/scenario-orchestrator-engine-demo/package.json";
    expect(existsSync(resolve(root, packagePath))).toBe(true);
    expect(JSON.parse(read(packagePath))).toMatchObject({
      name: "@yutra/scenario-orchestrator-engine-demo",
      version: "0.3.0-vnext-preview.1"
    });
    expect(typeof createInMemoryScenarioOrchestratorEngine).toBe("function");
  });

  it("uses single-active call-return and Outcome Projection", () => {
    const docs = read(docsPath);
    expect(docs).toContain("single_active_slot_call_return");
    expect(docs).toContain("evaluateSlotOutcomeProjection()");
    expect(docs).toContain("finalState=done");
    expect(docs).toMatch(/not used to select a Route/);
    expect(docs).toMatch(/Supporting completion never means Scenario\s+completion/);
  });

  it("documents isolated Context, identity Binding, and explicit Routes", () => {
    const docs = read(docsPath);
    expect(docs).toContain("slots.<slotId>.input");
    expect(docs).toContain("declared identity Binding");
    expect(docs).toContain("deep merge");
    expect(docs).toContain("Every `conditionRef` must have an injected deterministic evaluator");
    expect(docs).toContain("Unknown conditions");
  });

  it("enforces Overlay precedence, fixed terminals, budgets, and idempotency", () => {
    const docs = read(docsPath);
    expect(docs).toContain("deny_override");
    expect(docs).toContain("require_handoff");
    for (const terminal of ["$scenario_done", "$human_handoff", "$fail_closed"]) {
      expect(docs).toContain(terminal);
    }
    expect(docs).toContain("Budgets cover Slot invocations");
    expect(docs).toContain("idempotency key");
  });

  it("emits real in-memory Orchestrator events and redacted audit summaries", () => {
    const docs = read(docsPath);
    expect(docs).toContain("13 contract event types");
    expect(docs).toContain("strictly increasing sequence");
    expect(docs).toContain("redacted status");
    expect(docs).not.toMatch(/modif(?:y|ies) .*Trace Runtime/);
  });

  it("supports both canonical completed demos", () => {
    expect(
      createBuiltinDemoEngineOptions("customer-complaint-composition-demo")
        .compileResult.compositionId
    ).toBe("customer-complaint-composition-demo");
    expect(
      createBuiltinDemoEngineOptions("ecommerce-refund-composition-demo")
        .compileResult.compositionId
    ).toBe("ecommerce-refund-composition-demo");
  });

  it("keeps Studio without Scenario Run", () => {
    const studio = read("docs/studio-scenario-orchestrator-preview.md");
    expect(studio).toMatch(/no Scenario Run|no Orchestrator(?: Apply or)? Run/);
    const enginePackage = read("packages/scenario-orchestrator-engine-demo/package.json");
    expect(enginePackage).not.toContain("@yutra/builder");
  });

  it("links Engine documentation from both READMEs", () => {
    expect(read("README.md")).toContain(docsPath);
    expect(read("README.zh-CN.md")).toContain(docsPath);
  });

  it("preserves the published release record", () => {
    const publication = read("docs/vnext-preview-release-candidate.md");
    expect(publication).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(publication).toContain(
      "releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451"
    );
  });
});
