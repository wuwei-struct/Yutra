import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const targetVersion = "0.4.0-vnext-preview.1";
const evidencePath = "docs/v0.4-preview-rc-smoke.md";
const readinessPath = "docs/v0.4-preview-release-readiness.md";
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");

function packageJsonPaths(): string[] {
  const paths = ["package.json"];
  for (const workspaceRoot of ["apps", "packages"]) {
    for (const entry of readdirSync(resolve(root, workspaceRoot), {
      withFileTypes: true
    })) {
      const relative = `${workspaceRoot}/${entry.name}/package.json`;
      if (entry.isDirectory() && existsSync(resolve(root, relative))) {
        paths.push(relative);
      }
    }
  }
  return paths.sort();
}

describe("P6-12B v0.4 Preview RC smoke conformance", () => {
  it("aligns all fixed-version package manifests", () => {
    const paths = packageJsonPaths();
    expect(paths).toHaveLength(27);
    for (const path of paths) {
      const manifest = JSON.parse(read(path)) as { version?: string };
      expect(manifest.version, path).toBe(targetVersion);
    }
  });

  it("records Creator, Composition, and Orchestrator smoke", () => {
    expect(existsSync(resolve(root, evidencePath))).toBe(true);
    const evidence = read(evidencePath);
    for (const expected of [
      "request-resolution",
      "approval-decision",
      "knowledge-answering",
      "customer complaint",
      "ecommerce refund",
      "renewal churn",
      "COMPOSITION_NOT_COMPILE_READY",
      "ORCHESTRATOR_COMPOSITION_NOT_READY",
      "scenario.orchestrator.yaml"
    ]) {
      expect(evidence).toContain(expected);
    }
  });

  it("records all five runs and offline evidence replays", () => {
    const evidence = read(evidencePath);
    for (const demoCase of [
      "complaint_policy",
      "complaint_compensation",
      "complaint_handoff",
      "refund_authorization",
      "overlay_deny"
    ]) {
      expect(evidence).toContain(demoCase);
    }
    expect(evidence).toContain("replayMode=offline_evidence");
    expect(evidence).toContain("runtimeExecuted=false");
    expect(evidence).toContain("externalEffectsOccurred=false");
    expect(evidence).toContain("zero Scenario Run API requests");
  });

  it("keeps smoke ready while publication preparation opens tagging", () => {
    const readiness = read(readinessPath);
    for (const state of [
      "versionAligned: true",
      "automatedGatesReady: true",
      "browserSmokeReady: true",
      "cliSmokeReady: true",
      "evidenceReplayReady: true",
      "releaseSmokeReady: true",
      "releaseNotesReady: true",
      "publicationPreflightReady: true",
      "releaseTagReady: true",
      "releaseTagBlocker: none",
      "tagCreated: false",
      "githubReleaseCreated: false",
      "npmPublished: false"
    ]) {
      expect(readiness).toContain(state);
    }
  });

  it("links RC smoke evidence from both READMEs", () => {
    expect(read("README.md")).toContain(evidencePath);
    expect(read("README.zh-CN.md")).toContain(evidencePath);
  });

  it("preserves the published v0.3 release record", () => {
    const publication = read("docs/vnext-preview-release-candidate.md");
    expect(publication).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(publication).toContain(
      "releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451"
    );
  });
});
