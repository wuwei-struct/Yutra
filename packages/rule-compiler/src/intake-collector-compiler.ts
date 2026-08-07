import { createPackConfigFingerprint, type PackConfig } from "@yutra/pack-config-core";
import { compileAdapterConfigArtifact } from "./adapter-config-compiler";
import type { RuleCompilerArtifacts } from "./artifacts";
import { compilerVersion } from "./compiler-version";
import { createJsonArtifact, createYamlArtifact, createYamlTextArtifact } from "./serialize-artifacts";

function ruleValue<T>(config: PackConfig, key: string, fallback: T): T {
  return (config.rules[key]?.value as T | undefined) ?? fallback;
}

function incompleteTarget(config: PackConfig): "request_clarification" | "handoff" | "stopped" {
  const strategy = ruleValue<string>(config, "intakePolicy.incompleteStrategy", "ask_missing_fields");
  return strategy === "handoff" ? "handoff" : strategy === "stop_with_reason" ? "stopped" : "request_clarification";
}

function invalidTarget(config: PackConfig): "request_correction" | "handoff" {
  return ruleValue<string>(config, "intakePolicy.invalidFieldStrategy", "ask_correction") === "handoff"
    ? "handoff"
    : "request_correction";
}

function duplicateTarget(config: PackConfig): "confirm_record" | "handoff" | "stopped" {
  const strategy = ruleValue<string>(config, "intakePolicy.duplicateStrategy", "warn_and_confirm");
  return strategy === "handoff" ? "handoff" : strategy === "reject_duplicate" ? "stopped" : "confirm_record";
}

function completionTarget(config: PackConfig): "confirm_record" | "complete" {
  return ruleValue<boolean>(config, "validationPolicy.requireConfirmationBeforeComplete", true) ? "confirm_record" : "complete";
}

function budgetFallback(config: PackConfig): "handoff" | "stopped" {
  return ruleValue<string>(config, "intakePolicy.incompleteStrategy", "ask_missing_fields") === "stop_with_reason"
    ? "stopped"
    : "handoff";
}

function buildAgentSpec(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    agent: "intake-collector-basic",
    version: "0.1.0",
    intents: [{ name: "collect_structured_intake", entry_state: "start" }],
    context: {
      fields: {
        topic: { type: "string" },
        request_summary: { type: "string" },
        context_note: { type: "string" },
        fields_valid: { type: "boolean", default: true },
        missing_fields: { type: "boolean", default: false },
        duplicate_detected: { type: "boolean", default: false },
        clarification_budget_exhausted: { type: "boolean", default: false },
        record_confirmed: { type: "boolean", default: false }
      }
    },
    initial_state: "start",
    actions: [
      { name: "collect_demo_fields", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "validate_demo_fields", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "detect_missing_fields", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "check_demo_duplicate", sideEffect: "read", riskLevel: "low", requiresApproval: false },
      { name: "request_missing_fields", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "request_field_correction", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "request_record_confirmation", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "render_intake_complete", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "render_stop_with_reason", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "escalate_human", sideEffect: "external", riskLevel: "medium", requiresApproval: false }
    ],
    states: {
      start: {
        transitions: [{ to: "collect_fields" }]
      },
      collect_fields: {
        actions: ["collect_demo_fields"],
        transitions: [{ to: "validate_fields" }]
      },
      validate_fields: {
        actions: ["validate_demo_fields"],
        transitions: [
          { to: invalidTarget(config), when: "ctx.fields_valid == false" },
          { to: "detect_missing" }
        ]
      },
      detect_missing: {
        actions: ["detect_missing_fields"],
        transitions: [
          { to: incompleteTarget(config), when: "ctx.missing_fields == true" },
          { to: "check_duplicate" }
        ]
      },
      check_duplicate: {
        actions: ["check_demo_duplicate"],
        transitions: [
          { to: duplicateTarget(config), when: "ctx.duplicate_detected == true" },
          { to: completionTarget(config) }
        ]
      },
      request_clarification: {
        actions: ["request_missing_fields"],
        transitions: [
          { to: budgetFallback(config), when: "ctx.clarification_budget_exhausted == true" },
          { to: "collect_fields" }
        ]
      },
      request_correction: {
        actions: ["request_field_correction"],
        transitions: [
          { to: "handoff", when: "ctx.clarification_budget_exhausted == true" },
          { to: "collect_fields" }
        ]
      },
      confirm_record: {
        actions: ["request_record_confirmation"],
        transitions: [
          { to: "complete", when: "ctx.record_confirmed == true" },
          { to: "request_clarification" }
        ]
      },
      complete: {
        actions: ["render_intake_complete"],
        final: true
      },
      handoff: {
        actions: ["escalate_human"],
        handoff: true
      },
      stopped: {
        actions: ["render_stop_with_reason"],
        final: true
      }
    },
    metadata: {
      generatedBy: "yutra-rule-compiler",
      compilerVersion,
      packConfigId: config.packConfigId,
      configHash,
      clarificationBudget: ruleValue(config, "intakePolicy.maxClarificationRounds", 2),
      structuredOutput: "demo_intake_record",
      failClosed: true,
      publicDemoOnly: true,
      noRealPersonalData: true,
      noRealDatabase: true
    }
  };
}

function buildPolicy(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    generatedFrom: {
      packConfigId: config.packConfigId,
      archetypeId: config.archetypeId,
      configHash,
      compilerVersion
    },
    environment: config.governance.environment,
    requiredFieldPolicy: {
      requiredFields: ruleValue<string[]>(config, "intakePolicy.requiredFields", ["topic", "request_summary"]),
      missingFieldDetection: true
    },
    validationPolicy: {
      invalidFieldStrategy: ruleValue(config, "intakePolicy.invalidFieldStrategy", "ask_correction"),
      rejectUnknownFields: ruleValue(config, "validationPolicy.rejectUnknownFields", true),
      trimTextFields: ruleValue(config, "validationPolicy.trimTextFields", true),
      allowPartialDraft: ruleValue(config, "validationPolicy.allowPartialDraft", false)
    },
    clarificationBudget: {
      maxRounds: ruleValue(config, "intakePolicy.maxClarificationRounds", 2),
      exhaustedFallback: budgetFallback(config)
    },
    incompleteStrategy: ruleValue(config, "intakePolicy.incompleteStrategy", "ask_missing_fields"),
    duplicateStrategy: ruleValue(config, "intakePolicy.duplicateStrategy", "warn_and_confirm"),
    completionConfirmation: {
      required: ruleValue(config, "validationPolicy.requireConfirmationBeforeComplete", true)
    },
    failClosedBoundary: {
      enabled: true,
      invalidOrAmbiguousOutcome: "handoff_or_stop",
      noImplicitCompletion: true
    },
    adapterSafety: {
      allAdaptersMock: config.adapters.every((adapter) => adapter.mode === "mock"),
      containsRealEndpoint: false,
      containsSecret: false,
      noRealDatabase: true
    }
  };
}

function buildTemplates(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    generatedFrom: { packConfigId: config.packConfigId, configHash },
    tone: ruleValue(config, "responseStyle.tone", "neutral"),
    ask_missing_info: "Demo: provide the missing generic fields before intake can continue.",
    ask_missing_fields: {
      purpose: "List generic fields still required for the demo record.",
      includeMissingFieldList: ruleValue(config, "responseStyle.includeMissingFieldList", true)
    },
    ask_field_correction: {
      purpose: "Request correction of a generic field that failed validation.",
      includeValidationReason: ruleValue(config, "responseStyle.includeValidationReason", true)
    },
    duplicate_confirmation: {
      purpose: "Ask whether a detected generic duplicate should continue."
    },
    intake_complete: {
      purpose: "Confirm that the structured demo intake record is complete.",
      includeNextSteps: ruleValue(config, "responseStyle.includeNextSteps", true)
    },
    handoff: { purpose: "Explain that the demo intake requires human handling." },
    stop_with_reason: { purpose: "Stop safely and explain that the demo intake remains incomplete." }
  };
}

function buildTestCases(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    generatedFrom: { packConfigId: config.packConfigId, configHash },
    testCases: [
      {
        testCaseId: "intake_complete",
        title: "Complete intake reaches completion",
        input: { topic: "demo_topic", request_summary: "demo_summary", record_confirmed: true },
        expectedOutcome: "complete"
      },
      {
        testCaseId: "intake_missing_fields",
        title: "Missing fields request clarification",
        input: { topic: "demo_topic", missing_fields: true },
        expectedOutcome: "request_clarification"
      },
      {
        testCaseId: "intake_invalid_field",
        title: "Invalid field requests correction",
        input: { fields_valid: false },
        expectedOutcome: invalidTarget(config)
      },
      {
        testCaseId: "intake_clarification_budget_exhausted",
        title: "Clarification budget exhaustion uses configured fallback",
        input: { missing_fields: true, clarification_budget_exhausted: true },
        expectedOutcome: budgetFallback(config)
      },
      {
        testCaseId: "intake_duplicate",
        title: "Duplicate uses configured strategy",
        input: { duplicate_detected: true },
        expectedOutcome: duplicateTarget(config)
      },
      {
        testCaseId: "intake_confirmation_required",
        title: "Confirmation occurs before completion",
        input: { topic: "demo_topic", request_summary: "demo_summary", record_confirmed: false },
        expectedOutcome: completionTarget(config)
      }
    ]
  };
}

function buildTraceExpectation(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    generatedFrom: { packConfigId: config.packConfigId, configHash, compilerVersion },
    expectedEventTypes: [
      "run.started",
      "state.entered",
      "guard.evaluated",
      "action.started",
      "action.succeeded",
      "transition.resolved",
      "handoff.requested",
      "run.completed",
      "run.failed"
    ],
    expectedMarkers: {
      requiredFieldGuard: "missing_fields",
      validationGuard: "field_validation_failed",
      duplicateGuard: "duplicate_detected",
      clarificationBudget: ruleValue(config, "intakePolicy.maxClarificationRounds", 2),
      confirmationGuard: "record_confirmed",
      failClosed: true
    },
    expectedPaths: [
      { id: "complete", events: ["guard.evaluated", "transition.resolved", "run.completed"] },
      { id: "missing_fields", events: ["guard.evaluated", "transition.resolved", "action.succeeded"] },
      { id: "handoff", events: ["guard.evaluated", "handoff.requested"] }
    ]
  };
}

export function intakeCollectorCompiler(config: PackConfig): RuleCompilerArtifacts {
  const configHash = createPackConfigFingerprint(config);
  return {
    agent: createYamlTextArtifact("agent.yutra.yaml", "agent", buildAgentSpec(config, configHash)),
    policy: createYamlArtifact("policy.yaml", "policy", buildPolicy(config, configHash)),
    adapterConfig: createJsonArtifact(
      "adapter.config.json",
      "adapter_config",
      compileAdapterConfigArtifact(config, configHash)
    ),
    templates: createJsonArtifact("templates.json", "templates", buildTemplates(config, configHash)),
    testCases: createJsonArtifact("test-cases.json", "test_cases", buildTestCases(config, configHash)),
    traceExpectation: createJsonArtifact(
      "trace.expectation.json",
      "trace_expectation",
      buildTraceExpectation(config, configHash)
    )
  };
}
