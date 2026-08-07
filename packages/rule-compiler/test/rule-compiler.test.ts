import { parseDsl, inspectDsl } from "@yutra/dsl";
import {
  APPROVAL_DECISION_BASIC_CONFIG,
  DIAGNOSTIC_RESOLUTION_BASIC_CONFIG,
  INTAKE_COLLECTOR_BASIC_CONFIG,
  REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG,
  type PackConfig
} from "@yutra/pack-config-core";
import { describe, expect, it } from "vitest";
import { compilePackConfig, compilerVersion, createCertificationReadinessPreview } from "../src/index";
import { KNOWLEDGE_ANSWERING_BASIC_CONFIG } from "../../pack-config-core/src/sample-configs";

function cloneConfig(overrides: Partial<PackConfig> = {}): PackConfig {
  return {
    ...structuredClone(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG),
    ...overrides
  };
}

function compileOk(config = REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG) {
  const output = compilePackConfig({ config });
  expect(output.ok).toBe(true);
  expect(output.artifacts).toBeDefined();
  return output;
}

describe("@yutra/rule-compiler", () => {
  it("exports public API and supports request-resolution demo config", () => {
    const output = compileOk();
    expect(output.compilerVersion).toBe(compilerVersion);
    expect(output.report.archetypeId).toBe("request-resolution");
    expect(output.report.failClosedPolicy).toBe("enabled");
  });

  it("returns the required 6 artifacts with stable filenames", () => {
    const output = compileOk();
    expect(Object.keys(output.artifacts ?? {})).toEqual(["agent", "policy", "adapterConfig", "templates", "testCases", "traceExpectation"]);
    expect(output.artifacts?.agent.filename).toBe("agent.yutra.yaml");
    expect(output.artifacts?.policy.filename).toBe("policy.yaml");
    expect(output.artifacts?.adapterConfig.filename).toBe("adapter.config.json");
    expect(output.artifacts?.templates.filename).toBe("templates.json");
    expect(output.artifacts?.testCases.filename).toBe("test-cases.json");
    expect(output.artifacts?.traceExpectation.filename).toBe("trace.expectation.json");
  });

  it("adapter artifact stays mock-safe", () => {
    const output = compileOk();
    const adapters = output.artifacts?.adapterConfig.data.adapters as Array<Record<string, unknown>>;
    expect(adapters.every((adapter) => adapter.containsRealEndpoint === false)).toBe(true);
    expect(adapters.every((adapter) => adapter.containsSecret === false)).toBe(true);
  });

  it("templates, test cases, and trace expectations include required handoff assets", () => {
    const output = compileOk();
    expect(output.artifacts?.templates.data).toHaveProperty("ask_missing_info");
    expect(output.artifacts?.templates.data).toHaveProperty("handoff_required");
    const testCases = output.artifacts?.testCases.data.testCases as Array<Record<string, unknown>>;
    expect(testCases.some((item) => item.testCaseId === "refund_high_value_handoff" && item.expectedOutcome === "handoff")).toBe(true);
    const expectedEvents = output.artifacts?.traceExpectation.data.expectedEventTypes as string[];
    expect(expectedEvents).toContain("handoff.requested");
  });

  it("compile report includes config hash, compiler version, and artifact hashes", () => {
    const output = compileOk();
    expect(output.report.packConfigHash).toMatch(/^sha256:/);
    expect(output.report.compilerVersion).toBe(compilerVersion);
    expect(Object.keys(output.report.artifactHashes)).toEqual([
      "agent.yutra.yaml",
      "policy.yaml",
      "adapter.config.json",
      "templates.json",
      "test-cases.json",
      "trace.expectation.json"
    ]);
  });

  it("artifact contents and hashes are deterministic", () => {
    const first = compileOk();
    const second = compileOk();
    expect(second.compileId).toBe(first.compileId);
    expect(second.report.artifactHashes).toEqual(first.report.artifactHashes);
    expect(second.artifacts?.agent.content).toBe(first.artifacts?.agent.content);
  });

  it("changing autoRefundMaxAmount changes config or policy hash", () => {
    const first = compileOk();
    const changed = cloneConfig({
      rules: {
        ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.rules,
        "refundPolicy.autoRefundMaxAmount": {
          value: 500,
          source: "defaultFromPack"
        }
      }
    });
    const second = compileOk(changed);
    expect(second.report.packConfigHash).not.toBe(first.report.packConfigHash);
    expect(second.artifacts?.policy.hash).not.toBe(first.artifacts?.policy.hash);
  });

  it("requiredButMissing blocks compile", () => {
    const config = cloneConfig({
      rules: {
        ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.rules,
        "refundPolicy.autoRefundMaxAmount": { source: "requiredButMissing", required: true }
      }
    });
    const output = compilePackConfig({ config });
    expect(output.ok).toBe(false);
    expect(output.issues.some((issue) => issue.code === "RULE_COMPILER_REQUIRED_FIELD_MISSING")).toBe(true);
  });

  it("unconfirmed AI field blocks publish mode", () => {
    const config = cloneConfig({
      governance: {
        ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.governance,
        environment: "prod-like"
      },
      rules: {
        ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.rules,
        "responseStyle.tone": { value: "neutral", source: "inferredByAI", needsConfirmation: true }
      }
    });
    const output = compilePackConfig({ config, mode: "publish" });
    expect(output.ok).toBe(false);
    expect(output.issues.some((issue) => issue.code === "RULE_COMPILER_UNCONFIRMED_AI_FIELD")).toBe(true);
  });

  it("real endpoint or secret blocks compile", () => {
    const config = cloneConfig({
      adapters: [
        {
          ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.adapters[0],
          containsSecret: true,
          containsRealEndpoint: true
        } as PackConfig["adapters"][number]
      ]
    });
    const output = compilePackConfig({ config });
    expect(output.ok).toBe(false);
    expect(output.issues.some((issue) => issue.code === "RULE_COMPILER_SECRET_NOT_ALLOWED")).toBe(true);
    expect(output.issues.some((issue) => issue.code === "RULE_COMPILER_REAL_ENDPOINT_NOT_ALLOWED")).toBe(true);
  });

  it("unsupported archetype returns unsupported issue", () => {
    const config = cloneConfig({
      archetypeId: "content-production"
    });
    const output = compilePackConfig({ config });
    expect(output.ok).toBe(false);
    expect(output.issues.some((issue) => issue.code === "RULE_COMPILER_UNSUPPORTED_ARCHETYPE")).toBe(true);
  });

  it("supports approval-decision demo config and returns 6 artifacts", () => {
    const output = compilePackConfig({ config: APPROVAL_DECISION_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    expect(output.report.archetypeId).toBe("approval-decision");
    expect(output.artifacts?.agent.filename).toBe("agent.yutra.yaml");
    expect(output.artifacts?.policy.filename).toBe("policy.yaml");
    expect(output.artifacts?.adapterConfig.filename).toBe("adapter.config.json");
    expect(output.artifacts?.templates.filename).toBe("templates.json");
    expect(output.artifacts?.testCases.filename).toBe("test-cases.json");
    expect(output.artifacts?.traceExpectation.filename).toBe("trace.expectation.json");
  });

  it("approval-decision generated DSL can be parsed and inspected by @yutra/dsl", () => {
    const output = compilePackConfig({ config: APPROVAL_DECISION_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    const raw = parseDsl(output.artifacts?.agent.content ?? "", "yaml");
    const inspected = inspectDsl(raw, { format: "yaml" });
    expect(inspected.issues).toEqual([]);
    expect(inspected.canonical.agent).toBe("approval_decision_basic");
    expect(Object.values(inspected.canonical.states).some((state) => state.handoff === true)).toBe(true);
  });

  it("approval-decision artifacts include fail-closed policy, templates, tests, and trace expectations", () => {
    const output = compilePackConfig({ config: APPROVAL_DECISION_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    expect(output.report.packConfigHash).toMatch(/^sha256:/);
    expect(output.report.compilerVersion).toBe(compilerVersion);
    expect(output.report.artifactHashes["agent.yutra.yaml"]).toMatch(/^sha256:/);
    expect(output.artifacts?.policy.data.failClosedPolicy).toBe("enabled");

    const adapters = output.artifacts?.adapterConfig.data.adapters as Array<Record<string, unknown>>;
    expect(adapters.every((adapter) => adapter.containsRealEndpoint === false)).toBe(true);
    expect(adapters.every((adapter) => adapter.containsSecret === false)).toBe(true);

    expect(output.artifacts?.templates.data).toHaveProperty("ask_missing_evidence");
    expect(output.artifacts?.templates.data).toHaveProperty("human_review_required");
    const testCases = output.artifacts?.testCases.data.testCases as Array<Record<string, unknown>>;
    expect(testCases.some((item) => item.testCaseId === "approval_high_risk_handoff" && item.expectedOutcome === "handoff")).toBe(true);
    const expectedEvents = output.artifacts?.traceExpectation.data.expectedEventTypes as string[];
    expect(expectedEvents).toContain("handoff.requested");
  });

  it("approval-decision artifacts contain no customer data, real endpoints, or secrets", () => {
    const output = compilePackConfig({ config: APPROVAL_DECISION_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    const combined = Object.values(output.artifacts ?? {})
      .map((artifact) => artifact.content)
      .join("\n")
      .toLowerCase();
    expect(combined).not.toContain("customer name");
    expect(combined).not.toContain("api_key");
    expect(combined).not.toContain("bearer ");
    expect(combined).not.toContain("https://");
  });

  it("supports knowledge-answering demo config and returns 6 artifacts", () => {
    const output = compilePackConfig({ config: KNOWLEDGE_ANSWERING_BASIC_CONFIG });
    expect(output.ok, JSON.stringify(output.issues, null, 2)).toBe(true);
    expect(output.report.archetypeId).toBe("knowledge-answering");
    expect(output.artifacts?.agent.filename).toBe("agent.yutra.yaml");
    expect(output.artifacts?.policy.filename).toBe("policy.yaml");
    expect(output.artifacts?.adapterConfig.filename).toBe("adapter.config.json");
    expect(output.artifacts?.templates.filename).toBe("templates.json");
    expect(output.artifacts?.testCases.filename).toBe("test-cases.json");
    expect(output.artifacts?.traceExpectation.filename).toBe("trace.expectation.json");
  });

  it("knowledge-answering generated DSL can be parsed and inspected by @yutra/dsl", () => {
    const output = compilePackConfig({ config: KNOWLEDGE_ANSWERING_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    const raw = parseDsl(output.artifacts?.agent.content ?? "", "yaml");
    const inspected = inspectDsl(raw, { format: "yaml" });
    expect(inspected.issues).toEqual([]);
    expect(inspected.canonical.agent).toBe("knowledge_answering_basic");
    expect(Object.keys(inspected.canonical.states)).toContain("handoff");
    expect(inspected.canonical.states.handoff?.actions).toContain("escalate_human");
    expect(inspected.canonical.states.handoff?.actions).not.toContain("request_human_handoff");
  });

  it("knowledge-answering artifacts include confidence policy, templates, tests, and trace expectations", () => {
    const output = compilePackConfig({ config: KNOWLEDGE_ANSWERING_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    expect(output.artifacts?.policy.data.knowledgePolicy).toMatchObject({ minConfidence: 0.72 });
    expect(output.artifacts?.templates.data.templates).toHaveProperty("answer_with_sources");
    expect(output.artifacts?.templates.data.templates).toHaveProperty("no_answer_with_reason");
    const testCases = output.artifacts?.testCases.data.testCases as Array<Record<string, unknown>>;
    expect(testCases.some((item) => item.id === "low_confidence_asks_clarification" && item.expectedOutcome === "ask_clarification")).toBe(true);
    const traceMarkers = output.artifacts?.traceExpectation.data.expectedMarkers as Record<string, unknown>;
    expect(traceMarkers.confidenceGuard).toBe("confidence_threshold");
    const expectedEvents = output.artifacts?.traceExpectation.data.expectedEventTypes as string[];
    expect(expectedEvents).toContain("handoff.requested");
  });

  it("knowledge-answering compile report includes config hash, compiler version, and artifact hashes", () => {
    const output = compilePackConfig({ config: KNOWLEDGE_ANSWERING_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    expect(output.report.packConfigHash).toMatch(/^sha256:/);
    expect(output.report.compilerVersion).toBe(compilerVersion);
    expect(output.report.artifactHashes["agent.yutra.yaml"]).toMatch(/^sha256:/);
    expect(output.report.artifactHashes["trace.expectation.json"]).toMatch(/^sha256:/);
  });

  it("knowledge-answering artifacts contain no customer data, real endpoints, secrets, or real source markers", () => {
    const output = compilePackConfig({ config: KNOWLEDGE_ANSWERING_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    const combined = Object.values(output.artifacts ?? {})
      .map((artifact) => artifact.content)
      .join("\n")
      .toLowerCase();
    expect(combined).not.toContain("customer name");
    expect(combined).not.toContain("api_key");
    expect(combined).not.toContain("bearer ");
    expect(combined).not.toContain("https://");
    expect(combined).not.toContain("sourceurl");
    expect(combined).not.toContain("documentid");
    expect(combined).not.toContain("knowledgebase");
  });

  it("supports intake-collector demo config and returns six deterministic artifacts", () => {
    const first = compilePackConfig({ config: INTAKE_COLLECTOR_BASIC_CONFIG });
    const second = compilePackConfig({ config: INTAKE_COLLECTOR_BASIC_CONFIG });
    expect(first.ok, JSON.stringify(first.issues, null, 2)).toBe(true);
    expect(first.report.archetypeId).toBe("intake-collector");
    expect(Object.keys(first.artifacts ?? {})).toEqual([
      "agent",
      "policy",
      "adapterConfig",
      "templates",
      "testCases",
      "traceExpectation"
    ]);
    expect(second.report.artifactHashes).toEqual(first.report.artifactHashes);
  });

  it("intake-collector generated DSL parses and exposes guarded collection paths", () => {
    const output = compilePackConfig({ config: INTAKE_COLLECTOR_BASIC_CONFIG });
    expect(output.ok, JSON.stringify(output.issues, null, 2)).toBe(true);
    const inspected = inspectDsl(parseDsl(output.artifacts?.agent.content ?? "", "yaml"), { format: "yaml" });
    expect(inspected.issues).toEqual([]);
    expect(inspected.canonical.agent).toBe("intake_collector_basic");
    expect(Object.keys(inspected.canonical.states)).toEqual(
      expect.arrayContaining([
        "collect_fields",
        "validate_fields",
        "detect_missing",
        "check_duplicate",
        "request_clarification",
        "confirm_record",
        "complete",
        "handoff",
        "stopped"
      ])
    );
    expect(inspected.canonical.states.handoff?.handoff).toBe(true);
  });

  it("intake-collector artifacts include budget, duplicate, invalid, incomplete, and confirmation contracts", () => {
    const output = compilePackConfig({ config: INTAKE_COLLECTOR_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    expect(output.artifacts?.policy.data.clarificationBudget).toMatchObject({ maxRounds: 2 });
    expect(output.artifacts?.policy.data.duplicateStrategy).toBe("warn_and_confirm");
    expect(output.artifacts?.policy.data.failClosedBoundary).toMatchObject({ enabled: true });
    expect(output.artifacts?.templates.data).toHaveProperty("ask_missing_fields");
    expect(output.artifacts?.templates.data).toHaveProperty("ask_field_correction");
    expect(output.artifacts?.templates.data).toHaveProperty("duplicate_confirmation");
    const tests = output.artifacts?.testCases.data.testCases as Array<Record<string, unknown>>;
    expect(tests).toHaveLength(6);
    expect(tests.map((test) => test.testCaseId)).toEqual(
      expect.arrayContaining([
        "intake_missing_fields",
        "intake_invalid_field",
        "intake_clarification_budget_exhausted",
        "intake_duplicate",
        "intake_confirmation_required"
      ])
    );
    const events = output.artifacts?.traceExpectation.data.expectedEventTypes as string[];
    expect(events).toEqual(expect.arrayContaining(["guard.evaluated", "handoff.requested", "run.completed", "run.failed"]));
  });

  it("intake-collector compiled artifacts remain mock-only and exclude personal-data markers", () => {
    const output = compilePackConfig({ config: INTAKE_COLLECTOR_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    const combined = Object.values(output.artifacts ?? {})
      .map((artifact) => artifact.content)
      .join("\n")
      .toLowerCase();
    expect(combined).not.toContain("https://");
    expect(combined).not.toContain("api_key");
    expect(combined).not.toContain("phone_number");
    expect(combined).not.toContain("identity_number");
    const adapters = output.artifacts?.adapterConfig.data.adapters as Array<Record<string, unknown>>;
    expect(adapters.every((adapter) => adapter.containsRealEndpoint === false && adapter.containsSecret === false)).toBe(true);
  });

  it("supports diagnostic-resolution with six deterministic canonical artifacts", () => {
    const first = compilePackConfig({ config: DIAGNOSTIC_RESOLUTION_BASIC_CONFIG });
    const second = compilePackConfig({ config: DIAGNOSTIC_RESOLUTION_BASIC_CONFIG });
    expect(first.ok, JSON.stringify(first.issues, null, 2)).toBe(true);
    expect(first.report.archetypeId).toBe("diagnostic-resolution");
    expect(Object.keys(first.artifacts ?? {})).toEqual([
      "agent",
      "policy",
      "adapterConfig",
      "templates",
      "testCases",
      "traceExpectation"
    ]);
    expect(second.report.artifactHashes).toEqual(first.report.artifactHashes);
  });

  it("diagnostic-resolution DSL inspects with explicit diagnosis, remediation, verification, and fallback states", () => {
    const output = compilePackConfig({ config: DIAGNOSTIC_RESOLUTION_BASIC_CONFIG });
    expect(output.ok, JSON.stringify(output.issues, null, 2)).toBe(true);
    const inspected = inspectDsl(parseDsl(output.artifacts?.agent.content ?? "", "yaml"), { format: "yaml" });
    expect(inspected.issues).toEqual([]);
    expect(inspected.canonical.agent).toBe("diagnostic_resolution_basic");
    expect(Object.keys(inspected.canonical.states)).toEqual(
      expect.arrayContaining([
        "collect_signals",
        "validate_signals",
        "run_diagnostic_checks",
        "evaluate_diagnosis",
        "request_more_signals",
        "suggest_remediation",
        "mock_safe_remediation",
        "verify_resolution",
        "complete",
        "handoff",
        "stopped"
      ])
    );
    const mockAction = inspected.canonical.actions.find((action) => action.name === "perform_mock_safe_remediation");
    expect(mockAction?.sideEffect).toBe("none");
    expect(inspected.canonical.states.handoff?.handoff).toBe(true);
  });

  it("diagnostic-resolution artifacts include both budgets and all explicit fail-closed paths", () => {
    const output = compilePackConfig({ config: DIAGNOSTIC_RESOLUTION_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    expect(output.artifacts?.policy.data.diagnosticRoundBudget).toMatchObject({ maxRounds: 3 });
    expect(output.artifacts?.policy.data.remediationAttemptBudget).toMatchObject({ maxAttempts: 1 });
    expect(output.artifacts?.policy.data.remediationPolicy).toMatchObject({ mockOnly: true, realExecutionAllowed: false });
    expect(output.artifacts?.policy.data.failClosedBoundary).toMatchObject({ enabled: true });
    for (const key of [
      "ask_more_signals",
      "diagnosis_summary",
      "remediation_suggestion",
      "verification_failed",
      "handoff",
      "stop_with_reason",
      "resolution_complete"
    ]) {
      expect(output.artifacts?.templates.data).toHaveProperty(key);
    }
    const tests = output.artifacts?.testCases.data.testCases as Array<Record<string, unknown>>;
    expect(tests).toHaveLength(8);
    expect(tests.map((test) => test.testCaseId)).toEqual(
      expect.arrayContaining([
        "diagnostic_missing_signals",
        "diagnostic_inconclusive",
        "diagnostic_check_failure",
        "diagnostic_budget_exhausted",
        "diagnostic_mock_remediation",
        "diagnostic_remediation_budget_exhausted",
        "diagnostic_evidence_missing"
      ])
    );
  });

  it("diagnostic-resolution artifacts contain no real diagnostics, shell execution, endpoint, or secret", () => {
    const output = compilePackConfig({ config: DIAGNOSTIC_RESOLUTION_BASIC_CONFIG });
    expect(output.ok).toBe(true);
    const combined = Object.values(output.artifacts ?? {})
      .map((artifact) => artifact.content)
      .join("\n")
      .toLowerCase();
    expect(combined).not.toContain("https://");
    expect(combined).not.toContain("api_key");
    expect(combined).not.toContain("bearer ");
    expect(combined).not.toContain("shell_command");
    expect(combined).not.toContain("account_id");
    const adapters = output.artifacts?.adapterConfig.data.adapters as Array<Record<string, unknown>>;
    expect(adapters.every((adapter) => adapter.mode === "mock")).toBe(true);
    expect(adapters.every((adapter) => adapter.containsRealEndpoint === false && adapter.containsSecret === false)).toBe(true);
  });

  it("generated agent.yutra.yaml can be parsed and inspected by @yutra/dsl", () => {
    const output = compileOk();
    const raw = parseDsl(output.artifacts?.agent.content ?? "", "yaml");
    const inspected = inspectDsl(raw, { format: "yaml" });
    expect(inspected.issues).toEqual([]);
    expect(inspected.canonical.agent).toBe("request_resolution_ecommerce_basic");
    expect(Object.values(inspected.canonical.states).some((state) => state.handoff === true)).toBe(true);
  });

  it("artifacts do not contain customer data, real endpoints, or secrets", () => {
    const output = compileOk();
    const combined = Object.values(output.artifacts ?? {})
      .map((artifact) => artifact.content)
      .join("\n")
      .toLowerCase();
    expect(combined).not.toContain("customer name");
    expect(combined).not.toContain("api_key");
    expect(combined).not.toContain("bearer ");
    expect(combined).not.toContain("https://");
  });

  it("creates certification readiness preview for valid demo output", () => {
    const output = compileOk();
    const readiness = createCertificationReadinessPreview(output);
    expect(readiness.overall).toBe("warning");
    expect(readiness.gates.some((gate) => gate.gateId === "compile" && gate.level === "ready")).toBe(true);
    expect(readiness.gates.some((gate) => gate.gateId === "manual_runtime_run" && gate.level === "warning")).toBe(true);
    expect(readiness.gates.some((gate) => gate.gateId === "official_certification" && gate.level === "warning")).toBe(true);
    expect(readiness.artifactStatus).toEqual({
      agent: true,
      policy: true,
      adapterConfig: true,
      templates: true,
      testCases: true,
      traceExpectation: true
    });
    expect(readiness.counts.testCases).toBeGreaterThan(0);
    expect(readiness.counts.traceExpectations).toBeGreaterThan(0);
    expect(readiness.certificationBoundary).toEqual({
      previewOnly: true,
      runtimeExecuted: false,
      officialCertificationRun: false,
      productionReady: false
    });
  });

  it("missing artifact makes readiness blocked", () => {
    const output = compileOk();
    const readiness = createCertificationReadinessPreview({
      ...output,
      artifacts: {
        ...output.artifacts!,
        traceExpectation: undefined
      }
    } as never);
    expect(readiness.overall).toBe("blocked");
    expect(readiness.gates.some((gate) => gate.gateId === "artifacts" && gate.level === "blocked")).toBe(true);
    expect(readiness.gates.some((gate) => gate.gateId === "trace_expectation" && gate.level === "blocked")).toBe(true);
  });

  it("compile error makes readiness blocked and never claims production ready", () => {
    const config = cloneConfig({
      rules: {
        ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.rules,
        "refundPolicy.autoRefundMaxAmount": { source: "requiredButMissing", required: true }
      }
    });
    const output = compilePackConfig({ config });
    const readiness = createCertificationReadinessPreview(output);
    expect(readiness.overall).toBe("blocked");
    expect(readiness.gates.some((gate) => gate.gateId === "compile" && gate.level === "blocked")).toBe(true);
    expect(readiness.certificationBoundary.productionReady).toBe(false);
  });
});
