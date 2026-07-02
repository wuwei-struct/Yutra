import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-08E taxonomy-aware Creator Workbench selection conformance", () => {
  it("Creator Workbench docs mention the primary output selection principle", () => {
    expect(read("docs/creator-workbench.md")).toContain("What is the primary output of this agent?");
  });

  it("Studio docs mention taxonomy-aware archetype selection", () => {
    expect(read("docs/yutra-studio.md")).toContain("taxonomy-aware archetype selection");
  });

  it("README links to archetype taxonomy", () => {
    expect(read("README.md")).toContain("docs/archetype-taxonomy.md");
    expect(read("README.zh-CN.md")).toContain("docs/archetype-taxonomy.md");
  });

  it("UI source contains ArchetypeFitTestPanel and ArchetypeDetailPanel", () => {
    expect(read("apps/builder/src/components/creator/ArchetypeFitTestPanel.tsx")).toContain("Archetype Fit Test Panel");
    expect(read("apps/builder/src/components/creator/ArchetypeDetailPanel.tsx")).toContain("Archetype Detail Panel");
  });

  it("UI source does not claim all archetypes are compile-enabled", () => {
    const selector = read("apps/builder/src/components/creator/CreatorArchetypeSelector.tsx");
    const taxonomyUi = read("apps/builder/src/components/creator/archetype-taxonomy-ui.ts");
    expect(selector).toContain("comingSoon");
    expect(taxonomyUi).toContain('manifest.archetypeId === "request-resolution" || manifest.archetypeId === "approval-decision"');
    expect(selector).not.toContain("all archetypes are compile-enabled");
  });
});
