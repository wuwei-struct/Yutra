import {
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  ECOMMERCE_REFUND_COMPOSITION_DEMO,
  RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT,
  type ScenarioCompositionPlan
} from "@yutra/scenario-composition-core";
import { compilePackConfig, type RuleCompilerOutput } from "@yutra/rule-compiler";
import { describe, expect, it } from "vitest";
import {
  COMPOSITION_ARTIFACT_FILENAMES,
  SLOT_ARTIFACT_FILENAMES,
  compileScenarioCompositionPreview
} from "../src";

function clonePlan(plan = CUSTOMER_COMPLAINT_COMPOSITION_DEMO): ScenarioCompositionPlan {
  return structuredClone(plan);
}

function compileCustomerComplaint() {
  const output = compileScenarioCompositionPreview(clonePlan());
  expect(output.ok).toBe(true);
  if (!output.ok) throw new Error("Expected compile success.");
  return output.result;
}

describe("scenario composition compile preview", () => {
  it("compiles the customer complaint composition", () => {
    const result = compileCustomerComplaint();
    expect(result.compositionId).toBe("customer-complaint-composition-demo");
    expect(result.slots).toHaveLength(3);
  });

  it("compiles the ecommerce refund composition", () => {
    const output = compileScenarioCompositionPreview(structuredClone(ECOMMERCE_REFUND_COMPOSITION_DEMO));
    expect(output.ok).toBe(true);
    if (!output.ok) throw new Error("Expected compile success.");
    expect(output.result.slots).toHaveLength(2);
    expect(output.result.slots.map((slot) => slot.archetypeId)).toEqual([
      "request-resolution",
      "approval-decision"
    ]);
  });

  it("rejects the contract-only renewal churn draft", () => {
    const output = compileScenarioCompositionPreview(structuredClone(RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT));
    expect(output.ok).toBe(false);
    expect(output.issues.map((issue) => issue.code)).toContain("COMPOSITION_NOT_COMPILE_READY");
    expect(output.result).toBeUndefined();
  });

  it("keeps Primary first and Supporting Slots in Plan order", () => {
    const result = compileCustomerComplaint();
    expect(result.slots.map((slot) => [slot.role, slot.archetypeId])).toEqual([
      ["primary", "request-resolution"],
      ["supporting", "knowledge-answering"],
      ["supporting", "approval-decision"]
    ]);
  });

  it("returns exactly six canonical artifacts per Slot", () => {
    const result = compileCustomerComplaint();
    for (const slot of result.slots) {
      expect(Object.keys(slot.artifacts)).toEqual(SLOT_ARTIFACT_FILENAMES);
      expect(Object.keys(slot.artifactHashes)).toEqual(SLOT_ARTIFACT_FILENAMES);
    }
  });

  it("returns seven composition preview artifacts", () => {
    const result = compileCustomerComplaint();
    expect(Object.keys(result.compositionArtifacts)).toEqual(COMPOSITION_ARTIFACT_FILENAMES);
  });

  it("uses collision-free namespaced Slot paths", () => {
    const result = compileCustomerComplaint();
    expect(result.slots.map((slot) => slot.namespace)).toEqual([
      "slots/complaint_resolution",
      "slots/policy_explanation",
      "slots/compensation_decision"
    ]);
    expect(new Set(result.slots.map((slot) => slot.namespace)).size).toBe(result.slots.length);
  });

  it("does not expose flattened or merged Pack Configs", () => {
    const result = compileCustomerComplaint();
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("flattenedConfig");
    expect(serialized).not.toContain("mergedPackConfig");
    expect(result.slots.every((slot) => !("packConfig" in slot))).toBe(true);
  });

  it("marks every result preview-only and non-executable", () => {
    const result = compileCustomerComplaint();
    expect(result.previewOnly).toBe(true);
    expect(result.runtimeExecutable).toBe(false);
    expect(result.compileReport.previewOnly).toBe(true);
    expect(result.compileReport.runtimeExecutable).toBe(false);
  });

  it("does not generate an orchestrator DSL", () => {
    const result = compileCustomerComplaint();
    expect(Object.keys(result.compositionArtifacts)).not.toContain("orchestrator.yutra.yaml");
    expect(Object.keys(result.compositionArtifacts).some((name) => name.endsWith(".yutra.yaml"))).toBe(false);
  });

  it("preserves Routes and identity Bindings without rewriting them", () => {
    const result = compileCustomerComplaint();
    const routes = JSON.parse(result.compositionArtifacts["composition.routes.json"]) as { routes: unknown[] };
    const bindings = JSON.parse(result.compositionArtifacts["composition.bindings.json"]) as {
      transformPolicy: string;
      dataBindings: unknown[];
    };
    expect(routes.routes).toEqual(CUSTOMER_COMPLAINT_COMPOSITION_DEMO.routes);
    expect(bindings.dataBindings).toEqual(CUSTOMER_COMPLAINT_COMPOSITION_DEMO.dataBindings);
    expect(bindings.transformPolicy).toBe("identity_only");
  });

  it("produces deterministic Plan and Bundle hashes", () => {
    const first = compileCustomerComplaint();
    const second = compileCustomerComplaint();
    expect(first.planHash).toBe(second.planHash);
    expect(first.bundleHash).toBe(second.bundleHash);
    expect(first.compositionArtifacts).toEqual(second.compositionArtifacts);
  });

  it("produces deterministic Slot artifact hashes", () => {
    const first = compileCustomerComplaint();
    const second = compileCustomerComplaint();
    expect(first.slots.map((slot) => slot.artifactHashes)).toEqual(
      second.slots.map((slot) => slot.artifactHashes)
    );
  });

  it("does not mutate the input Plan", () => {
    const plan = clonePlan();
    const before = structuredClone(plan);
    expect(compileScenarioCompositionPreview(plan).ok).toBe(true);
    expect(plan).toEqual(before);
  });

  it("fails closed without a partial result when a Slot compiler fails", () => {
    let calls = 0;
    const output = compileScenarioCompositionPreview(clonePlan(), {
      slotCompiler: (input) => {
        calls += 1;
        if (calls === 2) {
          return {
            ok: false,
            compileId: "compile:failed",
            compilerVersion: "0.1.0",
            mode: "preview",
            report: {
              status: "failed",
              archetypeId: input.config.archetypeId,
              archetypeVersion: input.config.archetypeVersion,
              packConfigId: input.config.packConfigId,
              packConfigVersion: input.config.packConfigVersion,
              packConfigHash: "sha256:failed",
              compilerVersion: "0.1.0",
              mode: "preview",
              coverage: {
                schema: "failed",
                requiredFields: "missing",
                transitions: "incomplete",
                actions: "unknown",
                guards: "unknown",
                sideEffects: "unsafe",
                handoff: "missing"
              },
              failClosedPolicy: "enabled",
              artifactHashes: {},
              warnings: []
            },
            issues: []
          };
        }
        return compilePackConfig(input);
      }
    });
    expect(output.ok).toBe(false);
    expect(output.result).toBeUndefined();
    expect(output.issues.map((issue) => issue.code)).toEqual([
      "COMPOSITION_SLOT_COMPILE_FAILED",
      "COMPOSITION_PARTIAL_RESULT_NOT_ALLOWED"
    ]);
  });

  it("fails when a Slot compiler omits a canonical artifact", () => {
    const output = compileScenarioCompositionPreview(clonePlan(), {
      slotCompiler: (input) => {
        const compiled = compilePackConfig(input);
        if (!compiled.artifacts) return compiled;
        const artifacts = { ...compiled.artifacts } as Partial<typeof compiled.artifacts>;
        delete artifacts.templates;
        return { ...compiled, artifacts } as RuleCompilerOutput;
      }
    });
    expect(output.ok).toBe(false);
    expect(output.result).toBeUndefined();
    expect(output.issues.map((issue) => issue.code)).toContain("COMPOSITION_SLOT_ARTIFACT_MISSING");
  });

  it("rejects a Plan that lacks Product Archetype compiler support", () => {
    const output = compileScenarioCompositionPreview(clonePlan(), {
      supportContext: {
        compilerEnabledArchetypeIds: ["request-resolution", "approval-decision"],
        workbenchEnabledArchetypeIds: ["request-resolution", "approval-decision", "knowledge-answering"],
        availableCrossCuttingArchetypeIds: ["human-handoff", "policy-guard"],
        compositionCompilerAvailable: true
      }
    });
    expect(output.ok).toBe(false);
    expect(output.issues[0]?.code).toBe("COMPOSITION_NOT_COMPILE_READY");
  });

  it("requires explicit Composition Compiler availability", () => {
    const output = compileScenarioCompositionPreview(clonePlan(), {
      supportContext: {
        compilerEnabledArchetypeIds: ["request-resolution", "approval-decision", "knowledge-answering"],
        workbenchEnabledArchetypeIds: ["request-resolution", "approval-decision", "knowledge-answering"],
        availableCrossCuttingArchetypeIds: ["human-handoff", "policy-guard"],
        compositionCompilerAvailable: false
      }
    });
    expect(output.ok).toBe(false);
    expect(output.issues[0]?.code).toBe("COMPOSITION_COMPILER_NOT_AVAILABLE");
  });

  it("rejects unsupported execution models", () => {
    const plan = clonePlan() as unknown as Record<string, unknown>;
    plan.executionModel = "deep_merge";
    const output = compileScenarioCompositionPreview(plan);
    expect(output.ok).toBe(false);
    expect(output.issues[0]?.code).toBe("COMPOSITION_EXECUTION_MODEL_UNSUPPORTED");
  });

  it("rejects duplicate Slot namespaces", () => {
    const plan = clonePlan();
    plan.slots[1]!.slotId = plan.slots[0]!.slotId;
    const output = compileScenarioCompositionPreview(plan);
    expect(output.ok).toBe(false);
    expect(output.issues[0]?.code).toBe("COMPOSITION_SLOT_NAMESPACE_COLLISION");
  });

  it("rejects unsafe Slot namespace segments", () => {
    const plan = clonePlan();
    plan.slots[1]!.slotId = "../policy_explanation";
    for (const route of plan.routes) {
      if (route.fromSlotId === "policy_explanation") route.fromSlotId = "../policy_explanation";
      if (route.toSlotId === "policy_explanation") route.toSlotId = "../policy_explanation";
    }
    for (const binding of plan.dataBindings) {
      if (binding.fromSlotId === "policy_explanation") binding.fromSlotId = "../policy_explanation";
      if (binding.toSlotId === "policy_explanation") binding.toSlotId = "../policy_explanation";
    }
    const output = compileScenarioCompositionPreview(plan);
    expect(output.ok).toBe(false);
    expect(output.issues[0]?.code).toBe("COMPOSITION_OUTPUT_PATH_UNSAFE");
  });

  it("contains no real endpoint, secret, or customer data", () => {
    const result = compileCustomerComplaint();
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain("https://");
    expect(serialized).not.toContain("api_key");
    expect(serialized).not.toContain("bearer ");
    expect(result.compileReport.publicBoundary).toEqual({
      mode: "demo_only",
      mockAdaptersOnly: true,
      containsRealEndpoint: false,
      containsSecret: false
    });
  });
});
