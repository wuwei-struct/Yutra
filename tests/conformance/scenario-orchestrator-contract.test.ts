import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT,
  CUSTOMER_COMPLAINT_ORCHESTRATOR_VALIDATION_CONTEXT,
  ECOMMERCE_REFUND_ORCHESTRATOR_CONTRACT,
  ECOMMERCE_REFUND_ORCHESTRATOR_VALIDATION_CONTEXT,
  validateScenarioOrchestrator
} from "../../packages/scenario-orchestrator-core/src";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string =>
  readFileSync(resolve(root, path), "utf8");

describe("P6-11C.0 scenario orchestrator contract conformance", () => {
  it("provides the independent scenario-orchestrator-core package", () => {
    expect(
      existsSync(resolve(root, "packages/scenario-orchestrator-core/package.json"))
    ).toBe(true);
    expect(
      JSON.parse(read("packages/scenario-orchestrator-core/package.json")).name
    ).toBe("@yutra/scenario-orchestrator-core");
  });

  it("fixes the document kind and preview execution flags", () => {
    expect(CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT.kind).toBe(
      "scenario_orchestrator"
    );
    expect(CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT.previewOnly).toBe(true);
    expect(CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT.runtimeExecutable).toBe(
      false
    );
  });

  it("uses single_active_slot_call_return with Primary-to-Supporting calls", () => {
    expect(CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT.executionModel).toBe(
      "single_active_slot_call_return"
    );
    const doc = read("docs/scenario-orchestrator-contract.md");
    expect(doc).toContain("At most one Product Archetype Slot is active");
    expect(doc).toContain("Only the Primary may explicitly invoke a Supporting Slot");
    expect(doc).toContain("resume_caller");
  });

  it("documents namespace isolation and forbidden implicit behavior", () => {
    const doc = read("docs/scenario-orchestrator-contract.md");
    expect(doc).toContain("Context Namespace Isolation");
    expect(doc).toContain("deep merge");
    expect(doc).toContain("adapterInheritanceAllowed=false");
    expect(doc).toContain("secretPropagationAllowed=false");
  });

  it("defines fail-closed routing and all fixed Terminals", () => {
    const doc = read("docs/scenario-orchestrator-contract.md");
    expect(doc).toContain("fail closed");
    expect(doc).toContain("$scenario_done");
    expect(doc).toContain("$human_handoff");
    expect(doc).toContain("$fail_closed");
  });

  it("defines the Orchestrator Trace event contract without Runtime emission", () => {
    const doc = read("docs/scenario-orchestrator-contract.md");
    expect(doc).toContain("orchestrator.started");
    expect(doc).toContain("orchestrator.completed");
    expect(doc).toContain("defines, but does not emit");
  });

  it("validates customer complaint and ecommerce refund fixtures", () => {
    expect(
      validateScenarioOrchestrator(
        CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT,
        CUSTOMER_COMPLAINT_ORCHESTRATOR_VALIDATION_CONTEXT
      ).ok
    ).toBe(true);
    expect(
      validateScenarioOrchestrator(
        ECOMMERCE_REFUND_ORCHESTRATOR_CONTRACT,
        ECOMMERCE_REFUND_ORCHESTRATOR_VALIDATION_CONTEXT
      ).ok
    ).toBe(true);
  });

  it("states that current Runtime cannot execute the contract", () => {
    const doc = read("docs/scenario-orchestrator-contract.md");
    expect(doc).toContain(
      "It is not currently executable by Yutra Runtime."
    );
    expect(doc).toContain("does not generate an `orchestrator.yutra.yaml` artifact");
    expect(read("docs/execution-standard.md")).toContain(
      "does not change this execution standard"
    );
  });

  it("links the Orchestrator Contract from both READMEs", () => {
    expect(read("README.md")).toContain(
      "docs/scenario-orchestrator-contract.md"
    );
    expect(read("README.zh-CN.md")).toContain(
      "docs/scenario-orchestrator-contract.md"
    );
  });

  it("preserves the published release record", () => {
    const candidate = read("docs/vnext-preview-release-candidate.md");
    expect(candidate).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(candidate).toContain(
      "releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451"
    );
  });
});
