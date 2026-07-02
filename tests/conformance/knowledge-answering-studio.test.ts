import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("P6-09B knowledge-answering Studio integration", () => {
  it("documents that knowledge-answering Studio UI is demo-enabled", () => {
    const doc = read("docs/knowledge-answering-basic.md");
    expect(doc).toContain("Creator Workbench demo UI integration");
    expect(doc).toContain("select `knowledge-answering`");
    expect(doc).toContain("does not inspect, apply, or run automatically");
  });

  it("Creator Workbench docs mention three enabled archetypes", () => {
    const doc = read("docs/creator-workbench.md");
    expect(doc).toContain("supports three archetypes");
    expect(doc).toContain("enabled: `request-resolution`");
    expect(doc).toContain("enabled: `approval-decision`");
    expect(doc).toContain("enabled: `knowledge-answering`");
  });

  it("README states Creator Workbench supports knowledge-answering without real providers", () => {
    const readme = read("README.md");
    expect(readme).toContain("knowledge-answering third archetype support");
    expect(readme).toContain("Creator Workbench demo-enabled UI");
    expect(readme).toContain("does not call a real LLM");
    expect(readme).toContain("does not connect real RAG or knowledge providers");
  });

  it("docs preserve demo and public boundary for knowledge-answering", () => {
    const doc = read("docs/knowledge-answering-basic.md");
    expect(doc).toContain("public demo/mock support only");
    expect(doc).toContain("call a real LLM");
    expect(doc).toContain("connect real RAG");
    expect(doc).toContain("include real knowledge base content");
  });

  it("UI source enables knowledge-answering editor without claiming Runtime integration", () => {
    const editor = read("apps/builder/src/components/creator/KnowledgeAnsweringConfigEditor.tsx");
    const selector = read("apps/builder/src/components/creator/archetype-taxonomy-ui.ts");
    const state = read("apps/builder/src/lib/creator-state.ts");
    expect(editor).toContain("KnowledgeAnsweringConfigEditor");
    expect(selector).toContain("knowledge-answering");
    expect(state).toContain('"knowledge-answering"');
    expect(editor).not.toContain("runPreview");
    expect(editor).not.toContain("Runtime integration");
  });
});
