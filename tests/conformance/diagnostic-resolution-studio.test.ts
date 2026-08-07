import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");

describe("P6-14B diagnostic-resolution Studio integration conformance", () => {
  it("ships a dedicated editor and enables the taxonomy card", () => {
    expect(existsSync(resolve(root, "apps/builder/src/components/creator/DiagnosticResolutionConfigEditor.tsx"))).toBe(true);
    expect(read("apps/builder/src/components/creator/CreatorConfigSection.tsx")).toContain("DiagnosticResolutionConfigEditor");
    expect(read("apps/builder/src/components/creator/archetype-taxonomy-ui.ts")).toContain(
      'manifest.archetypeId === "diagnostic-resolution"'
    );
  });

  it("declares five enabled Creator Product Archetypes and uses the built-in config", () => {
    const state = read("apps/builder/src/lib/creator-state.ts");
    expect(state).toContain('| "diagnostic-resolution"');
    expect(state).toContain('{ id: "diagnostic-resolution", label: "diagnostic-resolution / 诊断排障型", enabled: true }');
    expect(state).toContain("DIAGNOSTIC_RESOLUTION_BASIC_CONFIG");
  });

  it("consumes Core Rule Impact and Core-defined generic signals", () => {
    const helpers = read("apps/builder/src/components/creator/creator-ui-helpers.ts");
    const editor = read("apps/builder/src/components/creator/DiagnosticResolutionConfigEditor.tsx");
    expect(helpers).toContain("DIAGNOSTIC_RESOLUTION_RULE_IMPACTS");
    expect(editor).toContain("DIAGNOSTIC_RESOLUTION_DEMO_SIGNAL_IDS");
    expect(editor).not.toContain('type="text"');
  });

  it("keeps Compile Preview and DSL transfer manual", () => {
    const workbench = read("apps/builder/src/components/creator/CreatorWorkbenchPanel.tsx");
    expect(workbench).toContain("onResetCompiledDslMetadata");
    expect(workbench).toContain("onCompile");
    expect(workbench).not.toContain("runCurrentPreview");
    expect(read("apps/builder/src/components/creator/DiagnosticResolutionConfigEditor.tsx")).not.toContain("inspectDsl");
  });

  it("documents mock-only diagnostics with no device, shell, external-system, or Runtime access", () => {
    const docs = read("docs/diagnostic-resolution-basic.md");
    expect(docs).toContain("Creator Workbench is enabled");
    expect(docs).toContain("no automatic Inspect, Apply, Run, or Runtime integration");
    expect(docs).toContain("no device access or system mutation");
    expect(docs).toContain("no shell execution");
  });

  it("keeps package and published release records unchanged", () => {
    expect((JSON.parse(read("package.json")) as { version: string }).version).toBe("0.4.0-vnext-preview.1");
    expect(read("docs/releases/v0.4.0-vnext-preview.1.md")).toContain("v0.4.0-vnext-preview.1");
  });
});
