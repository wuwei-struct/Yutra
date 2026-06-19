import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-08A Creator Workbench UI polish conformance", () => {
  it("docs mention Creator Workflow and the manual chain", () => {
    const docs = `${read("docs/creator-workbench.md")}\n${read("docs/yutra-studio.md")}`;
    expect(docs).toContain("Creator Workflow");
    expect(docs).toContain("Select archetype");
    expect(docs).toContain("Run Preview manually");
  });

  it("docs preserve demo/mock and no automatic Runtime boundaries", () => {
    const docs = `${read("docs/creator-workbench.md")}\n${read("docs/yutra-studio.md")}`;
    expect(docs).toContain("demo/mock");
    expect(docs).toContain("No automatic Runtime execution");
    expect(docs).toContain("does not run Runtime automatically");
  });

  it("README does not claim production readiness", () => {
    const readme = `${read("README.md")}\n${read("README.zh-CN.md")}`;
    expect(readme).toContain("Creator Workflow");
    expect(readme).toContain("does not represent production readiness");
    expect(readme).not.toContain("production ready");
  });

  it("UI source contains workflow stepper and boundary notice components", () => {
    expect(existsSync(resolve(root, "apps/builder/src/components/creator/CreatorWorkflowStepper.tsx"))).toBe(true);
    expect(existsSync(resolve(root, "apps/builder/src/components/creator/CreatorBoundaryNotice.tsx"))).toBe(true);
    expect(read("apps/builder/src/components/creator/CreatorWorkbenchPanel.tsx")).toContain("CreatorWorkflowStepper");
    expect(read("apps/builder/src/components/creator/CreatorWorkbenchPanel.tsx")).toContain("CreatorBoundaryNotice");
  });
});
