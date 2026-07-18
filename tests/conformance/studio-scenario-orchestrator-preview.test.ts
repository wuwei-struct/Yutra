import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");

describe("Studio Scenario Orchestrator Preview conformance", () => {
  it("exposes a dedicated Runner Orchestrator Preview API module", () => {
    const modulePath =
      "apps/builder-runner/src/scenario-orchestrators.ts";
    expect(existsSync(resolve(root, modulePath))).toBe(true);
    const server = read("apps/builder-runner/src/server.ts");
    expect(server).toContain(
      '"/creator/scenario-orchestrators/compile-preview"'
    );
    expect(server).toContain("handleScenarioOrchestratorCompilePreview");
  });

  it("ships separate Studio Orchestrator Preview components and state", () => {
    for (const path of [
      "apps/builder/src/components/scenario/ScenarioOrchestratorPreviewPanel.tsx",
      "apps/builder/src/components/scenario/ScenarioOrchestratorArtifactsPanel.tsx",
      "apps/builder/src/components/scenario/ScenarioOrchestratorProfilePanel.tsx",
      "apps/builder/src/lib/scenario-orchestrator-state.ts",
      "apps/builder/src/lib/scenario-orchestrator-client.ts"
    ]) {
      expect(existsSync(resolve(root, path))).toBe(true);
    }
  });

  it("documents two previews and keeps renewal churn blocked", () => {
    const docs = read("docs/studio-scenario-orchestrator-preview.md");
    expect(docs).toContain("customer-complaint-composition-demo");
    expect(docs).toContain("ecommerce-refund-composition-demo");
    expect(docs).toContain("renewal-churn-warning-composition-demo");
    expect(docs).toContain("remains contract-only");
  });

  it("documents all six Orchestrator artifacts", () => {
    const docs = read("docs/studio-scenario-orchestrator-preview.md");
    for (const filename of [
      "scenario.orchestrator.yaml",
      "orchestrator.routes.json",
      "orchestrator.context-policy.json",
      "orchestrator.trace-contract.json",
      "orchestrator.provenance.json",
      "orchestrator-report.json"
    ]) {
      expect(docs).toContain(filename);
    }
  });

  it("states that Orchestrator YAML is not Agent DSL or an Editor input", () => {
    const docs = read("docs/studio-scenario-orchestrator-preview.md");
    expect(docs).toContain("is not current Agent DSL");
    expect(docs).toContain("cannot be sent to the");
    expect(docs).toContain("Agent DSL Editor");
  });

  it("preserves preview-only and Runtime boundaries", () => {
    const docs = read("docs/studio-scenario-orchestrator-preview.md");
    expect(docs).toContain("previewOnly=true");
    expect(docs).toContain("runtimeExecutable=false");
    expect(docs).toContain("currentRuntimeSupported=false");
    expect(docs).toMatch(/does\s+not expose Apply, Run/);
    expect(docs).toContain("No execution evidence is fabricated.");
  });

  it("keeps Runner compilation in memory without Runtime or DSL inspect dependencies", () => {
    const runner = read("apps/builder-runner/src/scenario-orchestrators.ts");
    expect(runner).not.toMatch(/node:fs|from ["']fs["']/);
    expect(runner).not.toContain("@yutra/runtime");
    expect(runner).not.toContain("@yutra/dsl");
    expect(runner).not.toContain("inspectDsl");
    expect(runner).not.toContain("runPreview");
  });

  it("does not bridge Orchestrator artifacts into the Agent DSL Editor", () => {
    const panel = read(
      "apps/builder/src/components/scenario/ScenarioOrchestratorArtifactsPanel.tsx"
    );
    expect(panel).not.toContain("onSendSlotDsl");
    expect(panel).not.toContain("onSendDsl");
    expect(panel).not.toContain("inspectDsl");
    expect(panel).not.toContain("runPreview");
  });

  it("links the Studio Orchestrator Preview from both READMEs", () => {
    expect(read("README.md")).toContain(
      "docs/studio-scenario-orchestrator-preview.md"
    );
    expect(read("README.zh-CN.md")).toContain(
      "docs/studio-scenario-orchestrator-preview.md"
    );
  });

  it("keeps the published release Tag record unchanged", () => {
    const publication = read("docs/vnext-preview-release-candidate.md");
    expect(publication).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(publication).toContain(
      "releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451"
    );
  });
});
