import { describe, expect, it } from "vitest";
import {
  REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG,
  REQUEST_RESOLUTION_FIELD_DEFINITIONS,
  REQUEST_RESOLUTION_RULE_IMPACTS,
  canPublishPackConfig,
  collectUnconfirmedFields,
  createPackConfigFingerprint,
  explainPackConfig,
  explainRuleImpact,
  getRuleImpact,
  validatePackConfig,
  validateRequestResolutionConfig
} from "../src";
import type { PackConfig } from "../src";

function cloneConfig(overrides: Partial<PackConfig> = {}): PackConfig {
  return {
    ...structuredClone(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG),
    ...overrides
  };
}

describe("@yutra/pack-config-core", () => {
  it("valid sample config passes pack and request-resolution validation", () => {
    expect(validatePackConfig(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG).ok).toBe(true);
    expect(validateRequestResolutionConfig(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG).ok).toBe(true);
  });

  it("config fingerprint is deterministic and changes when business rule changes", () => {
    const first = createPackConfigFingerprint(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG);
    const second = createPackConfigFingerprint(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG);
    expect(first).toBe(second);
    expect(first.startsWith("sha256:")).toBe(true);

    const changed = cloneConfig({
      rules: {
        ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.rules,
        "refundPolicy.autoRefundMaxAmount": {
          ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.rules["refundPolicy.autoRefundMaxAmount"]!,
          value: 301
        }
      }
    });
    expect(createPackConfigFingerprint(changed)).not.toBe(first);
  });

  it("inferredByAI fields require confirmation and block prod-like publish", () => {
    const config = cloneConfig({
      governance: {
        ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.governance,
        environment: "prod-like"
      },
      rules: {
        ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.rules,
        "responseStyle.tone": {
          value: "concise",
          source: "inferredByAI",
          needsConfirmation: true
        }
      }
    });

    expect(collectUnconfirmedFields(config).some((field) => field.path.includes("responseStyle.tone"))).toBe(true);
    const publish = canPublishPackConfig(config);
    expect(publish.ok).toBe(false);
    expect(publish.issues.some((issue) => issue.code === "PACK_CONFIG_UNCONFIRMED_AI_FIELD")).toBe(true);
  });

  it("requiredButMissing blocks publish and validation", () => {
    const config = cloneConfig({
      rules: {
        ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.rules,
        requiredBusinessRule: {
          source: "requiredButMissing",
          required: true
        }
      }
    });
    expect(validatePackConfig(config).ok).toBe(false);
    expect(canPublishPackConfig(config).ok).toBe(false);
  });

  it("real endpoint or secret adapter flags fail validation", () => {
    const withSecret = {
      ...cloneConfig(),
      adapters: [
        {
          ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.adapters[0]!,
          containsSecret: true
        }
      ]
    };
    const withEndpoint = {
      ...cloneConfig(),
      adapters: [
        {
          ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.adapters[0]!,
          containsRealEndpoint: true
        }
      ]
    };

    expect(validatePackConfig(withSecret).issues.some((issue) => issue.code === "PACK_CONFIG_SECRET_NOT_ALLOWED")).toBe(true);
    expect(validatePackConfig(withEndpoint).issues.some((issue) => issue.code === "PACK_CONFIG_REAL_ENDPOINT_NOT_ALLOWED")).toBe(true);
  });

  it("real_placeholder adapter blocks production publish", () => {
    const config = cloneConfig({
      governance: {
        ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.governance,
        environment: "production"
      },
      adapters: [
        {
          ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.adapters[0]!,
          mode: "real_placeholder"
        }
      ]
    });

    const publish = canPublishPackConfig(config);
    expect(publish.ok).toBe(false);
    expect(publish.issues.some((issue) => issue.code === "PACK_CONFIG_ADAPTER_MODE_NOT_PUBLISHABLE")).toBe(true);
  });

  it("demo mock config can pass publish gate", () => {
    const publish = canPublishPackConfig(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG);
    expect(publish.ok).toBe(true);
  });

  it("explainPackConfig returns deterministic en and zh-CN text", () => {
    const en = explainPackConfig(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG, { locale: "en" });
    const zh = explainPackConfig(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG, { locale: "zh-CN" });
    expect(en).toContain("This is a Pack Config contract");
    expect(zh).toContain("这是 Pack Config contract");
  });

  it("request-resolution fields include refund, handoff, and response style basics", () => {
    const ids = REQUEST_RESOLUTION_FIELD_DEFINITIONS.map((field) => field.fieldId);
    expect(ids).toEqual(expect.arrayContaining([
      "rules.refundPolicy.autoRefundMaxAmount",
      "rules.handoffPolicy.highValueRefund",
      "rules.responseStyle.tone"
    ]));
  });

  it("sample config contains no customer name or real endpoint markers", () => {
    const serialized = JSON.stringify(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG).toLowerCase();
    expect(serialized).not.toContain("customer_name");
    expect(serialized).not.toContain("https://");
    expect(serialized).not.toContain("api.");
    expect(REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.adapters.every((adapter) => adapter.mode === "mock")).toBe(true);
  });

  it("request-resolution rule impacts include high-value refund guard and trace artifacts", () => {
    expect(REQUEST_RESOLUTION_RULE_IMPACTS.length).toBeGreaterThan(0);
    const impact = getRuleImpact("rules.refundPolicy.autoRefundMaxAmount");
    expect(impact?.affects.some((target) => target.kind === "guard" && target.id === "high_value_refund")).toBe(true);
    expect(impact?.artifacts).toContain("trace.expectation.json");
  });

  it("api failure impact explains fail-closed safety", () => {
    const impact = getRuleImpact("rules.refundPolicy.apiFailureStrategy");
    expect(impact?.safetyNotes?.en?.join(" ").toLowerCase()).toContain("fail-closed");
    expect(impact?.affects.some((target) => target.id.includes("api_failed") || target.id.includes("api failure"))).toBe(true);
  });

  it("response tone impact only affects template-style outputs", () => {
    const impact = getRuleImpact("rules.responseStyle.tone");
    expect(impact?.artifacts).toEqual(["templates.json"]);
    expect(impact?.affects.every((target) => target.kind === "template")).toBe(true);
  });

  it("explainRuleImpact returns deterministic en and zh-CN text", () => {
    const en = explainRuleImpact("rules.refundPolicy.autoRefundMaxAmount", "en");
    const zh = explainRuleImpact("rules.refundPolicy.autoRefundMaxAmount", "zh-CN");
    expect(en).toContain("Auto refund max amount");
    expect(en).toContain("high_value_refund");
    expect(zh).toContain("自动退款金额上限");
    expect(zh).toContain("high_value_refund");
  });

  it("unknown rule impact returns undefined", () => {
    expect(getRuleImpact("rules.unknown")).toBeUndefined();
    expect(explainRuleImpact("rules.unknown", "en")).toBeUndefined();
  });
});
