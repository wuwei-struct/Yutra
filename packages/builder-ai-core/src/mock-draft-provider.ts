import type { AgentTemplateConfig } from "@yutra/builder-core";
import { AI_DRAFT_ERROR_CODES, BuilderAiCoreError, aiDraftIssue, throwIfAiDraftErrors, zodToAiDraftIssues } from "./errors";
import { naturalLanguageBriefSchema } from "./brief-schema";
import { tagSelectionSchema } from "./tag-schema";
import { ECOMMERCE_CAPABILITIES, STRATEGY_TAGS, type AiDraftIssue, type FlowDraft, type MockAiDraftProviderInput } from "./types";

type SupportedIntentId = "shipping_query" | "return_request" | "refund_request" | "handoff";

function deterministicHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function pickIntentIds(capabilities: Set<string>): SupportedIntentId[] {
  const intents: SupportedIntentId[] = [];
  if (capabilities.has("query_shipping_status")) intents.push("shipping_query");
  if (capabilities.has("create_return_request")) intents.push("return_request");
  if (capabilities.has("create_refund_request")) intents.push("refund_request");
  if (capabilities.has("create_support_ticket")) intents.push("handoff");
  if (intents.length === 0) intents.push("shipping_query");
  return intents;
}

function extractRuleHints(text: string): Record<string, unknown> {
  const rules: Record<string, unknown> = {};
  if (/48\s*小时/.test(text)) {
    rules.delayedShipmentThresholdHours = 48;
  }
  if (/7\s*天/.test(text)) {
    rules.returnWindowDays = 7;
  }
  const moneyMatch = text.match(/(\d{3,6})\s*(元|块|金额)?/);
  if (moneyMatch && /5000|金额|退款|高风险/.test(text)) {
    rules.highRiskAmountThreshold = Number(moneyMatch[1]);
  }
  return rules;
}

function resolveScenario(template: AgentTemplateConfig): string {
  const source = `${template.templateId}|${template.domain}`.toLowerCase();
  if (source.includes("ecommerce")) return "ecommerce_support";
  if (source.includes("helpdesk")) return "it_helpdesk";
  if (source.includes("approval")) return "approval";
  return "custom";
}

function resolveIntentsFromTemplate(template: AgentTemplateConfig, intentIds: SupportedIntentId[]) {
  const intentSet = new Set(intentIds);
  return template.supportedIntents
    .filter((intent) => intentSet.has(intent.id as SupportedIntentId))
    .map((intent) => ({
      id: intent.id,
      label: intent.label,
      description: intent.description
    }));
}

export async function mockAiDraftProvider(input: MockAiDraftProviderInput): Promise<FlowDraft> {
  const issues: AiDraftIssue[] = [];

  const parsedTags = tagSelectionSchema.safeParse(input.tags);
  if (!parsedTags.success) {
    issues.push(...zodToAiDraftIssues(AI_DRAFT_ERROR_CODES.TAG_SELECTION_INVALID, parsedTags.error));
    throw new BuilderAiCoreError("Tag selection validation failed.", issues);
  }
  const parsedBrief = naturalLanguageBriefSchema.safeParse(input.brief);
  if (!parsedBrief.success) {
    issues.push(...zodToAiDraftIssues(AI_DRAFT_ERROR_CODES.BRIEF_INVALID, parsedBrief.error));
    throw new BuilderAiCoreError("Natural language brief validation failed.", issues);
  }

  const tags = parsedTags.data;
  const brief = parsedBrief.data;
  if (tags.scenario !== "ecommerce_support") {
    issues.push(
      aiDraftIssue(
        AI_DRAFT_ERROR_CODES.UNKNOWN_SCENARIO,
        `mockAiDraftProvider currently supports ecommerce_support only, got '${tags.scenario}'.`,
        ["tags", "scenario"]
      )
    );
    throw new BuilderAiCoreError("Unsupported mock scenario.", issues);
  }

  const templateScenario = resolveScenario(input.template);
  if (templateScenario !== "ecommerce_support") {
    issues.push(
      aiDraftIssue(
        AI_DRAFT_ERROR_CODES.UNKNOWN_SCENARIO,
        `Template '${input.template.templateId}' is not an ecommerce_support template.`,
        ["template", "templateId"]
      )
    );
    throw new BuilderAiCoreError("Template scenario mismatch.", issues);
  }

  const knownCapabilitySet = new Set<string>(ECOMMERCE_CAPABILITIES);
  const knownStrategySet = new Set<string>(STRATEGY_TAGS);
  const unknownCapabilities = tags.capabilities.filter((item) => !knownCapabilitySet.has(item));
  const unknownStrategies = tags.strategies.filter((item) => !knownStrategySet.has(item));

  for (const capability of unknownCapabilities) {
    issues.push(
      aiDraftIssue(
        AI_DRAFT_ERROR_CODES.UNKNOWN_CAPABILITY,
        `Unknown capability '${capability}' in tag selection.`,
        ["tags", "capabilities"],
        "warning"
      )
    );
  }
  for (const strategy of unknownStrategies) {
    issues.push(
      aiDraftIssue(
        AI_DRAFT_ERROR_CODES.UNKNOWN_STRATEGY,
        `Unknown strategy '${strategy}' in tag selection.`,
        ["tags", "strategies"],
        "warning"
      )
    );
  }

  const selectedCapabilities = tags.capabilities.filter((item) => knownCapabilitySet.has(item));
  const capabilitiesSet = new Set(selectedCapabilities.length > 0 ? selectedCapabilities : ["query_order"]);
  if (selectedCapabilities.length === 0) {
    issues.push(
      aiDraftIssue(
        AI_DRAFT_ERROR_CODES.ASSUMPTION_REQUIRED,
        "No known capability selected. Fallback to query_order for draft stability.",
        ["tags", "capabilities"],
        "warning"
      )
    );
  }

  const selectedSkills = input.template.availableSkills
    .map((item) => item.name)
    .filter((skillName) => capabilitiesSet.has(skillName));

  const intentIds = pickIntentIds(capabilitiesSet);
  const intents = resolveIntentsFromTemplate(input.template, intentIds);
  throwIfAiDraftErrors(
    "No valid intents can be mapped from selected capabilities.",
    intents.length === 0
      ? [
          aiDraftIssue(
            AI_DRAFT_ERROR_CODES.UNKNOWN_INTENT,
            "No valid template intent can be mapped from selected capabilities.",
            ["intents"]
          )
        ]
      : []
  );

  const rules: Record<string, unknown> = { ...(input.template.defaultRules ?? {}) };
  Object.assign(rules, extractRuleHints(brief.text));

  const handoffRules: Record<string, unknown> = {};
  if (tags.strategies.includes("require_handoff_for_high_risk")) {
    handoffRules.highRisk = true;
  }
  if (tags.strategies.includes("require_approval_for_refund")) {
    rules.requireHumanForRefundAfterDelivery = true;
    handoffRules.refundApproval = true;
  }
  if (tags.strategies.includes("ask_for_missing_info")) {
    rules.askForMissingOrderId = true;
  }

  const warnings = issues.filter((item) => item.severity === "warning").map((item) => item.message);
  if (tags.strategies.includes("strict_policy_boundary")) {
    warnings.push("Strict policy boundary enabled: unknown policy or out-of-scope requests should hand off.");
  }

  const responseStyle = tags.strategies.includes("service_oriented_response") ? "service_oriented" : "neutral";
  const fingerprint = JSON.stringify({
    scenario: tags.scenario,
    capabilities: [...tags.capabilities].sort(),
    strategies: [...tags.strategies].sort(),
    brief: brief.text
  });
  const hash = deterministicHash(fingerprint);
  const createdAt = new Date(1704067200000 + (hash % 86400000)).toISOString();

  return {
    draftId: `mock-draft-${hash.toString(16)}`,
    scenario: tags.scenario,
    title: tags.language === "en" ? "E-commerce Support Draft" : "电商售后客服草案",
    description: tags.language === "en" ? "Deterministic mock flow draft from tags and brief." : "由标签与补充描述生成的稳定 mock 流程草案。",
    intents,
    selectedSkills,
    rules,
    handoffRules: Object.keys(handoffRules).length > 0 ? handoffRules : undefined,
    responseStyle,
    assumptions: [
      "This draft is generated by mock provider only.",
      "Use mock adapter mode before any real integration."
    ],
    warnings,
    states: [
      { id: "triage", label: "分流", actions: selectedSkills.includes("query_order") ? ["query_order"] : [] },
      { id: "resolved", label: "已解决" },
      ...(selectedSkills.includes("create_support_ticket")
        ? [{ id: "handoff_human", label: "人工接管", actions: ["create_support_ticket"] }]
        : [])
    ],
    source: {
      type: "mock",
      provider: "mockAiDraftProvider",
      model: "mock-rule-v1"
    },
    createdAt,
    metadata: {
      language: tags.language,
      locale: brief.locale,
      traceRequired: tags.strategies.includes("full_trace_audit"),
      tagIssues: issues
    }
  };
}
