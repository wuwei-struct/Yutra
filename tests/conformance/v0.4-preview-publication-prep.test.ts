import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const releaseNotesPath = "docs/releases/v0.4.0-vnext-preview.1.md";
const readinessPath = "docs/v0.4-preview-release-readiness.md";
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");

describe("P6-12C v0.4 Preview publication preparation", () => {
  it("keeps the exact-version notes current after publication", () => {
    expect(existsSync(resolve(root, releaseNotesPath))).toBe(true);
    const notes = read(releaseNotesPath);
    expect(notes).toContain("Version: 0.4.0-vnext-preview.1");
    expect(notes).toContain("Tag: v0.4.0-vnext-preview.1");
    expect(notes).toContain("Type: GitHub prerelease");
    expect(notes).toContain("Publication: Published");
  });

  it("records the frozen v0.4 capability scope", () => {
    const notes = read(releaseNotesPath);
    for (const capability of [
      "Scenario Pattern Core",
      "Scenario Composition Contract / Compiler / Studio Preview",
      "Scenario Orchestrator Contract / Compiler / Studio Preview",
      "Runtime Adapter Contract",
      "In-memory Scenario Orchestrator Engine",
      "Studio Manual Scenario Run Preview",
      "Scenario Evidence Bundle",
      "Offline Evidence Replay"
    ]) {
      expect(notes).toContain(capability);
    }
  });

  it("links the RC smoke and readiness evidence", () => {
    const notes = read(releaseNotesPath);
    expect(notes).toContain("../v0.4-preview-rc-smoke.md");
    expect(notes).toContain("../v0.4-preview-release-readiness.md");
    expect(notes).toContain("did not re-execute Runtime");
  });

  it("preserves the public prerelease boundary", () => {
    const notes = read(releaseNotesPath);
    for (const boundary of [
      "mock-only",
      "in-memory",
      "single-process",
      "canonical demo only",
      "no real side effects",
      "no persistence",
      "not production ready",
      "Production ready: No",
      "npm published: No"
    ]) {
      expect(notes).toContain(boundary);
    }
  });

  it("links release notes from both READMEs", () => {
    expect(read("README.md")).toContain(releaseNotesPath);
    expect(read("README.zh-CN.md")).toContain(releaseNotesPath);
  });

  it("keeps the published CHANGELOG section", () => {
    const changelog = read("CHANGELOG.md");
    expect(changelog).toContain("## [0.4.0-vnext-preview.1] - 2026-08-07");
    expect(changelog).toContain("## Unreleased");
    expect(changelog).toContain("## [0.3.0-vnext-preview.1] - 2026-07-16");
  });

  it("records publication without claiming npm publication", () => {
    const readiness = read(readinessPath);
    for (const state of [
      "releaseNotesReady: true",
      "publicationPreflightReady: true",
      "releaseTagReady: true",
      "releaseTagBlocker: none",
      "tagCreated: true",
      "githubReleaseCreated: true",
      "githubReleaseType: prerelease",
      "npmPublished: false"
    ]) {
      expect(readiness).toContain(state);
    }
  });

  it("preserves the published v0.3 tag record", () => {
    const publication = read("docs/vnext-preview-release-candidate.md");
    expect(publication).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(publication).toContain(
      "releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451"
    );
  });
});
