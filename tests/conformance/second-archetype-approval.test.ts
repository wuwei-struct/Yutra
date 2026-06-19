import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-07A approval-decision second archetype conformance", () => {
  it("approval-decision demo Pack Config exists", () => {
    expect(existsSync(resolve(root, "examples/approval-decision-basic/pack.config.json"))).toBe(true);
    expect(existsSync(resolve(root, "examples/approval-decision-basic/README.md"))).toBe(true);
  });

  it("README mentions approval-decision as second archetype core support", () => {
    expect(read("README.md")).toContain("approval-decision second archetype core support");
    expect(read("README.zh-CN.md")).toContain("approval-decision 第二母型 core 支持");
  });

  it("docs state approval-decision UI is not yet enabled", () => {
    const combined = [
      read("docs/approval-decision-basic.md"),
      read("docs/rule-compiler-core.md"),
      read("docs/rule-compiler-cli.md"),
      read("docs/vnext-roadmap.md")
    ].join("\n");
    expect(combined).toContain("Creator Workbench UI is not enabled");
  });

  it("docs state approval-decision is demo/mock only", () => {
    const docs = read("docs/approval-decision-basic.md");
    expect(docs).toContain("public demo/mock");
    expect(docs).toContain("does not");
    expect(docs).toContain("customer SOP");
    expect(docs).toContain("real approval system adapters");
  });

  it("pack config contains no real endpoint, secret, or customer data", () => {
    const raw = read("examples/approval-decision-basic/pack.config.json");
    const parsed = JSON.parse(raw) as {
      adapters: Array<{ mode: string; containsRealEndpoint: boolean; containsSecret: boolean }>;
    };
    expect(parsed.adapters.every((adapter) => adapter.mode === "mock")).toBe(true);
    expect(parsed.adapters.every((adapter) => adapter.containsRealEndpoint === false)).toBe(true);
    expect(parsed.adapters.every((adapter) => adapter.containsSecret === false)).toBe(true);

    const lower = raw.toLowerCase();
    expect(lower).not.toContain("https://");
    expect(lower).not.toContain("api_key");
    expect(lower).not.toContain("bearer ");
    expect(lower).not.toContain("customer_name");
  });

  it("rule compiler support is documented without weakening public demo boundary", () => {
    expect(read("docs/rule-compiler-core.md")).toContain("Approval-decision Basic Compiler");
    expect(read("docs/public-demo-boundary.md")).toContain("mock/demo");
  });
});
