import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const readinessPath = "docs/v0.4-preview-release-readiness.md";
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");

describe("P6-12A v0.4 Preview release readiness conformance", () => {
  it("ships the v0.4 Preview readiness audit", () => {
    expect(existsSync(resolve(root, readinessPath))).toBe(true);
    const readiness = read(readinessPath);
    expect(readiness).toContain("Candidate version: `0.4.0-vnext-preview.1`");
    expect(readiness).toContain("Released tag: `v0.4.0-vnext-preview.1`");
  });

  it("freezes the expected Scenario release scope", () => {
    const readiness = read(readinessPath);
    expect(readiness).toContain("releaseScopeFrozen: true");
    expect(readiness).toContain("In-memory Scenario Orchestrator Engine");
    expect(readiness).toContain("Studio Manual Scenario Run Preview");
    expect(readiness).toContain("Offline Evidence Replay");
  });

  it("preserves the public preview boundary", () => {
    const readiness = read(readinessPath);
    for (const boundary of [
      "mock-only",
      "in-memory",
      "single-process",
      "canonical demo only",
      "no persistence",
      "not production ready",
      "npm not published"
    ]) {
      expect(readiness).toContain(boundary);
    }
  });

  it("records completed preparation and prerelease publication", () => {
    const readiness = read(readinessPath);
    expect(readiness).toContain("browserSmokeReady: true");
    expect(readiness).toContain("cliSmokeReady: true");
    expect(readiness).toContain("evidenceReplayReady: true");
    expect(readiness).toContain("releaseSmokeReady: true");
    expect(readiness).toContain("versionAligned: true");
    expect(readiness).toContain("releaseNotesReady: true");
    expect(readiness).toContain("publicationPreflightReady: true");
    expect(readiness).toContain("releaseTagReady: true");
    expect(readiness).toContain("releaseTagBlocker: none");
    expect(readiness).toContain("tagCreated: true");
    expect(readiness).toContain("githubReleaseCreated: true");
    expect(readiness).toContain("githubReleaseType: prerelease");
    expect(readiness).toContain("npmPublished: false");
  });

  it("records the completed browser and CLI smoke matrices", () => {
    const readiness = read(readinessPath);
    expect(readiness).toContain("Browser Smoke Matrix");
    expect(readiness).toContain("CLI Smoke Matrix");
    expect(readiness).toContain("complaint policy and compensation completed");
    expect(readiness).toContain("overlay deny reached `$fail_closed`");
    expect(readiness).toContain("Replay added zero Scenario Run API requests");
    expect(readiness).toContain("runtimeExecuted=false");
  });

  it("links the readiness audit from both READMEs", () => {
    expect(read("README.md")).toContain(readinessPath);
    expect(read("README.zh-CN.md")).toContain(readinessPath);
  });

  it("preserves the published v0.3 tag record", () => {
    const publication = read("docs/vnext-preview-release-candidate.md");
    expect(publication).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(publication).toContain(
      "releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451"
    );
  });
});
