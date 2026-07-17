import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  COMPOSITION_ARTIFACT_FILENAMES,
  SLOT_ARTIFACT_FILENAMES,
  compileScenarioCompositionPreview
} from "@yutra/scenario-composition-compiler";
import {
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  ECOMMERCE_REFUND_COMPOSITION_DEMO,
  RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT,
  type ScenarioCompositionPlan
} from "@yutra/scenario-composition-core";
import {
  SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES,
  validateScenarioOrchestrator
} from "@yutra/scenario-orchestrator-core";
import { describe, expect, it } from "vitest";
import {
  CUSTOMER_COMPLAINT_ORCHESTRATOR_PROFILE,
  ECOMMERCE_REFUND_ORCHESTRATOR_PROFILE,
  ORCHESTRATOR_ARTIFACT_FILENAMES,
  compileScenarioOrchestratorPreview,
  createOrchestratorHash,
  toOrchestratorBundleReference,
  type ScenarioOrchestratorCompileProfile
} from "../src";

function clonePlan(
  plan: ScenarioCompositionPlan = CUSTOMER_COMPLAINT_COMPOSITION_DEMO
): ScenarioCompositionPlan {
  return structuredClone(plan);
}

function compileCustomer() {
  const output = compileScenarioOrchestratorPreview({
    compositionPlan: clonePlan()
  });
  expect(output.ok, output.ok ? "" : JSON.stringify(output.issues)).toBe(true);
  if (!output.ok) throw new Error("Expected customer compile success.");
  return output.result;
}

function compileRefund() {
  const output = compileScenarioOrchestratorPreview({
    compositionPlan: clonePlan(ECOMMERCE_REFUND_COMPOSITION_DEMO)
  });
  expect(output.ok, output.ok ? "" : JSON.stringify(output.issues)).toBe(true);
  if (!output.ok) throw new Error("Expected refund compile success.");
  return output.result;
}

function cloneCustomerProfile(): ScenarioOrchestratorCompileProfile {
  return structuredClone(CUSTOMER_COMPLAINT_ORCHESTRATOR_PROFILE);
}

describe("@yutra/scenario-orchestrator-compiler", () => {
  it("compiles customer complaint into an Orchestrator Preview", () => {
    const result = compileCustomer();
    expect(result.compositionId).toBe(
      "customer-complaint-composition-demo"
    );
    expect(result.orchestratorDocument.slots).toHaveLength(3);
  });

  it("compiles ecommerce refund into an Orchestrator Preview", () => {
    const result = compileRefund();
    expect(result.orchestratorDocument.slots).toHaveLength(2);
    expect(result.orchestratorDocument.entrySlotId).toBe(
      "refund_resolution"
    );
  });

  it("rejects renewal churn without a partial result", () => {
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: structuredClone(
        RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT
      )
    });
    expect(output.ok).toBe(false);
    expect(output.result).toBeUndefined();
    expect(output.issues[0]?.code).toBe(
      "ORCHESTRATOR_COMPOSITION_NOT_READY"
    );
  });

  it("uses the unique Primary Slot as entry", () => {
    const document = compileCustomer().orchestratorDocument;
    expect(
      document.slots.filter((slot) => slot.role === "primary")
    ).toHaveLength(1);
    expect(document.entrySlotId).toBe("complaint_resolution");
  });

  it("binds every Slot path and hash to Composition Slot Index values", () => {
    const result = compileCustomer();
    for (const slot of result.orchestratorDocument.slots) {
      const compiled = result.compositionResult.slots.find(
        (candidate) => candidate.slotId === slot.slotId
      );
      expect(slot.artifactRef.agentArtifactPath).toBe(
        `slots/${slot.slotId}/agent.yutra.yaml`
      );
      expect(slot.artifactRef.agentArtifactHash).toBe(
        compiled?.artifactHashes["agent.yutra.yaml"]
      );
      expect(slot.artifactRef.configHash).toBe(compiled?.configHash);
    }
  });

  it("keeps the explicit Compile Profile as the route semantics source", () => {
    const result = compileCustomer();
    expect(
      result.orchestratorDocument.routes.map((route) => route.priority)
    ).toEqual([10, 20, 30, 40, 50, 60]);
    expect(
      result.orchestratorDocument.routes[0]?.effect.type
    ).toBe("invoke_slot");
  });

  it("requires Profile coverage for every Composition Route", () => {
    const profile = cloneCustomerProfile();
    profile.routeProfiles.pop();
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: clonePlan(),
      compileProfile: profile
    });
    expect(output.ok).toBe(false);
    expect(output.issues.map((issue) => issue.code)).toContain(
      "ORCHESTRATOR_PROFILE_ROUTE_MISSING"
    );
  });

  it("rejects a Profile Route not declared by Composition", () => {
    const profile = cloneCustomerProfile();
    profile.routeProfiles.push({
      ...structuredClone(profile.routeProfiles[0]!),
      compositionRouteId: "undeclared_route",
      priority: 70
    });
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: clonePlan(),
      compileProfile: profile
    });
    expect(output.ok).toBe(false);
    expect(output.issues.map((issue) => issue.code)).toContain(
      "ORCHESTRATOR_PROFILE_ROUTE_EXTRA"
    );
  });

  it("rejects duplicate explicit priorities", () => {
    const profile = cloneCustomerProfile();
    profile.routeProfiles[1]!.priority =
      profile.routeProfiles[0]!.priority;
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: clonePlan(),
      compileProfile: profile
    });
    expect(output.ok).toBe(false);
    expect(output.issues.map((issue) => issue.code)).toContain(
      "ORCHESTRATOR_ROUTE_PRIORITY_CONFLICT"
    );
  });

  it("rejects a Profile for another Composition", () => {
    const profile = cloneCustomerProfile();
    profile.compositionId = "ecommerce-refund-composition-demo";
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: clonePlan(),
      compileProfile: profile
    });
    expect(output.ok).toBe(false);
    expect(output.issues.map((issue) => issue.code)).toContain(
      "ORCHESTRATOR_PROFILE_COMPOSITION_MISMATCH"
    );
  });

  it("rejects a Profile Slot-set mismatch", () => {
    const profile = cloneCustomerProfile();
    profile.slotProfiles.pop();
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: clonePlan(),
      compileProfile: profile
    });
    expect(output.ok).toBe(false);
    expect(output.issues.map((issue) => issue.code)).toContain(
      "ORCHESTRATOR_PROFILE_SLOT_MISMATCH"
    );
  });

  it("rejects an effect that contradicts its Composition Route", () => {
    const profile = cloneCustomerProfile();
    profile.routeProfiles[0]!.effect = {
      type: "fail_closed",
      terminalId: "$fail_closed"
    };
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: clonePlan(),
      compileProfile: profile
    });
    expect(output.ok).toBe(false);
    expect(output.issues.map((issue) => issue.code)).toContain(
      "ORCHESTRATOR_COMPILE_PROFILE_INVALID"
    );
  });

  it("requires an explicit built-in Profile", () => {
    const plan = clonePlan();
    plan.compositionId = "custom-composition-without-profile";
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: plan
    });
    expect(output.ok).toBe(false);
    expect(output.issues[0]?.code).toBe(
      "ORCHESTRATOR_COMPILE_PROFILE_NOT_FOUND"
    );
  });

  it("does not trust a supplied Composition planHash", () => {
    const composition = compileScenarioCompositionPreview(clonePlan());
    expect(composition.ok).toBe(true);
    if (!composition.ok) return;
    const supplied = structuredClone(composition.result);
    supplied.planHash = `sha256:${"0".repeat(64)}`;
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: clonePlan(),
      compositionResult: supplied
    });
    expect(output.ok).toBe(false);
    expect(output.issues[0]?.code).toBe(
      "ORCHESTRATOR_COMPOSITION_RESULT_MISMATCH"
    );
  });

  it("rejects a missing canonical Slot artifact", () => {
    const composition = compileScenarioCompositionPreview(clonePlan());
    expect(composition.ok).toBe(true);
    if (!composition.ok) return;
    const supplied = structuredClone(composition.result);
    delete (supplied.slots[0]!.artifacts as Record<string, string>)[
      "templates.json"
    ];
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: clonePlan(),
      compositionResult: supplied
    });
    expect(output.ok).toBe(false);
    expect(output.issues[0]?.code).toBe(
      "ORCHESTRATOR_SLOT_ARTIFACT_MISSING"
    );
  });

  it("rejects a mismatched Slot artifact hash", () => {
    const composition = compileScenarioCompositionPreview(clonePlan());
    expect(composition.ok).toBe(true);
    if (!composition.ok) return;
    const supplied = structuredClone(composition.result);
    supplied.slots[0]!.artifactHashes["agent.yutra.yaml"] =
      `sha256:${"0".repeat(64)}`;
    const output = compileScenarioOrchestratorPreview({
      compositionPlan: clonePlan(),
      compositionResult: supplied
    });
    expect(output.ok).toBe(false);
    expect(output.issues[0]?.code).toBe(
      "ORCHESTRATOR_SLOT_ARTIFACT_HASH_MISMATCH"
    );
  });

  it("marks the result preview-only and unsupported by current Runtime", () => {
    const result = compileCustomer();
    expect(result.previewOnly).toBe(true);
    expect(result.runtimeExecutable).toBe(false);
    expect(result.currentRuntimeSupported).toBe(false);
    expect(result.compileReport.noRuntimeExecution).toBe(true);
  });

  it("generates scenario.orchestrator.yaml as a contract artifact", () => {
    const yaml =
      compileCustomer().orchestratorArtifacts[
        "scenario.orchestrator.yaml"
      ];
    expect(yaml).toContain("kind: scenario_orchestrator");
    expect(yaml).toContain(
      "This is a preview-only scenario orchestrator contract"
    );
    expect(yaml).toContain("当前不能由 Yutra Runtime 执行");
  });

  it("does not generate a top-level Agent DSL", () => {
    const result = compileCustomer();
    expect(Object.keys(result.orchestratorArtifacts)).not.toContain(
      "agent.yutra.yaml"
    );
    expect(result.compileReport.noAgentDslGenerated).toBe(true);
  });

  it("returns exactly six Orchestrator artifacts", () => {
    const result = compileCustomer();
    expect(Object.keys(result.orchestratorArtifacts)).toEqual(
      ORCHESTRATOR_ARTIFACT_FILENAMES
    );
    expect(Object.keys(result.artifactHashes)).toEqual(
      ORCHESTRATOR_ARTIFACT_FILENAMES
    );
  });

  it("preserves the seven Composition artifacts", () => {
    expect(
      Object.keys(compileCustomer().compositionResult.compositionArtifacts)
    ).toEqual(COMPOSITION_ARTIFACT_FILENAMES);
  });

  it("preserves every Slot DSL and artifact hash", () => {
    const result = compileCustomer();
    const independentlyCompiled = compileScenarioCompositionPreview(
      clonePlan()
    );
    expect(independentlyCompiled.ok).toBe(true);
    if (!independentlyCompiled.ok) return;
    for (const [index, slot] of result.compositionResult.slots.entries()) {
      expect(slot.artifacts["agent.yutra.yaml"]).toBe(
        independentlyCompiled.result.slots[index]?.artifacts[
          "agent.yutra.yaml"
        ]
      );
      expect(slot.artifactHashes).toEqual(
        independentlyCompiled.result.slots[index]?.artifactHashes
      );
      expect(Object.keys(slot.artifacts)).toEqual(
        SLOT_ARTIFACT_FILENAMES
      );
    }
  });

  it("generates deterministic orchestrator and Bundle hashes", () => {
    const first = compileCustomer();
    const second = compileCustomer();
    expect(first.orchestratorHash).toBe(second.orchestratorHash);
    expect(first.previewBundleHash).toBe(second.previewBundleHash);
    expect(first.artifactHashes).toEqual(second.artifactHashes);
    expect(first.orchestratorArtifacts).toEqual(
      second.orchestratorArtifacts
    );
  });

  it("keeps local output paths out of deterministic hashes", () => {
    const result = compileCustomer();
    expect(JSON.stringify(result)).not.toContain("\\\\");
    expect(result.previewBundleHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("does not mutate the Plan, Composition Result, or Profile", () => {
    const plan = clonePlan();
    const composition = compileScenarioCompositionPreview(plan);
    expect(composition.ok).toBe(true);
    if (!composition.ok) return;
    const supplied = structuredClone(composition.result);
    const profile = cloneCustomerProfile();
    const before = structuredClone({ plan, supplied, profile });
    expect(
      compileScenarioOrchestratorPreview({
        compositionPlan: plan,
        compositionResult: supplied,
        compileProfile: profile
      }).ok
    ).toBe(true);
    expect({ plan, supplied, profile }).toEqual(before);
  });

  it("declares all 13 Trace events without emitting them", () => {
    const result = compileCustomer();
    const trace = JSON.parse(
      result.orchestratorArtifacts["orchestrator.trace-contract.json"]
    ) as {
      mandatoryEventTypes: string[];
      eventsEmittedInPreview: boolean;
    };
    expect(trace.mandatoryEventTypes).toEqual(
      SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES
    );
    expect(trace.eventsEmittedInPreview).toBe(false);
  });

  it("closes provenance over Composition routes, bindings, and overlays", () => {
    const result = compileCustomer();
    const provenance = result.orchestratorDocument.provenance;
    expect(provenance.routeSources).toHaveLength(
      CUSTOMER_COMPLAINT_COMPOSITION_DEMO.routes.length
    );
    expect(provenance.bindingSources).toHaveLength(
      CUSTOMER_COMPLAINT_COMPOSITION_DEMO.dataBindings.length
    );
    expect(provenance.overlaySources).toHaveLength(
      CUSTOMER_COMPLAINT_COMPOSITION_DEMO.crossCuttingOverlays.length
    );
    expect(createOrchestratorHash(result.orchestratorDocument)).toBe(
      result.orchestratorHash
    );
  });

  it("produces a document accepted by Orchestrator Core validation", () => {
    const result = compileCustomer();
    expect(
      validateScenarioOrchestrator(result.orchestratorDocument, {
        compositionPlan: CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
        compositionBundle: toOrchestratorBundleReference(
          result.compositionResult
        )
      })
    ).toEqual({ ok: true, issues: [] });
  });

  it("uses call-return routes and fixed fail-closed policies", () => {
    const document = compileRefund().orchestratorDocument;
    expect(document.executionModel).toBe(
      "single_active_slot_call_return"
    );
    expect(document.executionPolicy.missingRoute).toBe("fail_closed");
    expect(document.failurePolicy.partialScenarioSuccessAllowed).toBe(
      false
    );
  });

  it("contains no real integration or commercial values", () => {
    const serialized = JSON.stringify(compileCustomer()).toLowerCase();
    expect(serialized).not.toContain("https://");
    expect(serialized).not.toContain("api_key");
    expect(serialized).not.toContain("bearer ");
    expect(serialized).not.toContain("customer.example");
  });

  it("does not depend on Runtime or the DSL parser", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "..", "package.json"), "utf8")
    ) as { dependencies: Record<string, string> };
    expect(packageJson.dependencies["@yutra/runtime"]).toBeUndefined();
    expect(packageJson.dependencies["@yutra/dsl"]).toBeUndefined();
  });

  it("exposes both built-in explicit Profiles", () => {
    expect(CUSTOMER_COMPLAINT_ORCHESTRATOR_PROFILE.routeProfiles).toHaveLength(
      6
    );
    expect(ECOMMERCE_REFUND_ORCHESTRATOR_PROFILE.routeProfiles).toHaveLength(
      4
    );
  });
});
