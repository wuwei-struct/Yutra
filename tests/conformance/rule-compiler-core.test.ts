import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG } from "@yutra/pack-config-core";
import { compilePackConfig } from "@yutra/rule-compiler";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

function text(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-04A rule compiler core conformance", () => {
  it("@yutra/rule-compiler package exists", () => {
    expect(existsSync(resolve(root, "packages/rule-compiler/package.json"))).toBe(true);
  });

  it("docs/rule-compiler-core.md exists and states public boundary", () => {
    const docPath = resolve(root, "docs/rule-compiler-core.md");
    expect(existsSync(docPath)).toBe(true);
    const doc = text("docs/rule-compiler-core.md");
    expect(doc).toContain("does not connect Runtime");
    expect(doc).toContain("connect Studio UI");
    expect(doc).toContain("customer SOP");
    expect(doc).toContain("real adapters");
  });

  it("README links to rule compiler core docs", () => {
    expect(text("README.md")).toContain("docs/rule-compiler-core.md");
    expect(text("README.zh-CN.md")).toContain("docs/rule-compiler-core.md");
  });

  it("compiler generates all 6 artifact filenames", () => {
    const output = compilePackConfig({ config: REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    expect(output.artifacts?.agent.filename).toBe("agent.yutra.yaml");
    expect(output.artifacts?.policy.filename).toBe("policy.yaml");
    expect(output.artifacts?.adapterConfig.filename).toBe("adapter.config.json");
    expect(output.artifacts?.templates.filename).toBe("templates.json");
    expect(output.artifacts?.testCases.filename).toBe("test-cases.json");
    expect(output.artifacts?.traceExpectation.filename).toBe("trace.expectation.json");
  });

  it("compiler report includes failClosedPolicy enabled and required artifacts", () => {
    const output = compilePackConfig({ config: REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG });
    expect(output.report.failClosedPolicy).toBe("enabled");
    expect(output.artifacts?.testCases.data).toHaveProperty("testCases");
    expect(output.artifacts?.traceExpectation.data).toHaveProperty("expectedEventTypes");
  });
});
