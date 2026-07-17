import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");

describe("Studio Scenario Composition Compile Preview conformance", () => {
  it("ships an independent Studio Scenario Composition workbench", () => {
    expect(
      existsSync(
        resolve(
          root,
          "apps/builder/src/components/scenario/ScenarioCompositionWorkbench.tsx"
        )
      )
    ).toBe(true);
    expect(read("apps/builder/src/components/studio/StudioShell.tsx")).toContain(
      "ScenarioCompositionWorkbench"
    );
  });

  it("exposes canonical catalog, detail, and compile-preview Runner paths", () => {
    const server = read("apps/builder-runner/src/server.ts");
    expect(server).toContain('"/creator/scenario-compositions"');
    expect(server).toContain("scenarioDetailMatch");
    expect(server).toContain("handleScenarioCompositionDetail");
    expect(server).toContain('"/creator/scenario-compositions/compile-preview"');
  });

  it("documents two compile-preview compositions and contract-only renewal churn", () => {
    const docs = read("docs/studio-scenario-composition-preview.md");
    expect(docs).toContain("customer-complaint-composition-demo");
    expect(docs).toContain("ecommerce-refund-composition-demo");
    expect(docs).toContain("renewal-churn-warning-composition-demo");
    expect(docs).toContain("remains contract-only");
  });

  it("preserves namespace and non-executable boundaries", () => {
    const docs = read("docs/studio-scenario-composition-preview.md");
    expect(docs).toContain("no Pack Config deep merge");
    expect(docs).toContain("no top-level `orchestrator.yutra.yaml`");
    expect(docs).toContain("no Runtime execution");
    expect(docs).toContain("previewOnly=true");
    expect(docs).toContain("runtimeExecutable=false");
  });

  it("states that Slot DSL is not full Scenario DSL", () => {
    const docs = read("docs/studio-scenario-composition-preview.md");
    expect(docs).toContain("It does not represent or");
    expect(docs).toContain("execute the full scenario composition.");
    expect(
      read("apps/builder/src/components/scenario/ScenarioSlotArtifactsPanel.tsx")
    ).toContain("onSendSlotDsl");
  });

  it("does not expose a Scenario Run action", () => {
    const workbench = read(
      "apps/builder/src/components/scenario/ScenarioCompositionWorkbench.tsx"
    );
    expect(workbench).not.toContain("Scenario Run");
    expect(workbench).not.toContain("runPreview");
  });

  it("links the Studio preview documentation from both READMEs", () => {
    expect(read("README.md")).toContain(
      "docs/studio-scenario-composition-preview.md"
    );
    expect(read("README.zh-CN.md")).toContain(
      "docs/studio-scenario-composition-preview.md"
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
