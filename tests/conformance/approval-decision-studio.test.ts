import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-07B approval-decision Studio UI conformance", () => {
  it("docs state approval-decision Creator Workbench UI is demo-enabled", () => {
    const docs = `${read("docs/approval-decision-basic.md")}\n${read("docs/creator-workbench.md")}\n${read("docs/yutra-studio.md")}`;
    expect(docs).toContain("approval-decision");
    expect(docs).toContain("Creator Workbench UI is demo-enabled");
    expect(docs).toContain("demo/mock");
  });

  it("README mentions approval-decision Creator Workbench support", () => {
    const readme = `${read("README.md")}\n${read("README.zh-CN.md")}`;
    expect(readme).toContain("approval-decision");
    expect(readme).toContain("Creator Workbench");
    expect(readme).toContain("demo-enabled");
  });

  it("docs preserve public demo boundary for approval-decision", () => {
    const docs = `${read("docs/approval-decision-basic.md")}\n${read("docs/public-demo-boundary.md")}`;
    expect(docs).toContain("does not include customer SOP");
    expect(docs).toContain("does not include real approval system adapters");
    expect(docs).toContain("does not include real organization data");
  });

  it("Studio source enables approval-decision without enabling unsupported archetypes", () => {
    const state = read("apps/builder/src/lib/creator-state.ts");
    expect(state).toContain('{ id: "approval-decision"');
    expect(state).toContain('label: "approval-decision / 审批裁决型", enabled: true');
    expect(state).toContain('{ id: "knowledge-answering"');
    expect(state).toContain('label: "knowledge-answering / 知识问答型", enabled: false');
  });
});
