import { listRuleImpacts } from "@yutra/pack-config-core";
import type { RuleCompilerArtifacts } from "./artifacts";
import type { RuleCompilerReport } from "./compile-report";
import type { RuleCompilerIssue } from "./errors";
import type { RuleCompilerOutput } from "./types";

export type ReadinessLevel = "ready" | "warning" | "blocked";

export type ReadinessGateId =
  | "compile"
  | "artifacts"
  | "test_cases"
  | "trace_expectation"
  | "fail_closed"
  | "publish_gate"
  | "side_effect"
  | "adapter_safety"
  | "manual_runtime_run"
  | "official_certification";

export type CertificationReadinessGate = {
  gateId: ReadinessGateId;
  level: ReadinessLevel;
  label: {
    en: string;
    zhCN: string;
  };
  message: {
    en: string;
    zhCN: string;
  };
  evidence?: Record<string, unknown>;
  nextAction?: {
    en?: string;
    zhCN?: string;
  };
};

export type CertificationReadinessPreview = {
  overall: ReadinessLevel;
  environment: "dev" | "demo" | "staging" | "prod-like" | "production";
  summary: {
    en: string;
    zhCN: string;
  };
  gates: CertificationReadinessGate[];
  artifactStatus: {
    agent: boolean;
    policy: boolean;
    adapterConfig: boolean;
    templates: boolean;
    testCases: boolean;
    traceExpectation: boolean;
  };
  counts: {
    testCases: number;
    traceExpectations: number;
    errors: number;
    warnings: number;
    ruleImpacts?: number;
  };
  certificationBoundary: {
    previewOnly: true;
    runtimeExecuted: false;
    officialCertificationRun: false;
    productionReady: false;
  };
};

function gate(
  gateId: ReadinessGateId,
  level: ReadinessLevel,
  label: { en: string; zhCN: string },
  message: { en: string; zhCN: string },
  evidence?: Record<string, unknown>,
  nextAction?: { en?: string; zhCN?: string }
): CertificationReadinessGate {
  return { gateId, level, label, message, evidence, nextAction };
}

function issueCounts(issues: RuleCompilerIssue[]): { errors: number; warnings: number } {
  return {
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length
  };
}

function artifactStatus(artifacts?: Partial<RuleCompilerArtifacts>): CertificationReadinessPreview["artifactStatus"] {
  return {
    agent: Boolean(artifacts?.agent),
    policy: Boolean(artifacts?.policy),
    adapterConfig: Boolean(artifacts?.adapterConfig),
    templates: Boolean(artifacts?.templates),
    testCases: Boolean(artifacts?.testCases),
    traceExpectation: Boolean(artifacts?.traceExpectation)
  };
}

function allArtifactsPresent(status: CertificationReadinessPreview["artifactStatus"]): boolean {
  return Object.values(status).every(Boolean);
}

function testCaseCount(artifacts?: Partial<RuleCompilerArtifacts>): number {
  const data = artifacts?.testCases?.data as { testCases?: unknown[] } | undefined;
  return Array.isArray(data?.testCases) ? data.testCases.length : 0;
}

function traceExpectationEvidence(artifacts?: Partial<RuleCompilerArtifacts>): {
  count: number;
  hasExpectedEventTypes: boolean;
  hasHandoffExpectation: boolean;
  hasConfigHash: boolean;
  hasCompilerVersion: boolean;
} {
  const data = artifacts?.traceExpectation?.data as
    | {
        expectedEventTypes?: unknown[];
        generatedFrom?: { configHash?: unknown; compilerVersion?: unknown };
      }
    | undefined;
  const expectedEventTypes = Array.isArray(data?.expectedEventTypes) ? data.expectedEventTypes : [];
  return {
    count: expectedEventTypes.length,
    hasExpectedEventTypes: expectedEventTypes.length > 0,
    hasHandoffExpectation: expectedEventTypes.includes("handoff.requested"),
    hasConfigHash: typeof data?.generatedFrom?.configHash === "string",
    hasCompilerVersion: typeof data?.generatedFrom?.compilerVersion === "string"
  };
}

function adapterSafetyLevel(artifacts?: Partial<RuleCompilerArtifacts>): {
  level: ReadinessLevel;
  evidence: Record<string, unknown>;
} {
  const data = artifacts?.adapterConfig?.data as { adapters?: Array<Record<string, unknown>> } | undefined;
  const adapters = Array.isArray(data?.adapters) ? data.adapters : [];
  const hasRealEndpoint = adapters.some((adapter) => adapter.containsRealEndpoint !== false);
  const hasSecret = adapters.some((adapter) => adapter.containsSecret !== false);
  const hasRealPlaceholder = adapters.some((adapter) => adapter.mode === "real_placeholder");
  if (hasRealEndpoint || hasSecret) {
    return { level: "blocked", evidence: { adapterCount: adapters.length, hasRealEndpoint, hasSecret, hasRealPlaceholder } };
  }
  if (hasRealPlaceholder) {
    return { level: "warning", evidence: { adapterCount: adapters.length, hasRealEndpoint, hasSecret, hasRealPlaceholder } };
  }
  return { level: "ready", evidence: { adapterCount: adapters.length, hasRealEndpoint, hasSecret, hasRealPlaceholder } };
}

function overallLevel(gates: CertificationReadinessGate[]): ReadinessLevel {
  if (gates.some((item) => item.level === "blocked")) {
    return "blocked";
  }
  if (gates.some((item) => item.level === "warning")) {
    return "warning";
  }
  return "ready";
}

function fallbackEnvironment(report?: RuleCompilerReport): CertificationReadinessPreview["environment"] {
  const maybe = report?.mode === "publish" ? "prod-like" : "demo";
  return maybe;
}

export function createCertificationReadinessPreview(
  output: RuleCompilerOutput,
  options: { environment?: CertificationReadinessPreview["environment"] } = {}
): CertificationReadinessPreview {
  const artifacts = output.artifacts as Partial<RuleCompilerArtifacts> | undefined;
  const status = artifactStatus(artifacts);
  const counts = issueCounts(output.issues);
  const traceEvidence = traceExpectationEvidence(artifacts);
  const adapterSafety = adapterSafetyLevel(artifacts);
  const report = output.report;
  const testCases = testCaseCount(artifacts);
  const compileReady = output.ok && report.status === "passed" && counts.errors === 0;
  const traceReady =
    status.traceExpectation &&
    traceEvidence.hasExpectedEventTypes &&
    traceEvidence.hasHandoffExpectation &&
    traceEvidence.hasConfigHash &&
    traceEvidence.hasCompilerVersion;
  const failClosedReady =
    report.failClosedPolicy === "enabled" &&
    (report.coverage.handoff === "covered" || report.coverage.transitions === "fallback_covered");

  const gates: CertificationReadinessGate[] = [
    gate(
      "compile",
      compileReady ? "ready" : "blocked",
      { en: "Compile", zhCN: "编译" },
      compileReady
        ? { en: "Compile preview passed without blocking compiler errors.", zhCN: "Compile Preview 未发现阻断性编译错误。" }
        : { en: "Compile preview failed or contains blocking errors.", zhCN: "Compile Preview 失败或存在阻断错误。" },
      { ok: output.ok, reportStatus: report.status, errors: counts.errors }
    ),
    gate(
      "artifacts",
      allArtifactsPresent(status) ? "ready" : "blocked",
      { en: "Artifacts", zhCN: "产物" },
      allArtifactsPresent(status)
        ? { en: "All six compiler artifacts are present.", zhCN: "6 类 compiler 产物均已存在。" }
        : { en: "One or more required compiler artifacts are missing.", zhCN: "缺少一个或多个必要 compiler 产物。" },
      status
    ),
    gate(
      "test_cases",
      status.testCases && testCases > 0 ? "ready" : "blocked",
      { en: "Test Cases", zhCN: "测试用例" },
      status.testCases && testCases > 0
        ? { en: "Compiled test-cases.json contains demo test cases.", zhCN: "编译出的 test-cases.json 包含 demo 测试用例。" }
        : { en: "test-cases.json is missing or empty.", zhCN: "test-cases.json 缺失或为空。" },
      { testCases }
    ),
    gate(
      "trace_expectation",
      traceReady ? "ready" : "blocked",
      { en: "Trace Expectation", zhCN: "Trace 预期" },
      traceReady
        ? { en: "Trace expectation includes event types, handoff expectation, configHash, and compilerVersion.", zhCN: "Trace 预期包含事件类型、handoff 预期、configHash 与 compilerVersion。" }
        : { en: "Trace expectation is missing required readiness evidence.", zhCN: "Trace 预期缺少必要准备度证据。" },
      traceEvidence
    ),
    gate(
      "fail_closed",
      failClosedReady ? "ready" : "blocked",
      { en: "Fail-Closed", zhCN: "Fail-Closed" },
      failClosedReady
        ? { en: "Fail-closed policy and fallback or handoff coverage are present.", zhCN: "已具备 fail-closed 策略与 fallback 或 handoff 覆盖。" }
        : { en: "Fail-closed coverage is incomplete.", zhCN: "Fail-closed 覆盖不完整。" },
      { failClosedPolicy: report.failClosedPolicy, transitions: report.coverage.transitions, handoff: report.coverage.handoff }
    ),
    gate(
      "publish_gate",
      output.mode === "publish" && !output.ok ? "blocked" : "warning",
      { en: "Publish Gate", zhCN: "发布门禁" },
      output.mode === "publish" && !output.ok
        ? { en: "Publish mode is blocked by compiler or publish gate issues.", zhCN: "Publish 模式被 compiler 或发布门禁问题阻断。" }
        : { en: "Preview mode is not publish-approved.", zhCN: "Preview 模式不代表已获发布批准。" },
      { mode: output.mode }
    ),
    gate(
      "side_effect",
      report.coverage.sideEffects === "policy_guarded" ? "ready" : "blocked",
      { en: "Side Effect", zhCN: "副作用" },
      report.coverage.sideEffects === "policy_guarded"
        ? { en: "Side-effect coverage is policy guarded in the compile report.", zhCN: "Compile report 显示副作用已受 policy guard 保护。" }
        : { en: "Side-effect coverage is unsafe.", zhCN: "副作用覆盖不安全。" },
      { sideEffects: report.coverage.sideEffects }
    ),
    gate(
      "adapter_safety",
      adapterSafety.level,
      { en: "Adapter Safety", zhCN: "Adapter 安全" },
      adapterSafety.level === "ready"
        ? { en: "Adapter config is mock/demo safe with no real endpoint or secret.", zhCN: "Adapter config 为 mock/demo 安全状态，不含真实 endpoint 或 secret。" }
        : adapterSafety.level === "warning"
          ? { en: "Adapter config contains real_placeholder entries and needs implementation review.", zhCN: "Adapter config 包含 real_placeholder，需要实施前审查。" }
          : { en: "Adapter config is unsafe for public demo readiness.", zhCN: "Adapter config 对公开 demo 准备度不安全。" },
      adapterSafety.evidence
    ),
    gate(
      "manual_runtime_run",
      "warning",
      { en: "Manual Runtime Run", zhCN: "手动 Runtime 运行" },
      { en: "Run Preview has not been executed in this readiness panel.", zhCN: "该准备度面板未执行 Run Preview。" },
      { runtimeExecuted: false },
      { en: "Send compiled DSL to the DSL Editor, inspect it, apply manually, then run preview.", zhCN: "将编译 DSL 发送到 DSL 编辑器，检查后手动应用并运行预览。" }
    ),
    gate(
      "official_certification",
      "warning",
      { en: "Official Certification", zhCN: "正式认证" },
      { en: "This is not an official certification result.", zhCN: "这不是正式认证结果。" },
      { officialCertificationRun: false },
      { en: "Run the official certification suite separately when required.", zhCN: "需要时应单独运行正式认证套件。" }
    )
  ];

  const overall = overallLevel(gates);
  return {
    overall,
    environment: options.environment ?? fallbackEnvironment(report),
    summary:
      overall === "blocked"
        ? {
            en: "Certification readiness is blocked. Resolve blocking gates before using this configuration as certification evidence.",
            zhCN: "认证准备度被阻断。请先解决阻断门禁，再将该配置作为认证证据。"
          }
        : {
            en: "Certification readiness is suitable for demo review only. Manual runtime and official certification evidence are still required.",
            zhCN: "认证准备度仅适合 demo 评审。仍需手动 Runtime 与正式认证证据。"
          },
    gates,
    artifactStatus: status,
    counts: {
      testCases,
      traceExpectations: traceEvidence.count,
      errors: counts.errors,
      warnings: counts.warnings,
      ruleImpacts: listRuleImpacts().length
    },
    certificationBoundary: {
      previewOnly: true,
      runtimeExecuted: false,
      officialCertificationRun: false,
      productionReady: false
    }
  };
}
