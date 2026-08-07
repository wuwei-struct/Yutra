import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-13A intake-collector fourth archetype conformance", () => {
  it("provides the Pack Config contract, compiler, and demo example", () => {
    expect(existsSync(resolve(root, "packages/pack-config-core/src/intake-collector-config.ts"))).toBe(true);
    expect(existsSync(resolve(root, "packages/rule-compiler/src/intake-collector-compiler.ts"))).toBe(true);
    expect(existsSync(resolve(root, "examples/intake-collector-basic/pack.config.json"))).toBe(true);
    expect(existsSync(resolve(root, "examples/intake-collector-basic/README.md"))).toBe(true);
  });

  it("documents the fourth archetype Core, Compiler, and CLI support", () => {
    const docs = read("docs/intake-collector-basic.md");
    expect(docs).toContain("fourth Product Archetype");
    expect(docs).toContain("Rule Impact metadata");
    expect(docs).toContain("yutra compile");
    expect(docs).toContain("six canonical compiler artifacts");
  });

  it("keeps Studio and Runtime outside this iteration", () => {
    const docs = read("docs/intake-collector-basic.md");
    expect(docs).toContain("Studio UI is not enabled");
    expect(docs).toContain("not connected to Runtime");
  });

  it("keeps the public example generic and mock-only", () => {
    const raw = read("examples/intake-collector-basic/pack.config.json");
    const parsed = JSON.parse(raw) as {
      archetypeId: string;
      adapters: Array<{ mode: string; containsRealEndpoint: boolean; containsSecret: boolean }>;
      metadata: Record<string, boolean>;
    };
    expect(parsed.archetypeId).toBe("intake-collector");
    expect(parsed.adapters.every((adapter) => adapter.mode === "mock")).toBe(true);
    expect(parsed.adapters.every((adapter) => adapter.containsRealEndpoint === false)).toBe(true);
    expect(parsed.adapters.every((adapter) => adapter.containsSecret === false)).toBe(true);
    expect(parsed.metadata).toMatchObject({
      containsCustomerData: false,
      containsPersonalData: false,
      containsRealForm: false,
      containsRealDatabaseConfig: false
    });
  });

  it("does not add personal-data fields or real-system configuration", () => {
    const raw = read("examples/intake-collector-basic/pack.config.json").toLowerCase();
    expect(raw).not.toContain("https://");
    expect(raw).not.toContain("api_key");
    expect(raw).not.toContain("phone_number");
    expect(raw).not.toContain("identity_number");
    expect(raw).not.toContain("street_address");
    expect(raw).not.toContain("crm_endpoint");
  });

  it("README links the intake-collector documentation", () => {
    expect(read("README.md")).toContain("docs/intake-collector-basic.md");
    expect(read("README.zh-CN.md")).toContain("docs/intake-collector-basic.md");
  });
});
