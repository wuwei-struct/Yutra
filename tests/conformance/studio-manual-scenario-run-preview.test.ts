import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");
const docsPath = "docs/studio-manual-scenario-run-preview.md";

describe("P6-11D.3 Studio Manual Scenario Run Preview conformance", () => {
  it("ships a separate Runner API and Studio state/client", () => {
    for (const path of [
      "apps/builder-runner/src/scenario-run-preview.ts",
      "apps/builder/src/lib/scenario-run-client.ts",
      "apps/builder/src/lib/scenario-run-state.ts"
    ]) {
      expect(existsSync(resolve(root, path))).toBe(true);
    }
    expect(read("apps/builder-runner/src/server.ts")).toContain(
      "/creator/scenario-runs/preview"
    );
  });

  it("ships independent Scenario Run components", () => {
    for (const name of [
      "ScenarioRunPreviewPanel",
      "ScenarioRunCaseSelector",
      "ScenarioRunSummary",
      "ScenarioRunTimeline",
      "ScenarioSlotInvocationPanel",
      "ScenarioRunAuditPanel"
    ]) {
      expect(
        existsSync(
          resolve(root, `apps/builder/src/components/scenario/${name}.tsx`)
        )
      ).toBe(true);
    }
  });

  it("accepts only canonical composition and demo-case fields", () => {
    const source = read("apps/builder-runner/src/scenario-run-preview.ts");
    expect(source).toContain("complaint_policy");
    expect(source).toContain("complaint_compensation");
    expect(source).toContain("complaint_handoff");
    expect(source).toContain("refund_authorization");
    expect(source).toContain("overlay_deny");
    expect(source).toContain("Object.keys(record).length !== 2");
  });

  it("documents manual-only sequencing and safe evidence", () => {
    const docs = read(docsPath);
    expect(docs).toContain("click Run Scenario Preview");
    expect(docs).toContain("do not start a run");
    for (const evidence of [
      "Outcome Projection",
      "Route summaries",
      "identity Binding",
      "Overlay",
      "budget usage",
      "redacted Audit"
    ]) {
      expect(docs).toContain(evidence);
    }
  });

  it("documents in-memory mock and persistence boundaries", () => {
    const docs = read(docsPath);
    expect(docs).toContain("in-memory, mock-only");
    expect(docs).toContain("writes no file or persistent record");
    expect(docs).toContain("externalEffectsOccurred=false");
    expect(docs).toContain("not production ready");
  });

  it("does not change Runtime, DSL, Trace, or Compiler semantics", () => {
    const runnerPackage = read("apps/builder-runner/package.json");
    expect(runnerPackage).toContain(
      '"@yutra/scenario-orchestrator-engine-demo": "workspace:*"'
    );
    const docs = read(docsPath);
    expect(docs).toContain("no Runtime, DSL, Trace, Composition Compiler");
  });

  it("links the manual preview docs from both READMEs", () => {
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
