import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1,
  createInMemoryScenarioRuntimeAdapter
} from "../../packages/scenario-orchestrator-runtime-demo/src";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string =>
  readFileSync(resolve(root, path), "utf8");
const docsPath =
  "docs/scenario-orchestrator-in-memory-runtime-adapter.md";

describe("P6-11D.1 in-memory Scenario Runtime Adapter conformance", () => {
  it("ships an independent demo Runtime Adapter package", () => {
    expect(
      existsSync(
        resolve(
          root,
          "packages/scenario-orchestrator-runtime-demo/package.json"
        )
      )
    ).toBe(true);
    expect(typeof createInMemoryScenarioRuntimeAdapter).toBe("function");
    expect(YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1).toMatchObject({
      implementationStatus: "available",
      publicExposure: { mode: "demo_only" }
    });
  });

  it("documents one-Slot execution without Engine ownership", () => {
    const docs = read(docsPath);
    expect(docs).toContain("one Slot");
    expect(docs).toContain("does not select a Scenario Route");
    expect(docs).toContain("does not apply Composition Bindings");
    expect(docs).toMatch(/does\s+not maintain a Scenario call stack/);
    expect(docs).toMatch(/does\s+not declare the Scenario\s+completed/);
  });

  it("implements hash, Action Closure, and side-effect preflight", () => {
    const docs = read(docsPath);
    expect(docs).toContain("Artifact Hash Verification");
    expect(docs).toContain("Action Closure Preflight");
    expect(docs).toContain("Side-effect Preflight");
    expect(docs).toMatch(/fail(?:s)? closed/);
  });

  it("documents in-memory idempotency and bounded execution", () => {
    const docs = read(docsPath);
    expect(docs).toContain("Idempotency Ledger");
    expect(docs).toContain("Timeout and Concurrency");
    expect(docs).toContain("maxConcurrentSlotInvocations=1");
  });

  it("documents Trace Parent sidecar and redacted demo Audit references", () => {
    const docs = read(docsPath);
    expect(docs).toContain("Trace Parent Sidecar");
    expect(docs).toContain("Demo Audit Record");
    expect(docs).toContain("redacted");
    expect(docs).toMatch(/does\s+not .*emit\s+`orchestrator\.\*`/);
  });

  it("keeps implementation isolated from Builder and network/filesystem APIs", () => {
    const packageJson = read(
      "packages/scenario-orchestrator-runtime-demo/package.json"
    );
    const sourcePaths = [
      "packages/scenario-orchestrator-runtime-demo/src/in-memory-demo-runtime-adapter.ts",
      "packages/scenario-orchestrator-runtime-demo/src/in-memory-artifact-store.ts"
    ];
    expect(packageJson).not.toContain("@yutra/builder");
    for (const path of sourcePaths) {
      const source = read(path);
      expect(source).not.toMatch(/node:fs|node:https|node:http|fetch\(/);
      expect(source).not.toMatch(/process\.env/);
    }
  });

  it("keeps Studio without Orchestrator Run", () => {
    const studioDocs = read("docs/studio-scenario-orchestrator-preview.md");
    expect(studioDocs).toMatch(/does\s+not expose Apply, Run/);
    expect(studioDocs).toMatch(/no Orchestrator(?: Apply or)?\s+Run/);
  });

  it("links the demo Adapter documentation from both READMEs", () => {
    expect(read("README.md")).toContain(docsPath);
    expect(read("README.zh-CN.md")).toContain(docsPath);
  });

  it("preserves the published release record", () => {
    const publication = read("docs/vnext-preview-release-candidate.md");
    expect(publication).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(publication).toContain(
      "releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451"
    );
  });
});
