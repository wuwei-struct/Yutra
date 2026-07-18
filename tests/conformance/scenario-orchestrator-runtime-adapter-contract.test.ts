import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  YUTRA_RUNTIME_ADAPTER_CONTRACT_V1,
  resolveOrchestratorRuntimeCompatibility
} from "../../packages/scenario-orchestrator-runtime-contract/src";
import {
  CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT
} from "../../packages/scenario-orchestrator-core/src";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string =>
  readFileSync(resolve(root, path), "utf8");
const docsPath = "docs/scenario-orchestrator-runtime-adapter-contract.md";

describe("P6-11D.0 Orchestrator Runtime Adapter Contract conformance", () => {
  it("provides the independent contract package and Descriptor", () => {
    expect(
      existsSync(
        resolve(
          root,
          "packages/scenario-orchestrator-runtime-contract/package.json"
        )
      )
    ).toBe(true);
    expect(YUTRA_RUNTIME_ADAPTER_CONTRACT_V1).toMatchObject({
      schemaVersion: "1.0.0-preview",
      implementationStatus: "contract_only"
    });
  });

  it("defines Invocation Request and Result without an implementation", () => {
    const source = read(
      "packages/scenario-orchestrator-runtime-contract/src/types.ts"
    );
    expect(source).toContain("ScenarioSlotInvocationRequest");
    expect(source).toContain("ScenarioSlotInvocationResult");
    expect(source).toContain("interface ScenarioOrchestratorRuntimeAdapter");
    expect(
      "invokeSlot" in YUTRA_RUNTIME_ADAPTER_CONTRACT_V1
    ).toBe(false);
  });

  it("documents strict Engine and Adapter ownership", () => {
    const docs = read(docsPath);
    expect(docs).toContain("Engine and Adapter Responsibilities");
    expect(docs).toContain("must not select a Scenario Route");
    expect(docs).toContain("Action Closure preflight");
    expect(docs).toContain("Idempotency");
  });

  it("documents Trace/Audit parent-child and side-effect boundaries", () => {
    const docs = read(docsPath);
    expect(docs).toContain("parent-child relationship");
    expect(docs).toContain("Audit Reference");
    expect(docs).toContain("Side-effect Boundary");
    expect(docs).toContain(
      "none < read < write < external < financial < approval"
    );
  });

  it("keeps the current Yutra Runtime unsupported", () => {
    const document = structuredClone(
      CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT
    );
    const report = resolveOrchestratorRuntimeCompatibility({
      orchestratorDocument: document,
      adapterDescriptor: YUTRA_RUNTIME_ADAPTER_CONTRACT_V1,
      agentDslVersionsBySlot: {},
      actionClosureBySlot: {}
    });
    expect(report.currentRuntimeSupported).toBe(false);
    expect(report.compatible).toBe(false);
    expect(read(docsPath)).toContain("does not implement a Runtime Adapter");
  });

  it("keeps Studio Orchestrator Preview without Run", () => {
    const studioDocs = read("docs/studio-scenario-orchestrator-preview.md");
    expect(studioDocs).toContain("not expose Apply, Run");
    expect(studioDocs).toContain("cannot be executed");
  });

  it("links the Runtime Adapter Contract from both READMEs", () => {
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
