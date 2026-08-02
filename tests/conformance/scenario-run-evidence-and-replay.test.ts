import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createScenarioRunEvidenceBundle,
  replayScenarioEvidence,
  validateScenarioEvidenceBundle
} from "../../packages/scenario-run-evidence-core/src";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");
const docsPath = "docs/scenario-run-evidence-and-replay.md";

describe("P6-11D.4 Scenario Run Evidence and Replay conformance", () => {
  it("ships an independent fixed-version browser-safe Evidence Core", () => {
    const packagePath = "packages/scenario-run-evidence-core/package.json";
    expect(existsSync(resolve(root, packagePath))).toBe(true);
    const packageJson = JSON.parse(read(packagePath)) as {
      name: string;
      version: string;
      dependencies: Record<string, string>;
    };
    expect(packageJson).toMatchObject({
      name: "@yutra/scenario-run-evidence-core",
      version: "0.4.0-vnext-preview.1"
    });
    expect(packageJson.dependencies).not.toHaveProperty("@yutra/runtime");
    expect(typeof createScenarioRunEvidenceBundle).toBe("function");
    expect(typeof validateScenarioEvidenceBundle).toBe("function");
    expect(typeof replayScenarioEvidence).toBe("function");
  });

  it("generates Evidence in Runner and replays it only in Studio state", () => {
    const runner = read("apps/builder-runner/src/scenario-run-preview.ts");
    const state = read("apps/builder/src/lib/scenario-evidence-state.ts");
    expect(runner).toContain("createScenarioRunEvidenceBundle");
    expect(runner).toContain("evidenceBundle");
    expect(state).toContain("replayScenarioEvidence");
    expect(state).not.toContain("runScenarioPreview");
    expect(state).not.toContain("fetch(");
  });

  it("ships separate Evidence Inspector components", () => {
    for (const component of [
      "ScenarioEvidencePanel",
      "ScenarioEvidenceIntegrity",
      "ScenarioEvidenceReplayTimeline",
      "ScenarioEvidenceProvenance"
    ]) {
      expect(
        existsSync(
          resolve(root, `apps/builder/src/components/scenario/${component}.tsx`)
        )
      ).toBe(true);
    }
  });

  it("documents integrity, provenance, and offline non-execution", () => {
    const docs = read(docsPath);
    expect(docs).toContain("Evidence Replay is not re-execution");
    expect(docs).toContain("runtimeExecuted=false");
    expect(docs).toContain("Plan, Composition Bundle, Orchestrator, and Preview Bundle source hashes");
    expect(docs).toContain("Changing a terminal, Route, Binding, Slot reference");
    expect(docs).toContain("never fills missing events");
  });

  it("documents redacted, non-persistent, non-production boundaries", () => {
    const docs = read(docsPath);
    expect(docs).toContain("does not contain complete Scenario input/output");
    expect(docs).toContain("not a persistence layer");
    expect(docs).toContain("production Audit platform");
    expect(docs).toContain("change Runtime, DSL, Trace, Compiler");
  });

  it("links Evidence documentation from both READMEs", () => {
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
