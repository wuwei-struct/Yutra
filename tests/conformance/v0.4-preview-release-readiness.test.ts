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
    expect(readiness).toContain("Candidate tag: `v0.4.0-vnext-preview.1`");
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

  it("keeps unexecuted release stages closed", () => {
    const readiness = read(readinessPath);
    expect(readiness).toContain("browserSmokeReady: false");
    expect(readiness).toContain("versionAligned: false");
    expect(readiness).toContain("releaseTagReady: false");
    expect(readiness).toContain("tagCreated: false");
    expect(readiness).toContain("githubReleaseCreated: false");
    expect(readiness).toContain("npmPublished: false");
  });

  it("defines the required browser and CLI smoke matrices", () => {
    const readiness = read(readinessPath);
    expect(readiness).toContain("Required Browser Smoke Matrix");
    expect(readiness).toContain("Required CLI Smoke Matrix");
    expect(readiness).toContain("complaint compensation completed");
    expect(readiness).toContain("overlay deny fail-closed");
    expect(readiness).toContain("Replay adds zero Scenario Run API requests");
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
