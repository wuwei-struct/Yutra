import { createPackConfigFingerprint, type PackConfig } from "@yutra/pack-config-core";
import { compileAdapterConfigArtifact } from "./adapter-config-compiler";
import type { RuleCompilerArtifacts } from "./artifacts";
import { compilerVersion } from "./compiler-version";
import { createJsonArtifact, createYamlArtifact, createYamlTextArtifact } from "./serialize-artifacts";

function ruleValue<T>(config: PackConfig, key: string, fallback: T): T {
  return (config.rules[key]?.value as T | undefined) ?? fallback;
}

function inconclusiveTarget(config: PackConfig): "request_more_signals" | "handoff" | "stopped" {
  const strategy = ruleValue<string>(config, "diagnosticPolicy.inconclusiveStrategy", "ask_more_signals");
  return strategy === "handoff" ? "handoff" : strategy === "stop_with_reason" ? "stopped" : "request_more_signals";
}

function checkFailureTarget(config: PackConfig): "run_diagnostic_checks" | "handoff" | "stopped" {
  const strategy = ruleValue<string>(config, "diagnosticPolicy.checkFailureStrategy", "retry");
  return strategy === "handoff" ? "handoff" : strategy === "stop_with_reason" ? "stopped" : "run_diagnostic_checks";
}

function remediationTarget(config: PackConfig): "suggest_remediation" | "mock_safe_remediation" | "handoff" {
  const strategy = ruleValue<string>(config, "diagnosticPolicy.remediationStrategy", "suggest_only");
  return strategy === "handoff" ? "handoff" : strategy === "mock_safe_attempt" ? "mock_safe_remediation" : "suggest_remediation";
}

function diagnosticBudgetFallback(config: PackConfig): "handoff" | "stopped" {
  return ruleValue<string>(config, "diagnosticPolicy.inconclusiveStrategy", "ask_more_signals") === "stop_with_reason"
    ? "stopped"
    : "handoff";
}

function verificationTarget(config: PackConfig): "verify_resolution" | "complete" {
  return ruleValue<boolean>(config, "validationPolicy.requireVerificationBeforeComplete", true)
    ? "verify_resolution"
    : "complete";
}

function validationTransitions(config: PackConfig): Array<Record<string, unknown>> {
  const transitions: Array<Record<string, unknown>> = [
    { to: "request_more_signals", when: "ctx.missing_signals == true" },
    { to: "handoff", when: "ctx.signals_valid == false" }
  ];
  if (ruleValue<boolean>(config, "validationPolicy.requireEvidenceBeforeDiagnosis", true)) {
    transitions.push({ to: "request_more_signals", when: "ctx.evidence_available == false" });
  }
  transitions.push({ to: "run_diagnostic_checks" });
  return transitions;
}

function buildAgentSpec(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    agent: "diagnostic-resolution-basic",
    version: "0.1.0",
    intents: [{ name: "resolve_demo_diagnostic", entry_state: "start" }],
    context: {
      fields: {
        symptom_summary: { type: "string" },
        environment_hint: { type: "string" },
        observed_behavior: { type: "string" },
        signals_valid: { type: "boolean", default: true },
        missing_signals: { type: "boolean", default: false },
        evidence_available: { type: "boolean", default: true },
        diagnostic_check_failed: { type: "boolean", default: false },
        diagnosis_inconclusive: { type: "boolean", default: false },
        diagnosis_known: { type: "boolean", default: true },
        diagnostic_budget_exhausted: { type: "boolean", default: false },
        remediation_attempts_exhausted: { type: "boolean", default: false },
        resolution_verified: { type: "boolean", default: true }
      }
    },
    initial_state: "start",
    actions: [
      { name: "collect_demo_signals", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "validate_demo_signals", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "run_demo_diagnostic_check", sideEffect: "read", riskLevel: "low", requiresApproval: false },
      { name: "evaluate_demo_diagnosis", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "request_more_signals", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "render_remediation_suggestion", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "perform_mock_safe_remediation", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "verify_demo_resolution", sideEffect: "read", riskLevel: "low", requiresApproval: false },
      { name: "render_diagnostic_complete", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "render_stop_with_reason", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "escalate_human", sideEffect: "external", riskLevel: "medium", requiresApproval: false }
    ],
    states: {
      start: { transitions: [{ to: "collect_signals" }] },
      collect_signals: {
        actions: ["collect_demo_signals"],
        transitions: [{ to: "validate_signals" }]
      },
      validate_signals: {
        actions: ["validate_demo_signals"],
        transitions: validationTransitions(config)
      },
      run_diagnostic_checks: {
        actions: ["run_demo_diagnostic_check"],
        transitions: [
          { to: diagnosticBudgetFallback(config), when: "ctx.diagnostic_budget_exhausted == true" },
          { to: checkFailureTarget(config), when: "ctx.diagnostic_check_failed == true" },
          { to: "evaluate_diagnosis" }
        ]
      },
      evaluate_diagnosis: {
        actions: ["evaluate_demo_diagnosis"],
        transitions: [
          { to: inconclusiveTarget(config), when: "ctx.diagnosis_inconclusive == true" },
          { to: remediationTarget(config), when: "ctx.diagnosis_known == true" },
          { to: "handoff" }
        ]
      },
      request_more_signals: {
        actions: ["request_more_signals"],
        transitions: [
          { to: diagnosticBudgetFallback(config), when: "ctx.diagnostic_budget_exhausted == true" },
          { to: "collect_signals" }
        ]
      },
      suggest_remediation: {
        actions: ["render_remediation_suggestion"],
        transitions: [{ to: verificationTarget(config) }]
      },
      mock_safe_remediation: {
        actions: ["perform_mock_safe_remediation"],
        transitions: [
          { to: "handoff", when: "ctx.remediation_attempts_exhausted == true" },
          { to: verificationTarget(config) }
        ]
      },
      verify_resolution: {
        actions: ["verify_demo_resolution"],
        transitions: [
          { to: "complete", when: "ctx.resolution_verified == true" },
          { to: "handoff" }
        ]
      },
      complete: {
        actions: ["render_diagnostic_complete"],
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
      diagnosticRoundBudget: ruleValue(config, "diagnosticPolicy.maxDiagnosticRounds", 3),
      remediationAttemptBudget: ruleValue(config, "diagnosticPolicy.maxRemediationAttempts", 1),
      primaryOutput: "diagnostic_disposition",
      failClosed: true,
      publicDemoOnly: true,
      noRealDiagnostics: true,
      noShellExecution: true,
      noRealRemediation: true
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
    requiredSignalPolicy: {
      requiredSignals: ruleValue<string[]>(config, "diagnosticPolicy.requiredSignals", [
        "symptom_summary",
        "observed_behavior"
      ]),
      rejectUnknownSignals: ruleValue(config, "validationPolicy.rejectUnknownSignals", true)
    },
    diagnosticRoundBudget: {
      maxRounds: ruleValue(config, "diagnosticPolicy.maxDiagnosticRounds", 3),
      exhaustedFallback: diagnosticBudgetFallback(config)
    },
    checkFailurePolicy: {
      strategy: ruleValue(config, "diagnosticPolicy.checkFailureStrategy", "retry"),
      noImplicitSuccess: true
    },
    remediationPolicy: {
      strategy: ruleValue(config, "diagnosticPolicy.remediationStrategy", "suggest_only"),
      mockOnly: true,
      realExecutionAllowed: false
    },
    remediationAttemptBudget: {
      maxAttempts: ruleValue(config, "diagnosticPolicy.maxRemediationAttempts", 1),
      exhaustedFallback: "handoff"
    },
    evidenceRequirement: {
      requiredBeforeDiagnosis: ruleValue(config, "validationPolicy.requireEvidenceBeforeDiagnosis", true)
    },
    verificationRequirement: {
      requiredBeforeComplete: ruleValue(config, "validationPolicy.requireVerificationBeforeComplete", true)
    },
    failClosedBoundary: {
      enabled: true,
      unknownOrAmbiguousDiagnosis: "handoff",
      missingEvidence: "request_more_signals",
      noImplicitCompletion: true
    },
    adapterSafety: {
      allAdaptersMock: config.adapters.every((adapter) => adapter.mode === "mock"),
      containsRealEndpoint: false,
      containsSecret: false,
      noDeviceAccess: true,
      noShellExecution: true,
      noExternalApi: true
    }
  };
}

function buildTemplates(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    generatedFrom: { packConfigId: config.packConfigId, configHash },
    tone: ruleValue(config, "responseStyle.tone", "calm_technical"),
    ask_missing_info: "Demo: provide the missing generic signals before diagnosis can continue.",
    ask_more_signals: {
      purpose: "Request only allowlisted generic signals required for the demo diagnosis."
    },
    diagnosis_summary: {
      purpose: "Summarize the generic demo diagnosis without claiming a real system diagnosis.",
      includeDiagnosisReason: ruleValue(config, "responseStyle.includeDiagnosisReason", true),
      includeCheckSummary: ruleValue(config, "responseStyle.includeCheckSummary", true)
    },
    remediation_suggestion: {
      purpose: "Present a non-executable generic remediation suggestion.",
      includeNextSteps: ruleValue(config, "responseStyle.includeNextSteps", true)
    },
    verification_failed: { purpose: "Explain that verification failed and the demo must fail closed." },
    handoff: { purpose: "Explain that the demo diagnosis requires human handling." },
    stop_with_reason: { purpose: "Stop safely and explain the unresolved demo boundary." },
    resolution_complete: { purpose: "Confirm a verified generic diagnostic disposition." }
  };
}

function buildTestCases(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    generatedFrom: { packConfigId: config.packConfigId, configHash },
    testCases: [
      {
        testCaseId: "diagnostic_known_complete",
        title: "Known diagnosis verifies and completes",
        input: { symptom_summary: "demo_symptom", observed_behavior: "demo_observation", resolution_verified: true },
        expectedOutcome: "complete"
      },
      {
        testCaseId: "diagnostic_missing_signals",
        title: "Missing signals request more generic evidence",
        input: { missing_signals: true },
        expectedOutcome: "request_more_signals"
      },
      {
        testCaseId: "diagnostic_inconclusive",
        title: "Inconclusive diagnosis uses configured fallback",
        input: { diagnosis_inconclusive: true },
        expectedOutcome: inconclusiveTarget(config)
      },
      {
        testCaseId: "diagnostic_check_failure",
        title: "Diagnostic check failure uses explicit strategy",
        input: { diagnostic_check_failed: true },
        expectedOutcome: checkFailureTarget(config)
      },
      {
        testCaseId: "diagnostic_budget_exhausted",
        title: "Diagnostic budget exhaustion fails closed",
        input: { diagnostic_budget_exhausted: true },
        expectedOutcome: diagnosticBudgetFallback(config)
      },
      {
        testCaseId: "diagnostic_mock_remediation",
        title: "Mock remediation verifies before completion",
        input: { diagnosis_known: true, resolution_verified: true },
        expectedOutcome: verificationTarget(config)
      },
      {
        testCaseId: "diagnostic_remediation_budget_exhausted",
        title: "Remediation attempt exhaustion hands off",
        input: { remediation_attempts_exhausted: true },
        expectedOutcome: "handoff"
      },
      {
        testCaseId: "diagnostic_evidence_missing",
        title: "Missing evidence blocks diagnosis",
        input: { evidence_available: false },
        expectedOutcome: "request_more_signals"
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
      requiredSignalGuard: "missing_signals",
      evidenceGuard: "evidence_available",
      checkFailureGuard: "diagnostic_check_failed",
      diagnosticRoundBudget: ruleValue(config, "diagnosticPolicy.maxDiagnosticRounds", 3),
      remediationAttemptBudget: ruleValue(config, "diagnosticPolicy.maxRemediationAttempts", 1),
      verificationGuard: "resolution_verified",
      mockRemediationSideEffect: "none",
      failClosed: true
    },
    expectedPaths: [
      { id: "complete", events: ["guard.evaluated", "action.succeeded", "run.completed"] },
      { id: "request_more_signals", events: ["guard.evaluated", "transition.resolved", "action.succeeded"] },
      { id: "handoff", events: ["guard.evaluated", "handoff.requested"] },
      { id: "failed", events: ["guard.evaluated", "run.failed"] }
    ]
  };
}

export function diagnosticResolutionCompiler(config: PackConfig): RuleCompilerArtifacts {
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
