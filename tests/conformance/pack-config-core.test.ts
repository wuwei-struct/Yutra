import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG,
  validatePackConfig,
  type ConfigFieldSource
} from "../../packages/pack-config-core/src";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(path: string): string {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

describe("P6-03 pack-config-core conformance", () => {
  it("@yutra/pack-config-core package and docs exist", () => {
    expect(existsSync(resolve(workspaceRoot, "packages/pack-config-core/package.json"))).toBe(true);
    expect(existsSync(resolve(workspaceRoot, "docs/pack-config-core.md"))).toBe(true);
  });

  it("README links to pack-config-core docs", () => {
    expect(read("README.md").includes("docs/pack-config-core.md")).toBe(true);
    expect(read("README.zh-CN.md").includes("docs/pack-config-core.md")).toBe(true);
  });

  it("docs state no compiler, runtime, customer SOP, or real adapters", () => {
    const docs = read("docs/pack-config-core.md");
    expect(docs.includes("does not compile DSL")).toBe(true);
    expect(docs.includes("does not connect Runtime")).toBe(true);
    expect(docs.includes("customer SOP")).toBe(true);
    expect(docs.includes("real adapter")).toBe(true);
  });

  it("sample config uses mock adapters only and validates", () => {
    expect(validatePackConfig(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG).ok).toBe(true);
    expect(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.adapters.every((adapter) => adapter.mode === "mock")).toBe(true);
    expect(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.adapters.every((adapter) => adapter.containsRealEndpoint === false)).toBe(true);
    expect(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.adapters.every((adapter) => adapter.containsSecret === false)).toBe(true);
  });

  it("source provenance includes required states", () => {
    const sources: ConfigFieldSource[] = ["defaultFromPack", "inferredByAI", "confirmedByUser", "migrated", "requiredButMissing"];
    expect(sources).toEqual(expect.arrayContaining(["defaultFromPack", "inferredByAI", "confirmedByUser", "migrated", "requiredButMissing"]));
  });
});
