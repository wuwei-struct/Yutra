import { describe, expect, it } from "vitest";
import {
  BUILDER_ISSUE_CODES,
  BuilderCoreError,
  agentSpecToChineseDsl,
  builderFormSchema,
  builderTemplateSchema,
  ecommerceSupportTemplate,
  formConfigToAgentSpec,
  validateGeneratedSpec
} from "../src/index";

describe("@yutra/builder-core", () => {
  const shippingForm = {
    agentName: "\u7535\u5546\u5ba2\u670d\u52a9\u624b",
    templateId: "ecommerce-support",
    selectedIntentIds: ["shipping_query"],
    selectedSkillNames: ["query_order", "query_shipping_status"],
    language: "zh-CN" as const
  };

  const refundHandoffForm = {
    agentName: "Refund Escalation Agent",
    templateId: "ecommerce-support",
    selectedIntentIds: ["refund_request", "handoff"],
    selectedSkillNames: ["query_order", "create_refund_request", "create_support_ticket"],
    language: "zh-CN" as const
  };

  it("ecommerceSupportTemplate is valid", () => {
    const parsed = builderTemplateSchema.safeParse(ecommerceSupportTemplate);
    expect(parsed.success).toBe(true);
  });

  it("valid BuilderFormConfig parses", () => {
    const parsed = builderFormSchema.safeParse(shippingForm);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.language).toBe("zh-CN");
    }
  });

  it("unknown skill in form fails validation", () => {
    const badForm = {
      ...shippingForm,
      selectedSkillNames: ["query_order", "unknown_skill"]
    };
    expect(() => formConfigToAgentSpec(badForm, ecommerceSupportTemplate)).toThrow(BuilderCoreError);
    try {
      formConfigToAgentSpec(badForm, ecommerceSupportTemplate);
    } catch (error) {
      const builderError = error as BuilderCoreError;
      expect(builderError.issues.some((item) => item.code === BUILDER_ISSUE_CODES.UNKNOWN_SKILL)).toBe(true);
    }
  });

  it("unknown intent in form fails validation", () => {
    const badForm = {
      ...shippingForm,
      selectedIntentIds: ["shipping_query", "unknown_intent"]
    };
    expect(() => formConfigToAgentSpec(badForm, ecommerceSupportTemplate)).toThrow(BuilderCoreError);
    try {
      formConfigToAgentSpec(badForm, ecommerceSupportTemplate);
    } catch (error) {
      const builderError = error as BuilderCoreError;
      expect(builderError.issues.some((item) => item.code === BUILDER_ISSUE_CODES.UNKNOWN_INTENT)).toBe(true);
    }
  });

  it("formConfigToAgentSpec generates valid AgentSpec for shipping flow", () => {
    const spec = formConfigToAgentSpec(shippingForm, ecommerceSupportTemplate);
    const validated = validateGeneratedSpec(spec);
    expect(spec.initial_state).toBe("triage");
    expect(spec.states.query_shipping).toBeTruthy();
    expect(validated.ok).toBe(true);
  });

  it("formConfigToAgentSpec generates valid AgentSpec for refund/handoff flow", () => {
    const spec = formConfigToAgentSpec(refundHandoffForm, ecommerceSupportTemplate);
    const validated = validateGeneratedSpec(spec);
    expect(spec.states.handle_refund).toBeTruthy();
    expect(spec.states.create_handoff_ticket).toBeTruthy();
    expect(spec.states.handoff_human?.handoff).toBe(true);
    expect(validated.ok).toBe(true);
  });

  it("generated spec includes only selected skills", () => {
    const spec = formConfigToAgentSpec(shippingForm, ecommerceSupportTemplate);
    const actionNames = new Set((spec.actions ?? []).map((item) => item.name));
    expect(actionNames.has("query_order")).toBe(true);
    expect(actionNames.has("query_shipping_status")).toBe(true);
    expect(actionNames.has("create_refund_request")).toBe(false);
    expect(actionNames.has("create_support_ticket")).toBe(false);
  });

  it("generated spec has initial_state", () => {
    const spec = formConfigToAgentSpec(shippingForm, ecommerceSupportTemplate);
    expect(spec.initial_state).toBe("triage");
  });

  it("generated spec has final or handoff state", () => {
    const spec = formConfigToAgentSpec(refundHandoffForm, ecommerceSupportTemplate);
    const hasTerminalState = Object.values(spec.states).some((state) => state.final === true || state.handoff === true);
    expect(hasTerminalState).toBe(true);
  });

  it("validateGeneratedSpec passes generated spec", () => {
    const spec = formConfigToAgentSpec(refundHandoffForm, ecommerceSupportTemplate);
    const result = validateGeneratedSpec(spec);
    expect(result.ok).toBe(true);
    expect(result.issues.some((item) => item.severity === "error")).toBe(false);
  });

  it("agentSpecToChineseDsl returns deterministic readable output", () => {
    const spec = formConfigToAgentSpec(refundHandoffForm, ecommerceSupportTemplate);
    const dslA = agentSpecToChineseDsl(spec);
    const dslB = agentSpecToChineseDsl(spec);
    expect(dslA).toBe(dslB);
    expect(dslA).toContain("\u667a\u80fd\u4f53:");
    expect(dslA).toContain("\u521d\u59cb\u72b6\u6001: triage");
    expect(dslA).toContain("\u72b6\u6001\u96c6:");
    expect(dslA).toContain("\u52a8\u4f5c:");
    expect(dslA).toContain("implementation:");
  });

  it("package exports public API", async () => {
    const mod = await import("../src/index");
    expect(mod.builderTemplateSchema).toBeTruthy();
    expect(mod.builderFormSchema).toBeTruthy();
    expect(mod.ecommerceSupportTemplate).toBeTruthy();
    expect(typeof mod.formConfigToAgentSpec).toBe("function");
    expect(typeof mod.agentSpecToChineseDsl).toBe("function");
    expect(typeof mod.validateGeneratedSpec).toBe("function");
  });
});

