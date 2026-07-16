import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(path: string): string {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

describe("P6-10C.2 vNext Preview prerelease publication record", () => {
  it("records the annotated tag and GitHub prerelease", () => {
    const content = read("docs/vnext-preview-release-candidate.md");
    expect(content.includes("tagCreated: true")).toBe(true);
    expect(content.includes("githubReleaseCreated: true")).toBe(true);
    expect(content.includes("githubReleaseType: prerelease")).toBe(true);
    expect(content.includes("npmPublished: false")).toBe(true);
  });

  it("records the exact version, tag, and release commit", () => {
    const content = read("docs/vnext-preview-release-candidate.md");
    expect(content.includes("packageVersion: 0.3.0-vnext-preview.1")).toBe(true);
    expect(content.includes("releasedTag: v0.3.0-vnext-preview.1")).toBe(true);
    expect(content.includes("releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451")).toBe(true);
  });

  it("records a non-empty GitHub Release URL", () => {
    const content = read("docs/vnext-preview-release-candidate.md");
    expect(content).toMatch(
      /githubReleaseUrl: https:\/\/github\.com\/wuwei-struct\/Yutra\/releases\/tag\/v0\.3\.0-vnext-preview\.1/
    );
  });

  it("preserves smoke evidence and production-certification boundaries", () => {
    const content = read("docs/vnext-preview-release-candidate.md");
    expect(content.includes("./vnext-preview-release-smoke.md")).toBe(true);
    expect(content.includes("not an npm publication or production certification")).toBe(true);
    expect(content.includes("Production ready: Yes")).toBe(false);
  });
});
