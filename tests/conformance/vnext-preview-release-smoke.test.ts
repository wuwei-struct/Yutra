import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(path: string): string {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

describe("P6-10B.1 vNext Preview release smoke evidence", () => {
  it("records smoke evidence for all three archetypes", () => {
    const path = resolve(workspaceRoot, "docs/vnext-preview-release-smoke.md");
    expect(existsSync(path)).toBe(true);

    const content = read("docs/vnext-preview-release-smoke.md");
    for (const archetype of ["request-resolution", "approval-decision", "knowledge-answering"]) {
      expect(content.includes(archetype)).toBe(true);
    }
  });

  it("records smoke and tag readiness after package version alignment", () => {
    const content = read("docs/vnext-preview-release-smoke.md");
    expect(content.includes("releaseSmokeReady: true")).toBe(true);
    expect(content.includes("releaseTagReady: true")).toBe(true);
    expect(content.includes("releaseTagBlocker: none")).toBe(true);
  });

  it("records the successful knowledge-answering manual run", () => {
    const content = read("docs/vnext-preview-release-smoke.md");
    expect(content.includes("run.completed")).toBe(true);
    expect(content.includes("action.succeeded")).toBe(true);
    expect(content.includes("transition.resolved")).toBe(true);
    expect(content.includes("No automatic Runtime execution occurred.")).toBe(true);
  });

  it("preserves publication and integration boundaries", () => {
    const content = read("docs/vnext-preview-release-smoke.md");
    expect(content.includes("No real LLM / RAG / knowledge base was called.")).toBe(true);
    expect(content.includes("No Git tag was created in this task.")).toBe(true);
    expect(content.includes("No GitHub Release was created in this task.")).toBe(true);
    expect(content.includes("No npm publication was performed.")).toBe(true);
  });

  it("links the smoke evidence from the release candidate", () => {
    const content = read("docs/vnext-preview-release-candidate.md");
    expect(content.includes("vnext-preview-release-smoke.md")).toBe(true);
    expect(content.includes("releaseSmokeReady: true")).toBe(true);
    expect(content.includes("releaseTagReady: true")).toBe(true);
    expect(content.includes("releaseTagBlocker: none")).toBe(true);
  });
});
