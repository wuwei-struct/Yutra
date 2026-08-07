import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-14A diagnostic-resolution fifth archetype conformance", () => {
  it("provides the Pack Config contract, compiler, and public example", () => {
    expect(existsSync(resolve(root, "packages/pack-config-core/src/diagnostic-resolution-config.ts"))).toBe(true);
    expect(existsSync(resolve(root, "packages/rule-compiler/src/diagnostic-resolution-compiler.ts"))).toBe(true);
    expect(existsSync(resolve(root, "examples/diagnostic-resolution-basic/pack.config.json"))).toBe(true);
    expect(existsSync(resolve(root, "examples/diagnostic-resolution-basic/README.md"))).toBe(true);
  });

  it("documents fifth Product Archetype Core, Compiler, CLI, and six artifacts", () => {
    const docs = read("docs/diagnostic-resolution-basic.md");
    expect(docs).toContain("fifth Product Archetype");
    expect(docs).toContain("Rule Impact metadata");
    expect(docs).toContain("yutra compile");
    expect(docs).toContain("six canonical compiler artifacts");
  });

  it("keeps Studio and Runtime outside this iteration", () => {
    const docs = read("docs/diagnostic-resolution-basic.md");
    expect(docs).toContain("Studio is not enabled");
    expect(docs).toContain("not connected to Runtime");
  });

  it("records diagnostic and remediation budgets plus explicit fail-closed paths", () => {
    const compiler = read("packages/rule-compiler/src/diagnostic-resolution-compiler.ts");
    expect(compiler).toContain("diagnosticRoundBudget");
    expect(compiler).toContain("remediationAttemptBudget");
    expect(compiler).toContain("diagnostic_budget_exhausted");
    expect(compiler).toContain("diagnostic_check_failed");
    expect(compiler).toContain("request_more_signals");
    expect(compiler).toContain("handoff");
    expect(compiler).toContain("stopped");
  });

  it("fixes mock-safe remediation at sideEffect none", () => {
    const compiler = read("packages/rule-compiler/src/diagnostic-resolution-compiler.ts");
    expect(compiler).toContain('{ name: "perform_mock_safe_remediation", sideEffect: "none"');
  });

  it("keeps the example generic and mock-only", () => {
    const parsed = JSON.parse(read("examples/diagnostic-resolution-basic/pack.config.json")) as {
      archetypeId: string;
      adapters: Array<{ mode: string; containsRealEndpoint: boolean; containsSecret: boolean }>;
      metadata: Record<string, boolean>;
    };
    expect(parsed.archetypeId).toBe("diagnostic-resolution");
    expect(parsed.adapters.every((adapter) => adapter.mode === "mock")).toBe(true);
    expect(parsed.adapters.every((adapter) => adapter.containsRealEndpoint === false && adapter.containsSecret === false)).toBe(true);
    expect(parsed.metadata).toMatchObject({
      containsCustomerData: false,
      containsPersonalData: false,
      containsRealDiagnosticAssets: false,
      containsRealSystemAccess: false,
      containsShellExecution: false,
      containsProductionRemediation: false
    });
  });

  it("links the diagnostic-resolution documentation from both READMEs", () => {
    expect(read("README.md")).toContain("docs/diagnostic-resolution-basic.md");
    expect(read("README.zh-CN.md")).toContain("docs/diagnostic-resolution-basic.md");
  });
});
