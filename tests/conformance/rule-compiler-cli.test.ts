import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-04B rule compiler CLI conformance", () => {
  it("docs/rule-compiler-cli.md exists", () => {
    expect(existsSync(resolve(root, "docs/rule-compiler-cli.md"))).toBe(true);
  });

  it("README links to rule compiler CLI docs", () => {
    expect(read("README.md")).toContain("docs/rule-compiler-cli.md");
    expect(read("README.zh-CN.md")).toContain("docs/rule-compiler-cli.md");
  });

  it("demo Pack Config exists and contains no real endpoint or secret", () => {
    const configPath = "examples/request-resolution-ecommerce-basic/pack.config.json";
    expect(existsSync(resolve(root, configPath))).toBe(true);
    const raw = read(configPath);
    const parsed = JSON.parse(raw) as {
      adapters: Array<{ mode: string; containsRealEndpoint: boolean; containsSecret: boolean }>;
    };

    expect(parsed.adapters.every((adapter) => adapter.mode === "mock")).toBe(true);
    expect(parsed.adapters.every((adapter) => adapter.containsRealEndpoint === false)).toBe(true);
    expect(parsed.adapters.every((adapter) => adapter.containsSecret === false)).toBe(true);
    expect(raw.toLowerCase()).not.toContain("https://");
    expect(raw.toLowerCase()).not.toContain("api_key");
    expect(raw.toLowerCase()).not.toContain("bearer ");
  });

  it("CLI docs state export is demo/mock and does not run Runtime", () => {
    const docs = read("docs/rule-compiler-cli.md");
    expect(docs).toContain("demo/mock");
    expect(docs).toContain("does not run Runtime");
    expect(docs).toContain("does not automatically run generated");
    expect(docs).toContain("no real API endpoints");
    expect(docs).toContain("no customer SOP");
  });

  it("CLI help source exposes compile command", () => {
    const cliSource = read("packages/cli/src/cli.ts");
    expect(cliSource).toContain("yutra compile <pack-config.json> --out <dir>");
  });
});
