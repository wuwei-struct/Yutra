import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const releaseNotesPath = "docs/releases/v0.4.0-vnext-preview.1.md";
const readinessPath = "docs/v0.4-preview-release-readiness.md";
const releaseCommit = "b517eb3cbaf729a564c4ff81fb167dcd7da5a713";
const releaseTag = "v0.4.0-vnext-preview.1";
const releaseUrl =
  "https://github.com/wuwei-struct/Yutra/releases/tag/v0.4.0-vnext-preview.1";
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");

describe("P6-12D v0.4 Preview publication", () => {
  it("records the immutable Tag and GitHub prerelease", () => {
    expect(existsSync(resolve(root, releaseNotesPath))).toBe(true);
    const readiness = read(readinessPath);
    for (const state of [
      "tagCreated: true",
      "githubReleaseCreated: true",
      "githubReleaseType: prerelease",
      "npmPublished: false",
      `releasedTag: ${releaseTag}`,
      `releaseCommit: ${releaseCommit}`,
      `githubReleaseUrl: ${releaseUrl}`,
      "publishedAt: 2026-08-07T01:22:03Z"
    ]) {
      expect(readiness).toContain(state);
    }
  });

  it("references a release commit that exists in repository history", () => {
    expect(
      execFileSync("git", ["cat-file", "-t", releaseCommit], {
        cwd: root,
        encoding: "utf8"
      }).trim()
    ).toBe("commit");
  });

  it("publishes exact notes while preserving the preview boundary", () => {
    const notes = read(releaseNotesPath);
    expect(notes).toContain("Publication: Published");
    expect(notes).toContain("Type: GitHub prerelease");
    expect(notes).toContain(`Release URL: ${releaseUrl}`);
    expect(notes).toContain("Published at: 2026-08-07T01:22:03Z");
    expect(notes).toContain("Production ready: No");
    expect(notes).toContain("npm published: No");
  });

  it("retains RC smoke links and the actual CHANGELOG date", () => {
    const notes = read(releaseNotesPath);
    expect(notes).toContain("../v0.4-preview-rc-smoke.md");
    expect(notes).toContain("../v0.4-preview-release-readiness.md");
    expect(read("CHANGELOG.md")).toContain(
      "## [0.4.0-vnext-preview.1] - 2026-08-07"
    );
  });

  it("does not overwrite the published v0.3 release record", () => {
    const publication = read("docs/vnext-preview-release-candidate.md");
    expect(publication).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(publication).toContain(
      "releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451"
    );
  });
});
