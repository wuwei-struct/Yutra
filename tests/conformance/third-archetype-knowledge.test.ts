import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-09A knowledge-answering third archetype conformance", () => {
  it("knowledge-answering demo Pack Config exists", () => {
    expect(existsSync(resolve(root, "examples/knowledge-answering-basic/pack.config.json"))).toBe(true);
    expect(existsSync(resolve(root, "examples/knowledge-answering-basic/README.md"))).toBe(true);
  });

  it("README mentions knowledge-answering as third archetype core support", () => {
    expect(read("README.md")).toContain("knowledge-answering third archetype support");
    expect(read("README.zh-CN.md")).toContain("knowledge-answering 第三母型支持");
  });

  it("docs state knowledge-answering UI is demo-enabled", () => {
    const combined = [
      read("docs/knowledge-answering-basic.md"),
      read("docs/rule-compiler-core.md"),
      read("docs/rule-compiler-cli.md"),
      read("docs/vnext-roadmap.md")
    ].join("\n");
    expect(combined).toContain("Creator Workbench demo UI integration");
    expect(combined).toContain("Creator Workbench demo UI");
  });

  it("docs state knowledge-answering is demo/mock only with no real provider", () => {
    const docs = read("docs/knowledge-answering-basic.md");
    expect(docs).toContain("public demo/mock");
    expect(docs).toContain("call a real LLM");
    expect(docs).toContain("real retrieval provider");
    expect(docs).toContain("real knowledge base content");
  });

  it("pack config contains no real endpoint, secret, customer data, or source URL", () => {
    const raw = read("examples/knowledge-answering-basic/pack.config.json");
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
    expect(lower).not.toContain("sourceurl");
    expect(lower).not.toContain("documentid");
  });

  it("rule compiler support is documented without weakening public demo boundary", () => {
    expect(read("docs/rule-compiler-core.md")).toContain("Knowledge-answering Basic Compiler");
    expect(read("docs/public-demo-boundary.md")).toContain("mock/demo");
  });
});
