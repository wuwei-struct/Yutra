import type { PackConfig } from "@yutra/pack-config-core";
import { createPackConfigFingerprint } from "@yutra/pack-config-core";
import { compilerVersion } from "./compiler-version";
import type { RuleCompilerArtifacts } from "./artifacts";
import { compileAdapterConfigArtifact } from "./adapter-config-compiler";
import { createJsonArtifact, createYamlArtifact, createYamlTextArtifact } from "./serialize-artifacts";

function ruleValue<T>(config: PackConfig, key: string, fallback: T): T {
  return (config.rules[key]?.value as T | undefined) ?? fallback;
}

function buildAgentSpec(config: PackConfig): Record<string, unknown> {
  return {
    agent: "approval-decision-basic",
    version: "0.1.0",
    intents: [{ name: "decide_approval", entry_state: "collect_request" }],
    context: {
      fields: {
        request_id: { type: "string", required: true },
        amount: { type: "number" },
        risk_level: { type: "string" },
        missing_evidence: { type: "boolean", default: false },
        evidence_valid: { type: "boolean", default: false },
        high_risk: { type: "boolean", default: false },
        policy_conflict: { type: "boolean", default: false },
        low_risk: { type: "boolean", default: false },
        decision_reason_required: { type: "boolean", default: false },
        requires_human_review: { type: "boolean", default: false }
      }
    },
    initial_state: "collect_request",
    actions: [
      { name: "collect_request_info", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "collect_evidence", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "validate_required_evidence", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "evaluate_approval_policy", sideEffect: "none", riskLevel: "medium", requiresApproval: false },
      { name: "create_approval_record", sideEffect: "none", riskLevel: "medium", requiresApproval: true },
      { name: "create_rejection_record", sideEffect: "none", riskLevel: "medium", requiresApproval: true },
      { name: "request_human_review", sideEffect: "external", riskLevel: "medium", requiresApproval: false },
      { name: "send_decision_message", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "escalate_human", sideEffect: "external", riskLevel: "medium", requiresApproval: false }
    ],
    states: {
      collect_request: {
        actions: ["collect_request_info"],
        transitions: [{ to: "collect_evidence" }]
      },
      collect_evidence: {
        actions: ["collect_evidence"],
        transitions: [
          { to: "handoff", when: "ctx.requires_human_review == true" },
          { to: "validate_evidence" }
        ]
      },
      validate_evidence: {
        actions: ["validate_required_evidence"],
        transitions: [
          { to: "collect_evidence", when: "ctx.missing_evidence == true" },
          { to: "handoff", when: "ctx.evidence_valid == false" },
          { to: "evaluate_policy" }
        ]
      },
      evaluate_policy: {
        actions: ["evaluate_approval_policy"],
        transitions: [
          { to: "handoff", when: "ctx.policy_conflict == true" },
          { to: "human_review", when: "ctx.high_risk == true" },
          { to: "rejected", when: "ctx.decision_reason_required == true" },
          { to: "auto_approved", when: "ctx.low_risk == true" },
          { to: "human_review" }
        ]
      },
      auto_approved: {
        actions: ["create_approval_record", "send_decision_message"],
        transitions: [{ to: "done" }]
      },
      rejected: {
        actions: ["create_rejection_record", "send_decision_message"],
        transitions: [{ to: "done" }]
      },
      human_review: {
        actions: ["request_human_review"],
        transitions: [{ to: "handoff" }]
      },
      done: {
        final: true
      },
      handoff: {
        actions: ["escalate_human"],
        handoff: true
      }
    },
    metadata: {
      generatedBy: "rule-compiler",
      packConfigId: config.packConfigId,
      lowRiskMaxAmount: ruleValue(config, "approvalPolicy.lowRiskMaxAmount", 300),
      failClosed: true,
      publicDemoOnly: true
    }
  };
}

function buildPolicy(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    environment: config.governance.environment,
    failClosedPolicy: "enabled",
    generatedFrom: {
      packConfigId: config.packConfigId,
      packConfigVersion: config.packConfigVersion,
      configHash,
      compilerVersion
    },
    sideEffectPolicy: config.governance.sideEffectPolicy ?? {
      maxAutoSideEffect: "read",
      requiresPolicyGuardFrom: "write"
    },
    approvalPolicy: {
      autoApproveLowRisk: ruleValue(config, "approvalPolicy.autoApproveLowRisk", false),
      lowRiskMaxAmount: ruleValue(config, "approvalPolicy.lowRiskMaxAmount", 300),
      missingEvidenceStrategy: ruleValue(config, "approvalPolicy.missingEvidenceStrategy", "ask_for_more_info"),
      highRiskStrategy: ruleValue(config, "approvalPolicy.highRiskStrategy", "require_human_approval"),
      policyConflictStrategy: ruleValue(config, "approvalPolicy.policyConflictStrategy", "handoff"),
      timeoutStrategy: ruleValue(config, "approvalPolicy.timeoutStrategy", "remind_reviewer")
    },
    riskPolicy: {
      requireHumanForHighRisk: ruleValue(config, "riskPolicy.requireHumanForHighRisk", true),
      requireEvidenceBeforeDecision: ruleValue(config, "riskPolicy.requireEvidenceBeforeDecision", true),
      requireReasonForRejection: ruleValue(config, "riskPolicy.requireReasonForRejection", true),
      maxUserRetryCount: ruleValue(config, "riskPolicy.maxUserRetryCount", 2)
    },
    handoffPolicy: {
      highRisk: "covered",
      missingEvidence: "covered",
      policyConflict: "covered"
    },
    adapterSafety: {
      noRealAdapter: true,
      noRealEndpoint: true,
      containsSecret: false
    }
  };
}

function buildTemplates(config: PackConfig, locale: "en" | "zh-CN"): Record<string, unknown> {
  const tone = ruleValue(config, "responseStyle.tone", "neutral");
  return {
    locale,
    tone,
    ask_missing_info: "Demo: please provide the missing information before this approval request can continue.",
    ask_missing_evidence: "Demo: please provide the missing supporting evidence for this approval request.",
    approval_received: "Demo: your approval request has been received for review.",
    approval_approved: "Demo: the approval request was approved under the demo policy.",
    approval_rejected: "Demo: the approval request was not approved under the demo policy.",
    human_review_required: "Demo: this approval request requires human review.",
    policy_conflict_handoff: "Demo: a policy conflict was detected and the request will be routed to human review.",
    action_failed: "Demo: the approval workflow could not continue safely and is routed to fail-closed handling."
  };
}

function buildTestCases(): Record<string, unknown> {
  return {
    testCases: [
      {
        testCaseId: "approval_low_risk_approved",
        title: "Low-risk request is approved",
        input: { request_id: "DEMO-APP-LOW", amount: 100, risk_level: "low", low_risk: true, evidence_valid: true },
        expectedPath: ["collect_request", "collect_evidence", "validate_evidence", "evaluate_policy", "auto_approved", "done"],
        expectedOutcome: "approved",
        tags: ["demo", "mock", "approval"]
      },
      {
        testCaseId: "approval_missing_evidence_ask_more_info",
        title: "Missing evidence asks for more information",
        input: { request_id: "DEMO-APP-MISSING", missing_evidence: true },
        expectedPath: ["collect_request", "collect_evidence", "validate_evidence", "collect_evidence"],
        expectedOutcome: "ask_more_info",
        tags: ["demo", "mock", "missing-evidence"]
      },
      {
        testCaseId: "approval_high_risk_handoff",
        title: "High-risk request requires human review",
        input: { request_id: "DEMO-APP-HIGH", amount: 900, high_risk: true, evidence_valid: true },
        expectedPath: ["collect_request", "collect_evidence", "validate_evidence", "evaluate_policy", "human_review", "handoff"],
        expectedOutcome: "handoff",
        tags: ["demo", "mock", "high-risk"]
      },
      {
        testCaseId: "approval_policy_conflict_fail_closed",
        title: "Policy conflict routes to fail-closed handoff",
        input: { request_id: "DEMO-APP-CONFLICT", policy_conflict: true, evidence_valid: true },
        expectedPath: ["collect_request", "collect_evidence", "validate_evidence", "evaluate_policy", "handoff"],
        expectedOutcome: "fail_closed_handoff",
        tags: ["demo", "mock", "fail-closed"]
      },
      {
        testCaseId: "approval_rejection_requires_reason",
        title: "Rejection includes a generic decision reason",
        input: { request_id: "DEMO-APP-REJECT", decision_reason_required: true, evidence_valid: true },
        expectedPath: ["collect_request", "collect_evidence", "validate_evidence", "evaluate_policy", "rejected", "done"],
        expectedOutcome: "rejected_with_reason",
        tags: ["demo", "mock", "rejection"]
      }
    ]
  };
}

function buildTraceExpectation(configHash: string): Record<string, unknown> {
  return {
    expectedEventTypes: [
      "run.started",
      "intent.resolved",
      "state.entered",
      "guard.evaluated",
      "action.started",
      "action.succeeded",
      "action.failed",
      "transition.resolved",
      "handoff.requested",
      "run.completed",
      "run.failed"
    ],
    expectedPaths: [
      {
        name: "high-risk handoff",
        includes: ["evaluate_policy", "human_review", "handoff"],
        expectedEvents: ["guard.evaluated", "handoff.requested"]
      },
      {
        name: "policy conflict fail-closed",
        includes: ["evaluate_policy", "handoff"],
        expectedMarkers: ["fail_closed", "policy_conflict"]
      }
    ],
    expectedMarkers: {
      failClosed: true,
      handoffRequiredForHighRisk: true,
      approvalDecision: true
    },
    generatedFrom: {
      configHash,
      compilerVersion
    }
  };
}

export function approvalDecisionCompiler(config: PackConfig, locale: "en" | "zh-CN" = "en"): RuleCompilerArtifacts {
  const configHash = createPackConfigFingerprint(config);
  const agentSpec = buildAgentSpec(config);
  const policy = buildPolicy(config, configHash);
  const adapterConfig = compileAdapterConfigArtifact(config, configHash);
  const templates = buildTemplates(config, locale);
  const testCases = buildTestCases();
  const traceExpectation = buildTraceExpectation(configHash);

  return {
    agent: createYamlTextArtifact("agent.yutra.yaml", "agent", agentSpec),
    policy: createYamlArtifact("policy.yaml", "policy", policy),
    adapterConfig: createJsonArtifact("adapter.config.json", "adapter_config", adapterConfig),
    templates: createJsonArtifact("templates.json", "templates", templates),
    testCases: createJsonArtifact("test-cases.json", "test_cases", testCases),
    traceExpectation: createJsonArtifact("trace.expectation.json", "trace_expectation", traceExpectation)
  };
}
