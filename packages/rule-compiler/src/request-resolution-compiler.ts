import type { PackConfig } from "@yutra/pack-config-core";
import { createPackConfigFingerprint } from "@yutra/pack-config-core";
import { compilerVersion } from "./compiler-version";
import type { RuleCompilerArtifacts } from "./artifacts";
import { compileAdapterConfigArtifact } from "./adapter-config-compiler";
import { compilePolicyArtifact } from "./policy-compiler";
import { compileTemplatesArtifact } from "./template-compiler";
import { compileTestCasesArtifact } from "./test-case-compiler";
import { compileTraceExpectationArtifact } from "./trace-expectation-compiler";
import { createJsonArtifact, createYamlArtifact, createYamlTextArtifact } from "./serialize-artifacts";

function isEnabled(config: PackConfig, capability: string): boolean {
  return config.capabilities[capability]?.value === true;
}

function ruleValue<T>(config: PackConfig, key: string, fallback: T): T {
  return (config.rules[key]?.value as T | undefined) ?? fallback;
}

function buildAgentSpec(config: PackConfig): Record<string, unknown> {
  const actions: Array<Record<string, unknown>> = [
    { name: "classify_request" },
    { name: "ask_missing_info" },
    { name: "lookup_order", sideEffect: "read", riskLevel: "low", requiresApproval: false },
    { name: "evaluate_policy", sideEffect: "none", riskLevel: "low", requiresApproval: false },
    { name: "execute_resolution", sideEffect: "read", riskLevel: "low", requiresApproval: false },
    { name: "notify_result", sideEffect: "none", riskLevel: "low", requiresApproval: false },
    { name: "escalate_human", sideEffect: "external", riskLevel: "medium", requiresApproval: false }
  ];

  if (isEnabled(config, "shippingLookup")) {
    actions.push({ name: "check_shipping", sideEffect: "read", riskLevel: "low", requiresApproval: false });
  }
  if (isEnabled(config, "refundRequest")) {
    actions.push({ name: "prepare_refund_request", sideEffect: "none", riskLevel: "medium", requiresApproval: true });
  }
  if (isEnabled(config, "returnRequest")) {
    actions.push({ name: "prepare_return_request", sideEffect: "none", riskLevel: "medium", requiresApproval: true });
  }

  return {
    agent: "request-resolution-ecommerce-basic",
    version: "0.1.0",
    intents: [{ name: "resolve_request", entry_state: "classify_request" }],
    context: {
      fields: {
        request_type: { type: "string", required: true },
        order_id: { type: "string" },
        amount: { type: "number" },
        missing_required_info: { type: "boolean", default: false },
        order_found: { type: "boolean" },
        api_failed: { type: "boolean", default: false },
        high_risk: { type: "boolean", default: false },
        rule_conflict: { type: "boolean", default: false },
        requires_handoff: { type: "boolean", default: false },
        resolution_ready: { type: "boolean", default: false }
      }
    },
    initial_state: "classify_request",
    actions,
    states: {
      classify_request: {
        actions: ["classify_request"],
        transitions: [
          { to: "collect_required_info", when: "ctx.missing_required_info == true" },
          { to: "check_order" }
        ]
      },
      collect_required_info: {
        actions: ["ask_missing_info"],
        transitions: [
          { to: "handoff", when: "ctx.requires_handoff == true" },
          { to: "check_order" }
        ]
      },
      check_order: {
        actions: ["lookup_order"],
        transitions: [
          { to: "handoff", when: "ctx.order_found == false" },
          { to: "handoff", when: "ctx.api_failed == true" },
          { to: "evaluate_rules" }
        ]
      },
      evaluate_rules: {
        actions: ["evaluate_policy"],
        transitions: [
          { to: "handoff", when: "ctx.high_risk == true" },
          { to: "handoff", when: "ctx.rule_conflict == true" },
          { to: "handoff", when: "ctx.requires_handoff == true" },
          { to: "execute_resolution" }
        ]
      },
      execute_resolution: {
        actions: ["execute_resolution"],
        transitions: [
          { to: "handoff", when: "ctx.api_failed == true" },
          { to: "done" }
        ]
      },
      done: {
        actions: ["notify_result"],
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
      autoRefundMaxAmount: ruleValue(config, "refundPolicy.autoRefundMaxAmount", 300),
      failClosed: true
    }
  };
}

export function requestResolutionCompiler(config: PackConfig, locale: "en" | "zh-CN" = "en"): RuleCompilerArtifacts {
  const configHash = createPackConfigFingerprint(config);
  const agentSpec = buildAgentSpec(config);
  const policy = compilePolicyArtifact(config, configHash);
  const adapterConfig = compileAdapterConfigArtifact(config, configHash);
  const templates = compileTemplatesArtifact(config, locale);
  const testCases = compileTestCasesArtifact(config);
  const traceExpectation = compileTraceExpectationArtifact(config, configHash, compilerVersion);

  return {
    agent: createYamlTextArtifact("agent.yutra.yaml", "agent", agentSpec),
    policy: createYamlArtifact("policy.yaml", "policy", policy),
    adapterConfig: createJsonArtifact("adapter.config.json", "adapter_config", adapterConfig),
    templates: createJsonArtifact("templates.json", "templates", templates),
    testCases: createJsonArtifact("test-cases.json", "test_cases", testCases),
    traceExpectation: createJsonArtifact("trace.expectation.json", "trace_expectation", traceExpectation)
  };
}
