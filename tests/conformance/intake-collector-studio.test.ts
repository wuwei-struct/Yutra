import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");

describe("P6-13B intake-collector Studio integration conformance", () => {
  it("ships a dedicated intake Creator editor and enables the taxonomy card", () => {
    expect(existsSync(resolve(root, "apps/builder/src/components/creator/IntakeCollectorConfigEditor.tsx"))).toBe(true);
    expect(read("apps/builder/src/components/creator/CreatorConfigSection.tsx")).toContain("IntakeCollectorConfigEditor");
    expect(read("apps/builder/src/components/creator/archetype-taxonomy-ui.ts")).toContain(
      'manifest.archetypeId === "intake-collector"'
    );
  });

  it("retains intake-collector among the five enabled Creator Product Archetypes", () => {
    const state = read("apps/builder/src/lib/creator-state.ts");
    expect(state).toContain('| "intake-collector"');
    expect(state).toContain('| "diagnostic-resolution"');
    expect(state).toContain('{ id: "intake-collector", label: "intake-collector / 信息采集型", enabled: true }');
  });

  it("uses the built-in config and Core Rule Impact metadata", () => {
    expect(read("apps/builder/src/lib/creator-state.ts")).toContain("INTAKE_COLLECTOR_BASIC_CONFIG");
    const helpers = read("apps/builder/src/components/creator/creator-ui-helpers.ts");
    expect(helpers).toContain("INTAKE_COLLECTOR_RULE_IMPACTS");
    expect(helpers).toContain('archetypeId === "intake-collector"');
  });

  it("restricts required fields to generic demo identifiers", () => {
    const editor = read("apps/builder/src/components/creator/IntakeCollectorConfigEditor.tsx");
    expect(editor).toContain('["topic", "request_summary", "context_note"]');
    expect(editor).not.toContain("type=\"text\"");
    expect(editor).toContain("containsRealEndpoint=false");
    expect(editor).toContain("no personal data, customer form, database, CRM, or ERP");
  });

  it("keeps Compile Preview manual and clears stale DSL bridge metadata on archetype changes", () => {
    const workbench = read("apps/builder/src/components/creator/CreatorWorkbenchPanel.tsx");
    expect(workbench).toContain("onResetCompiledDslMetadata");
    expect(workbench).toContain("onCompile");
    expect(workbench).not.toContain("runCurrentPreview");
    expect(read("apps/builder/src/lib/studio-state.ts")).toContain("resetCompiledDslMetadata");
  });

  it("documents demo/mock Studio support without Runtime or real-system collection", () => {
    const docs = read("docs/intake-collector-basic.md");
    expect(docs).toContain("Creator Workbench is enabled");
    expect(docs).toContain("does not run Runtime automatically");
    expect(docs).toContain("no real personal data fields or records");
    expect(docs).toContain("no database or CRM/ERP connection");
  });

  it("keeps the current package version and release records unchanged", () => {
    expect((JSON.parse(read("package.json")) as { version: string }).version).toBe("0.4.0-vnext-preview.1");
    expect(read("docs/releases/v0.4.0-vnext-preview.1.md")).toContain("v0.4.0-vnext-preview.1");
  });
});
