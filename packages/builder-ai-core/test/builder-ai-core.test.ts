import { afterEach, describe, expect, it, vi } from "vitest";
import {
  builderFormSchema,
  ecommerceSupportTemplate,
  formConfigToAgentSpec,
  validateGeneratedSpec,
  type AgentTemplateConfig
} from "@yutra/builder-core";
import {
  buildFlowDraftPrompt,
  createFlowDraftProvider,
  explainFlowDraft,
  flowDraftSchema,
  flowDraftToBuilderFormConfig,
  mockAiDraftProvider,
  naturalLanguageBriefSchema,
  parseFlowDraftResponse,
  tagSelectionSchema,
  validateFlowDraft
} from "../src";
import type { FlowDraft, NaturalLanguageBrief, TagSelection } from "../src";
import { GenericHttpFlowDraftProvider } from "../src";

const template: AgentTemplateConfig = ecommerceSupportTemplate;

const validTags: TagSelection = {
  scenario: "ecommerce_support",
  capabilities: ["query_order", "query_shipping_status", "create_refund_request", "create_support_ticket"],
  strategies: ["require_handoff_for_high_risk", "service_oriented_response", "full_trace_audit"],
  language: "zh-CN"
};

const validBrief: NaturalLanguageBrief = {
  text: "物流超过48小时未更新要标记延迟，退货窗口7天，高风险金额5000需要人工处理。",
  locale: "zh-CN",
  constraints: ["仅用于本地 mock provider"]
};

const validDraft: FlowDraft = {
  draftId: "draft-1",
  scenario: "ecommerce_support",
  title: "电商售后客服草案",
  intents: [
    { id: "shipping_query", label: "物流查询" },
    { id: "refund_request", label: "退款申请" }
  ],
  selectedSkills: ["query_order", "query_shipping_status", "create_refund_request", "create_support_ticket"],
  rules: {
    delayedShipmentThresholdHours: 48,
    returnWindowDays: 7,
    highRiskAmountThreshold: 5000,
    requireHumanForRefundAfterDelivery: true
  },
  handoffRules: {
    highRisk: true,
    refundApproval: true
  },
  responseStyle: "service_oriented",
  assumptions: ["当前使用 mock adapter"],
  warnings: ["高风险退款不应自动完成"],
  states: [
    {
      id: "triage",
      actions: ["query_order"],
      transitions: [
        { when: 'ctx.intent == "shipping_query"', to: "query_shipping" },
        { when: 'ctx.intent == "refund_request"', to: "handle_refund" },
        { to: "resolved" }
      ]
    },
    {
      id: "query_shipping",
      actions: ["query_shipping_status"],
      transitions: [{ to: "resolved" }]
    },
    {
      id: "handle_refund",
      actions: ["create_refund_request"],
      transitions: [{ when: "ctx.risk_level == \"high\"", to: "handoff_human" }, { to: "resolved" }]
    },
    {
      id: "handoff_human",
      actions: ["create_support_ticket"]
    },
    {
      id: "resolved"
    }
  ],
  source: {
    type: "mock",
    provider: "mockAiDraftProvider"
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  metadata: {
    language: "zh-CN",
    locale: "zh-CN"
  }
};

describe("@yutra/builder-ai-core", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.YUTRA_BUILDER_AI_API_KEY;
    delete process.env.YUTRA_BUILDER_AI_BASE_URL;
    delete process.env.YUTRA_BUILDER_AI_MODEL;
    delete process.env.YUTRA_BUILDER_AI_TIMEOUT_MS;
  });

  it("valid TagSelection parses", () => {
    const parsed = tagSelectionSchema.safeParse(validTags);
    expect(parsed.success).toBe(true);
  });

  it("invalid scenario fails", () => {
    const parsed = tagSelectionSchema.safeParse({ ...validTags, scenario: "random" });
    expect(parsed.success).toBe(false);
  });

  it("valid NaturalLanguageBrief parses", () => {
    const parsed = naturalLanguageBriefSchema.safeParse(validBrief);
    expect(parsed.success).toBe(true);
  });

  it("empty brief text fails", () => {
    const parsed = naturalLanguageBriefSchema.safeParse({ ...validBrief, text: "  " });
    expect(parsed.success).toBe(false);
  });

  it("valid FlowDraft parses", () => {
    const parsed = flowDraftSchema.safeParse(validDraft);
    expect(parsed.success).toBe(true);
  });

  it("validateFlowDraft passes ecommerce draft", () => {
    const result = validateFlowDraft(validDraft, template);
    expect(result.ok).toBe(true);
  });

  it("validateFlowDraft catches unknown skill", () => {
    const result = validateFlowDraft({ ...validDraft, selectedSkills: [...validDraft.selectedSkills, "bad_skill"] }, template);
    expect(result.ok).toBe(false);
    expect(result.issues.some((item) => item.code === "AI_DRAFT_UNKNOWN_SKILL")).toBe(true);
  });

  it("validateFlowDraft catches unknown intent", () => {
    const result = validateFlowDraft(
      {
        ...validDraft,
        intents: [...validDraft.intents, { id: "non_exist_intent", label: "unknown" }]
      },
      template
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((item) => item.code === "AI_DRAFT_UNKNOWN_INTENT")).toBe(true);
  });

  it("validateFlowDraft warns on refund skill without refund intent", () => {
    const result = validateFlowDraft(
      {
        ...validDraft,
        intents: [{ id: "shipping_query", label: "物流查询" }],
        selectedSkills: ["query_order", "create_refund_request"],
        states: undefined
      },
      template
    );
    expect(result.ok).toBe(true);
    expect(result.issues.some((item) => item.code === "AI_DRAFT_ASSUMPTION_REQUIRED" && item.severity === "warning")).toBe(true);
  });

  it("explainFlowDraft returns deterministic human-readable text", () => {
    const textA = explainFlowDraft(validDraft);
    const textB = explainFlowDraft(validDraft);
    expect(textA).toBe(textB);
    expect(textA).toContain("草案名称：电商售后客服草案");
    expect(textA).toContain("将使用的 Skill：");
    expect(textA).toContain("请先 validate");
  });

  it("flowDraftToBuilderFormConfig converts valid draft", () => {
    const form = flowDraftToBuilderFormConfig(validDraft, template);
    expect(form.agentName).toBe(validDraft.title);
    expect(form.templateId).toBe(template.templateId);
    expect(form.selectedIntentIds).toEqual(["shipping_query", "refund_request"]);
  });

  it("converted form passes builderFormSchema", () => {
    const form = flowDraftToBuilderFormConfig(validDraft, template);
    const parsed = builderFormSchema.safeParse(form);
    expect(parsed.success).toBe(true);
  });

  it("converted form can generate AgentSpec using formConfigToAgentSpec", () => {
    const form = flowDraftToBuilderFormConfig(validDraft, template);
    const spec = formConfigToAgentSpec(form, template);
    expect(spec.agent).toBeTruthy();
    expect(spec.initial_state).toBe("triage");
  });

  it("generated AgentSpec passes validateGeneratedSpec", () => {
    const form = flowDraftToBuilderFormConfig(validDraft, template);
    const spec = formConfigToAgentSpec(form, template);
    const result = validateGeneratedSpec(spec);
    expect(result.ok).toBe(true);
  });

  it("mockAiDraftProvider creates shipping draft from tags", async () => {
    const draft = await mockAiDraftProvider({
      tags: { ...validTags, capabilities: ["query_order", "query_shipping_status"] },
      brief: validBrief,
      template
    });
    expect(draft.source.type).toBe("mock");
    expect(draft.intents.some((item) => item.id === "shipping_query")).toBe(true);
    expect(draft.selectedSkills).toContain("query_order");
    expect(draft.selectedSkills).toContain("query_shipping_status");
  });

  it("mockAiDraftProvider extracts 48小时 / 7天 / 5000 from brief", async () => {
    const draft = await mockAiDraftProvider({
      tags: validTags,
      brief: validBrief,
      template
    });
    expect(draft.rules.delayedShipmentThresholdHours).toBe(48);
    expect(draft.rules.returnWindowDays).toBe(7);
    expect(draft.rules.highRiskAmountThreshold).toBe(5000);
  });

  it("buildFlowDraftPrompt includes constraints not to execute Runtime or generate final DSL", () => {
    const prompt = buildFlowDraftPrompt({ tags: validTags, brief: validBrief, template });
    expect(prompt).toContain("Do NOT generate final executable DSL");
    expect(prompt).toContain("Do NOT execute runtime");
    expect(prompt).toContain("Do NOT bypass validation");
    expect(prompt).toContain("Do NOT output executable code.");
    expect(prompt).toContain("Do NOT call tools.");
    expect(prompt).toContain("allowedRuleKeys");
  });

  it("parse pure JSON FlowDraft", () => {
    const result = parseFlowDraftResponse(JSON.stringify(validDraft));
    expect(result.ok).toBe(true);
    expect(result.draft?.draftId).toBe(validDraft.draftId);
  });

  it("parse fenced JSON FlowDraft", () => {
    const result = parseFlowDraftResponse(`\`\`\`json\n${JSON.stringify(validDraft, null, 2)}\n\`\`\``);
    expect(result.ok).toBe(true);
    expect(result.draft?.scenario).toBe("ecommerce_support");
  });

  it("parse invalid JSON returns AI_DRAFT_PARSE_FAILED", () => {
    const result = parseFlowDraftResponse("{ bad json ");
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("AI_DRAFT_PARSE_FAILED");
  });

  it("missing real provider config returns structured error", async () => {
    const provider = createFlowDraftProvider({
      mode: "real",
      realProviderEnabled: true,
      llmConfig: {
        provider: "generic-http"
      }
    });
    const result = await provider.generate({ tags: validTags, brief: validBrief, template });
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("AI_DRAFT_PROVIDER_CONFIG_MISSING");
  });

  it("real provider disabled by default", async () => {
    const provider = createFlowDraftProvider({
      mode: "real"
    });
    const result = await provider.generate({ tags: validTags, brief: validBrief, template });
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("AI_DRAFT_REAL_PROVIDER_DISABLED");
  });

  it("validateFlowDraft still required after parse", async () => {
    process.env.YUTRA_BUILDER_AI_API_KEY = "test-key";
    const invalidDraft = {
      ...validDraft,
      source: {
        type: "llm",
        provider: "test"
      },
      selectedSkills: ["bad_skill"]
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: JSON.stringify(invalidDraft) }
              }
            ]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    const provider = new GenericHttpFlowDraftProvider({
      provider: "generic-http",
      baseUrl: "https://example.com/v1/chat/completions",
      model: "test-model",
      apiKeyEnv: "YUTRA_BUILDER_AI_API_KEY"
    });
    const result = await provider.generate({ tags: validTags, brief: validBrief, template });
    expect(result.ok).toBe(false);
    expect(result.issues.some((item) => item.code === "AI_DRAFT_UNKNOWN_SKILL")).toBe(true);
  });

  it("public API exports", async () => {
    const mod = await import("../src/index");
    expect(mod.tagSelectionSchema).toBeTruthy();
    expect(mod.naturalLanguageBriefSchema).toBeTruthy();
    expect(mod.flowDraftSchema).toBeTruthy();
    expect(typeof mod.validateFlowDraft).toBe("function");
    expect(typeof mod.explainFlowDraft).toBe("function");
    expect(typeof mod.flowDraftToBuilderFormConfig).toBe("function");
    expect(typeof mod.mockAiDraftProvider).toBe("function");
    expect(typeof mod.buildFlowDraftPrompt).toBe("function");
  });
});
