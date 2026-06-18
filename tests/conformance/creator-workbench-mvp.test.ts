import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-05A Creator Workbench MVP conformance", () => {
  it("creator docs mention compile preview", () => {
    const docs = read("docs/creator-workbench.md");
    expect(docs).toContain("Compile Preview");
    expect(docs).toContain("POST /creator/compile-preview");
  });

  it("README links to Creator Workbench and Rule Compiler docs", () => {
    const readme = read("README.md");
    const readmeZh = read("README.zh-CN.md");

    expect(readme).toContain("docs/creator-workbench.md");
    expect(readme).toContain("docs/rule-compiler-core.md");
    expect(readmeZh).toContain("docs/creator-workbench.md");
    expect(readmeZh).toContain("docs/rule-compiler-core.md");
  });

  it("builder contains Creator Workbench panel", () => {
    expect(existsSync(resolve(root, "apps/builder/src/components/creator/CreatorWorkbenchPanel.tsx"))).toBe(
      true
    );
    expect(read("apps/builder/src/components/studio/DraftAssistantColumn.tsx")).toContain(
      "CreatorWorkbenchPanel"
    );
  });

  it("builder contains send compiled DSL bridge function", () => {
    expect(read("apps/builder/src/lib/studio-state.ts")).toContain("sendCompiledDslToEditor");
    expect(read("apps/builder/src/components/creator/CreatorWorkbenchPanel.tsx")).toContain(
      "Send agent.yutra.yaml to DSL Editor"
    );
  });

  it("builder-runner exposes compile preview endpoint", () => {
    expect(read("apps/builder-runner/src/server.ts")).toContain("/creator/compile-preview");
    expect(read("apps/builder-runner/README.md")).toContain("POST /creator/compile-preview");
  });

  it("docs state Creator Workbench does not run Runtime automatically", () => {
    const docs = `${read("docs/creator-workbench.md")}\n${read("docs/yutra-studio.md")}`;
    expect(docs).toContain("does not run Runtime");
    expect(docs).toContain("does not execute generated DSL");
  });

  it("docs mention manual DSL bridge and inspect-before-run boundary", () => {
    const docs = `${read("docs/creator-workbench.md")}\n${read("docs/yutra-studio.md")}`;
    expect(docs).toContain("Manual DSL Bridge");
    expect(docs).toContain("Send `agent.yutra.yaml` to DSL Editor");
    expect(docs).toContain("Inspect DSL");
    expect(docs).toContain("does not apply DSL as run source");
    expect(docs).toContain("not trusted until it passes Inspect DSL");
  });

  it("README does not claim Creator Workbench auto-runs Runtime", () => {
    const readme = `${read("README.md")}\n${read("README.zh-CN.md")}`;
    expect(readme).toContain("compiled `agent.yutra.yaml` to the DSL Editor");
    expect(readme).toContain("compiled DSL must be inspected");
    expect(readme).toContain("Compile Preview does not run Runtime");
    expect(readme).not.toContain("Creator Workbench auto-runs Runtime");
  });

  it("docs state request-resolution is first supported archetype", () => {
    const docs = read("docs/creator-workbench.md");
    expect(docs).toContain("supports only one archetype");
    expect(docs).toContain("request-resolution");
    expect(docs).toContain("disabled / coming later");
  });

  it("docs state MVP is demo/mock with no real adapters or customer SOP", () => {
    const docs = `${read("docs/creator-workbench.md")}\n${read("apps/builder-runner/README.md")}`;
    expect(docs).toContain("demo/mock");
    expect(docs).toContain("mock");
    expect(docs).toContain("real endpoints");
    expect(docs).toContain("customer SOP");
  });
});
