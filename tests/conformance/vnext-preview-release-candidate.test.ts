import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(path: string): string {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

describe("P6-10A vNext Preview release candidate docs", () => {
  it("release candidate document exists", () => {
    expect(existsSync(resolve(workspaceRoot, "docs/vnext-preview-release-candidate.md"))).toBe(true);
  });

  it("release candidate document lists all three demo-enabled product archetypes", () => {
    const content = read("docs/vnext-preview-release-candidate.md");
    for (const archetype of ["request-resolution", "approval-decision", "knowledge-answering"]) {
      expect(content.includes(archetype)).toBe(true);
    }
  });

  it("release candidate document records prerelease publication and preserves certification boundaries", () => {
    const content = read("docs/vnext-preview-release-candidate.md");
    expect(content.includes("githubReleaseCreated: true")).toBe(true);
    expect(content.includes("githubReleaseType: prerelease")).toBe(true);
    expect(content.includes("npm publication")).toBe(true);
    expect(content.includes("not official production certification")).toBe(true);
    expect(content.includes("No npm package has been published.")).toBe(true);
    expect(content.includes("Production ready: Yes")).toBe(false);
  });

  it("release candidate document excludes real LLM, RAG, and knowledge base integration", () => {
    const content = read("docs/vnext-preview-release-candidate.md");
    expect(content.includes("real LLM / RAG / knowledge base integration")).toBe(true);
  });

  it("README links to the release candidate document and mentions three demo-enabled product archetypes", () => {
    const readme = read("README.md");
    expect(readme.includes("docs/vnext-preview-release-candidate.md")).toBe(true);
    expect(readme.includes("request-resolution")).toBe(true);
    expect(readme.includes("approval-decision")).toBe(true);
    expect(readme.includes("knowledge-answering")).toBe(true);
    expect(readme.includes("demo-enabled")).toBe(true);
  });

  it("release notes mention knowledge-answering Studio UI integration", () => {
    const releaseNotes = read("docs/release-notes-vnext-preview.md");
    expect(releaseNotes.includes("knowledge-answering Studio UI integration")).toBe(true);
  });

  it("release docs do not contain stale knowledge-answering UI wording", () => {
    const paths = [
      "README.md",
      "README.zh-CN.md",
      "CHANGELOG.md",
      "docs/release-notes-vnext-preview.md",
      "docs/creator-workbench.md",
      "docs/yutra-studio.md",
      "docs/creator-archetype-selection.md",
      "docs/knowledge-answering-basic.md",
      "docs/vnext-roadmap.md",
      "docs/vnext-preview-release-candidate.md"
    ];
    const stalePhrases = [
      "two archetypes",
      "2 archetypes",
      "两个母型",
      "knowledge-answering UI is not enabled",
      "knowledge-answering is coming soon",
      "currently supports request-resolution and approval-decision",
      "only supports request-resolution and approval-decision"
    ];

    for (const path of paths) {
      const content = read(path);
      for (const phrase of stalePhrases) {
        expect(content.includes(phrase)).toBe(false);
      }
    }
  });
});
