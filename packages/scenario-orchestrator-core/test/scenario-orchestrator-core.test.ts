import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT,
  CUSTOMER_COMPLAINT_ORCHESTRATOR_VALIDATION_CONTEXT,
  ECOMMERCE_REFUND_ORCHESTRATOR_CONTRACT,
  ECOMMERCE_REFUND_ORCHESTRATOR_VALIDATION_CONTEXT,
  SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES,
  explainScenarioOrchestrator,
  validateScenarioOrchestrator,
  type ScenarioOrchestratorDocument,
  type ScenarioOrchestratorIssueCode
} from "../src";

function cloneCustomer(): ScenarioOrchestratorDocument {
  return structuredClone(CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT);
}

function customerCodes(document: unknown): ScenarioOrchestratorIssueCode[] {
  return validateScenarioOrchestrator(
    document,
    CUSTOMER_COMPLAINT_ORCHESTRATOR_VALIDATION_CONTEXT
  ).issues.map((issue) => issue.code);
}

function expectCustomerIssue(
  mutate: (document: ScenarioOrchestratorDocument) => void,
  code: ScenarioOrchestratorIssueCode
): void {
  const document = cloneCustomer();
  mutate(document);
  expect(customerCodes(document)).toContain(code);
}

describe("@yutra/scenario-orchestrator-core", () => {
  it("validates the customer complaint contract", () => {
    expect(
      validateScenarioOrchestrator(
        CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT,
        CUSTOMER_COMPLAINT_ORCHESTRATOR_VALIDATION_CONTEXT
      )
    ).toEqual({ ok: true, issues: [] });
  });

  it("validates the ecommerce refund contract", () => {
    expect(
      validateScenarioOrchestrator(
        ECOMMERCE_REFUND_ORCHESTRATOR_CONTRACT,
        ECOMMERCE_REFUND_ORCHESTRATOR_VALIDATION_CONTEXT
      )
    ).toEqual({ ok: true, issues: [] });
  });

  it("uses the unique Primary Slot as entry", () => {
    const primary = CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT.slots.filter(
      (slot) => slot.role === "primary"
    );
    expect(primary).toHaveLength(1);
    expect(CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT.entrySlotId).toBe(
      primary[0]?.slotId
    );
  });

  it("rejects a Supporting Slot as entry", () => {
    expectCustomerIssue(
      (document) => {
        document.entrySlotId = "policy_explanation";
      },
      "ORCHESTRATOR_ENTRY_SLOT_INVALID"
    );
  });

  it("allows the Primary Slot to invoke Supporting Slots", () => {
    const invokes = CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT.routes.filter(
      (route) => route.effect.type === "invoke_slot"
    );
    expect(invokes.map((route) => route.fromSlotId)).toEqual([
      "complaint_resolution",
      "complaint_resolution"
    ]);
  });

  it("rejects Supporting-to-Supporting invocation", () => {
    expectCustomerIssue(
      (document) => {
        const route = document.routes.find(
          (candidate) => candidate.routeId === "return_policy_explanation"
        );
        if (!route) throw new Error("fixture route missing");
        route.effect = {
          type: "invoke_slot",
          targetSlotId: "compensation_decision",
          returnToSlotId: "policy_explanation"
        };
      },
      "ORCHESTRATOR_SUPPORTING_CALL_NOT_ALLOWED"
    );
  });

  it("rejects a self-call", () => {
    expectCustomerIssue(
      (document) => {
        const route = document.routes.find(
          (candidate) => candidate.routeId === "request_policy_explanation"
        );
        if (!route) throw new Error("fixture route missing");
        route.effect = {
          type: "invoke_slot",
          targetSlotId: "complaint_resolution",
          returnToSlotId: "complaint_resolution"
        };
      },
      "ORCHESTRATOR_SELF_CALL_NOT_ALLOWED"
    );
  });

  it("rejects a static invocation cycle", () => {
    expectCustomerIssue(
      (document) => {
        const route = document.routes.find(
          (candidate) => candidate.routeId === "return_policy_explanation"
        );
        if (!route) throw new Error("fixture route missing");
        route.effect = {
          type: "invoke_slot",
          targetSlotId: "complaint_resolution",
          returnToSlotId: "policy_explanation"
        };
      },
      "ORCHESTRATOR_ROUTE_CYCLE_NOT_ALLOWED"
    );
  });

  it("rejects duplicate Route priority for the same Slot and outcome", () => {
    expectCustomerIssue(
      (document) => {
        document.routes[1]!.fromSlotId = document.routes[0]!.fromSlotId;
        document.routes[1]!.outcome = document.routes[0]!.outcome;
        document.routes[1]!.priority = document.routes[0]!.priority;
      },
      "ORCHESTRATOR_ROUTE_PRIORITY_CONFLICT"
    );
  });

  it("rejects an unknown Route target", () => {
    expectCustomerIssue(
      (document) => {
        const route = document.routes[0]!;
        route.effect = {
          type: "invoke_slot",
          targetSlotId: "missing_slot",
          returnToSlotId: "complaint_resolution"
        };
      },
      "ORCHESTRATOR_ROUTE_TARGET_INVALID"
    );
  });

  it("rejects resume_caller from the Primary Slot", () => {
    expectCustomerIssue(
      (document) => {
        document.routes[0]!.effect = { type: "resume_caller" };
      },
      "ORCHESTRATOR_RESUME_WITHOUT_CALLER"
    );
  });

  it("rejects Supporting resume without an inbound invocation", () => {
    expectCustomerIssue(
      (document) => {
        document.routes = document.routes.filter(
          (route) => route.routeId !== "request_policy_explanation"
        );
        document.provenance.routeSources =
          document.provenance.routeSources.filter(
            (source) => source.routeId !== "request_policy_explanation"
          );
      },
      "ORCHESTRATOR_RESUME_WITHOUT_CALLER"
    );
  });

  it("rejects duplicate Slot IDs", () => {
    expectCustomerIssue(
      (document) => {
        document.slots[1]!.slotId = document.slots[0]!.slotId;
      },
      "ORCHESTRATOR_SLOT_DUPLICATE"
    );
  });

  it("rejects multiple Primary Slots", () => {
    expectCustomerIssue(
      (document) => {
        document.slots[1]!.role = "primary";
      },
      "ORCHESTRATOR_MULTIPLE_PRIMARY_SLOTS"
    );
  });

  it("rejects a Slot namespace collision", () => {
    expectCustomerIssue(
      (document) => {
        document.slots[1]!.artifactRef.namespace =
          document.slots[0]!.artifactRef.namespace;
      },
      "ORCHESTRATOR_SLOT_NAMESPACE_COLLISION"
    );
  });

  it("rejects a non-namespaced Slot artifact path", () => {
    expectCustomerIssue(
      (document) => {
        document.slots[1]!.artifactRef.agentArtifactPath =
          "agent.yutra.yaml";
      },
      "ORCHESTRATOR_SLOT_ARTIFACT_PATH_INVALID"
    );
  });

  it("rejects a missing Slot artifact hash", () => {
    expectCustomerIssue(
      (document) => {
        document.slots[1]!.artifactRef.agentArtifactHash = "";
      },
      "ORCHESTRATOR_SLOT_ARTIFACT_HASH_MISSING"
    );
  });

  it("rejects a missing required Binding", () => {
    expectCustomerIssue(
      (document) => {
        document.bindings = document.bindings.slice(1);
        document.provenance.bindingSources =
          document.provenance.bindingSources.slice(1);
      },
      "ORCHESTRATOR_BINDING_INVALID"
    );
  });

  it("rejects an unsupported Binding transform", () => {
    expectCustomerIssue(
      (document) => {
        (document.bindings[0] as { transform: string }).transform = "script";
      },
      "ORCHESTRATOR_BINDING_INVALID"
    );
  });

  it("rejects an undeclared Binding", () => {
    expectCustomerIssue(
      (document) => {
        const binding = structuredClone(document.bindings[0]!);
        binding.bindingId = "undeclared_binding";
        binding.provenanceRef.compositionBindingId = "undeclared_binding";
        document.bindings.push(binding);
        document.provenance.bindingSources.push({
          bindingId: binding.bindingId,
          compositionBindingId: binding.provenanceRef.compositionBindingId
        });
      },
      "ORCHESTRATOR_BINDING_INVALID"
    );
  });

  it("rejects implicit context merge", () => {
    expectCustomerIssue(
      (document) => {
        (document.contextPolicy as { implicitMergeAllowed: boolean }).implicitMergeAllowed =
          true;
      },
      "ORCHESTRATOR_IMPLICIT_MERGE_FORBIDDEN"
    );
  });

  it("rejects implicit adapter inheritance", () => {
    expectCustomerIssue(
      (document) => {
        (
          document.contextPolicy as { adapterInheritanceAllowed: boolean }
        ).adapterInheritanceAllowed = true;
      },
      "ORCHESTRATOR_ADAPTER_INHERITANCE_FORBIDDEN"
    );
  });

  it("rejects implicit secret propagation", () => {
    expectCustomerIssue(
      (document) => {
        (
          document.contextPolicy as { secretPropagationAllowed: boolean }
        ).secretPropagationAllowed = true;
      },
      "ORCHESTRATOR_SECRET_PROPAGATION_FORBIDDEN"
    );
  });

  it("rejects runtimeExecutable=true", () => {
    expectCustomerIssue(
      (document) => {
        (document as { runtimeExecutable: boolean }).runtimeExecutable = true;
      },
      "ORCHESTRATOR_RUNTIME_EXECUTABLE_FORBIDDEN"
    );
  });

  it("rejects an unsupported execution model", () => {
    expectCustomerIssue(
      (document) => {
        (document as { executionModel: string }).executionModel = "parallel";
      },
      "ORCHESTRATOR_EXECUTION_MODEL_UNSUPPORTED"
    );
  });

  it("rejects parallel scheduling", () => {
    expectCustomerIssue(
      (document) => {
        (
          document.executionPolicy as { parallelism: string }
        ).parallelism = "enabled";
      },
      "ORCHESTRATOR_BUDGET_INVALID"
    );
  });

  it("rejects recursion", () => {
    expectCustomerIssue(
      (document) => {
        (document.executionPolicy as { recursion: string }).recursion =
          "enabled";
      },
      "ORCHESTRATOR_BUDGET_INVALID"
    );
  });

  it("rejects maxCallDepth other than one", () => {
    expectCustomerIssue(
      (document) => {
        (
          document.executionPolicy.budgets as { maxCallDepth: number }
        ).maxCallDepth = 2;
      },
      "ORCHESTRATOR_CALL_DEPTH_UNSUPPORTED"
    );
  });

  it("rejects a non-positive execution budget", () => {
    expectCustomerIssue(
      (document) => {
        document.executionPolicy.budgets.maxSlotInvocations = 0;
      },
      "ORCHESTRATOR_BUDGET_INVALID"
    );
  });

  it("rejects an unreasonably large execution budget", () => {
    expectCustomerIssue(
      (document) => {
        document.executionPolicy.budgets.maxRouteEvaluations = 1025;
      },
      "ORCHESTRATOR_BUDGET_INVALID"
    );
  });

  it("rejects a missing fixed Terminal", () => {
    expectCustomerIssue(
      (document) => {
        document.terminals = document.terminals.filter(
          (terminal) => terminal.terminalId !== "$fail_closed"
        );
      },
      "ORCHESTRATOR_TERMINAL_INVALID"
    );
  });

  it("rejects a Supporting Slot completing the Scenario", () => {
    expectCustomerIssue(
      (document) => {
        const route = document.routes.find(
          (candidate) => candidate.fromSlotId === "policy_explanation"
        );
        if (!route) throw new Error("fixture route missing");
        route.effect = {
          type: "terminate",
          terminalId: "$scenario_done"
        };
      },
      "ORCHESTRATOR_TERMINAL_INVALID"
    );
  });

  it("requires Primary output for $scenario_done", () => {
    expectCustomerIssue(
      (document) => {
        const terminal = document.terminals.find(
          (candidate) => candidate.terminalId === "$scenario_done"
        );
        if (!terminal) throw new Error("fixture terminal missing");
        terminal.primaryOutputRequired = false;
      },
      "ORCHESTRATOR_PRIMARY_OUTPUT_REQUIRED"
    );
  });

  it("rejects incomplete precedence", () => {
    expectCustomerIssue(
      (document) => {
        document.precedencePolicyRef.rules =
          document.precedencePolicyRef.rules.slice(0, -1);
      },
      "ORCHESTRATOR_PRECEDENCE_INCOMPLETE"
    );
  });

  it("rejects an incomplete Trace event contract", () => {
    expectCustomerIssue(
      (document) => {
        document.tracePolicy.mandatoryEventTypes =
          document.tracePolicy.mandatoryEventTypes.slice(0, -1);
      },
      "ORCHESTRATOR_TRACE_POLICY_INCOMPLETE"
    );
  });

  it("defines all mandatory Orchestrator Trace event types without emitting them", () => {
    expect(SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES).toHaveLength(13);
    expect(CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT.tracePolicy.eventEmissionImplemented).toBe(
      false
    );
  });

  it("rejects incomplete provenance", () => {
    expectCustomerIssue(
      (document) => {
        document.provenance.slotSources =
          document.provenance.slotSources.slice(1);
      },
      "ORCHESTRATOR_PROVENANCE_INVALID"
    );
  });

  it("rejects a Composition Bundle hash mismatch", () => {
    expectCustomerIssue(
      (document) => {
        document.compositionRef.bundleHash = `sha256:${"0".repeat(64)}`;
      },
      "ORCHESTRATOR_COMPOSITION_REF_INVALID"
    );
  });

  it("rejects a public exposure risk flag", () => {
    expectCustomerIssue(
      (document) => {
        (
          document.publicExposure as { containsCustomerData: boolean }
        ).containsCustomerData = true;
      },
      "ORCHESTRATOR_PUBLIC_BOUNDARY_INVALID"
    );
  });

  it("rejects an unknown document field", () => {
    const document = cloneCustomer() as ScenarioOrchestratorDocument & {
      unexpected?: string;
    };
    document.unexpected = "forbidden";
    expect(customerCodes(document)).toContain("ORCHESTRATOR_SCHEMA_INVALID");
  });

  it("rejects a flattened or deep-merge field", () => {
    const document = cloneCustomer() as ScenarioOrchestratorDocument & {
      mergedPackConfig?: object;
    };
    document.mergedPackConfig = {};
    expect(customerCodes(document)).toContain(
      "ORCHESTRATOR_IMPLICIT_MERGE_FORBIDDEN"
    );
  });

  it("explains the contract in English", () => {
    const explanation = explainScenarioOrchestrator(
      CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT,
      "en"
    );
    expect(explanation).toContain("single_active_slot_call_return");
    expect(explanation).toContain(
      "It is not currently executable by Yutra Runtime."
    );
  });

  it("explains the contract in Chinese", () => {
    const explanation = explainScenarioOrchestrator(
      CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT,
      "zh-CN"
    );
    expect(explanation).toContain("Primary 显式调用 Supporting");
    expect(explanation).toContain("当前不能由 Yutra Runtime 执行");
  });

  it("keeps every Slot DSL as an external artifact reference", () => {
    const serialized = JSON.stringify(
      CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT
    );
    expect(serialized).toContain(
      "slots/policy_explanation/agent.yutra.yaml"
    );
    expect(serialized).not.toContain('"states"');
    expect(serialized).not.toContain('"actions"');
  });

  it("uses the fixed call-return and fail-closed policies", () => {
    const document = CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT;
    expect(document.executionPolicy.scheduling).toBe("single_active_slot");
    expect(document.executionPolicy.invocationModel).toBe("call_return");
    expect(document.executionPolicy.budgets.maxCallDepth).toBe(1);
    expect(document.executionPolicy.missingRoute).toBe("fail_closed");
    expect(document.failurePolicy.partialScenarioSuccessAllowed).toBe(false);
  });

  it("keeps handoff distinct from completion and non-resumable", () => {
    const handoff = CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT.terminals.find(
      (terminal) => terminal.terminalId === "$human_handoff"
    );
    expect(handoff?.status).toBe("handoff_required");
    expect(
      CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT.handoffPolicy.resumable
    ).toBe(false);
  });

  it("contains no real integration or commercial fixture values", () => {
    const serialized = JSON.stringify(
      CUSTOMER_COMPLAINT_ORCHESTRATOR_CONTRACT
    ).toLowerCase();
    expect(serialized).not.toContain("https://");
    expect(serialized).not.toContain("api_key");
    expect(serialized).not.toContain("private_key");
    expect(serialized).not.toContain("customer.example");
  });

  it("does not depend on Runtime or DSL packages", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "..", "package.json"), "utf8")
    ) as { dependencies: Record<string, string> };
    expect(packageJson.dependencies["@yutra/runtime"]).toBeUndefined();
    expect(packageJson.dependencies["@yutra/dsl"]).toBeUndefined();
  });
});
