import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const releaseNotesPath = "docs/releases/v0.3.0-vnext-preview.1.md";

function read(path: string): string {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

describe("P6-10C.2 exact vNext Preview release notes", () => {
  it("provides exact-version prerelease notes", () => {
    expect(existsSync(resolve(workspaceRoot, releaseNotesPath))).toBe(true);
    const content = read(releaseNotesPath);
    expect(content.includes("0.3.0-vnext-preview.1")).toBe(true);
    expect(content.includes("v0.3.0-vnext-preview.1")).toBe(true);
    expect(content.includes("GitHub prerelease")).toBe(true);
    expect(content.includes("Production ready: No")).toBe(true);
    expect(content.includes("npm published: No")).toBe(true);
  });

  it("lists all three demo-enabled product archetypes", () => {
    const content = read(releaseNotesPath);
    for (const archetype of ["request-resolution", "approval-decision", "knowledge-answering"]) {
      expect(content.includes(archetype)).toBe(true);
    }
  });

  it("links the release smoke evidence", () => {
    const content = read(releaseNotesPath);
    expect(content.includes("../vnext-preview-release-smoke.md")).toBe(true);
    expect(existsSync(resolve(workspaceRoot, "docs/vnext-preview-release-smoke.md"))).toBe(true);
  });

  it("links exact-version notes from both READMEs", () => {
    for (const path of ["README.md", "README.zh-CN.md"]) {
      expect(read(path).includes(releaseNotesPath)).toBe(true);
    }
  });

  it("records the exact version and date in the changelog", () => {
    const changelog = read("CHANGELOG.md");
    expect(changelog.includes("## [0.3.0-vnext-preview.1] - 2026-07-16")).toBe(true);
  });

  it("contains no endpoint, credential, or secret-like value", () => {
    const content = read(releaseNotesPath);
    expect(content).not.toMatch(/https?:\/\//i);
    expect(content).not.toMatch(/API_KEY|PRIVATE_KEY|PASSWORD|sk-[A-Za-z0-9_-]{8,}/i);
    expect(content.includes("real endpoints")).toBe(true);
    expect(content.includes("credentials")).toBe(true);
    expect(content.includes("real customer adapters")).toBe(true);
  });
});
