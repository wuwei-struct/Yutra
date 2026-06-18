import { parseDsl, inspectDsl } from "@yutra/dsl";
import { REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG, type PackConfig } from "@yutra/pack-config-core";
import { describe, expect, it } from "vitest";
import { compilePackConfig, compilerVersion } from "../src/index";

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
      archetypeId: "approval-decision"
    });
    const output = compilePackConfig({ config });
    expect(output.ok).toBe(false);
    expect(output.issues.some((issue) => issue.code === "RULE_COMPILER_UNSUPPORTED_ARCHETYPE")).toBe(true);
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
});
