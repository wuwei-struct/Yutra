import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BUILTIN_ARCHETYPE_MANIFESTS,
  CROSS_CUTTING_ARCHETYPE_IDS,
  MAIN_ARCHETYPE_IDS,
  validateArchetypeRegistry
} from "../../packages/archetype-core/src";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(path: string): string {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

describe("P6-02 archetype-core conformance", () => {
  it("@yutra/archetype-core package exists", () => {
    expect(existsSync(resolve(workspaceRoot, "packages/archetype-core/package.json"))).toBe(true);
  });

  it("archetype-core exports 10 main and 4 cross-cutting ids", () => {
    expect(MAIN_ARCHETYPE_IDS).toHaveLength(10);
    expect(CROSS_CUTTING_ARCHETYPE_IDS).toHaveLength(4);
  });

  it("builtin manifests validate and expose safe public fields", () => {
    expect(BUILTIN_ARCHETYPE_MANIFESTS).toHaveLength(14);
    expect(validateArchetypeRegistry(BUILTIN_ARCHETYPE_MANIFESTS).ok).toBe(true);

    for (const manifest of BUILTIN_ARCHETYPE_MANIFESTS) {
      expect(manifest.publicExposure.containsCustomerAssets).toBe(false);
      expect(manifest.publicExposure.containsRealEndpoints).toBe(false);
      expect(manifest.publicExposure.containsCommercialSop).toBe(false);
    }
  });

  it("README links to archetype-core docs", () => {
    expect(read("README.md").includes("docs/archetype-core.md")).toBe(true);
    expect(read("README.zh-CN.md").includes("docs/archetype-core.md")).toBe(true);
  });

  it("archetype-core docs state public OSS boundaries", () => {
    const docs = read("docs/archetype-core.md");
    expect(docs.includes("does not compile DSL")).toBe(true);
    expect(docs.includes("does not")).toBe(true);
    expect(docs.includes("customer SOP")).toBe(true);
    expect(docs.includes("real adapters or endpoints")).toBe(true);
    expect(docs.includes("Rule Compiler")).toBe(true);
  });
});
