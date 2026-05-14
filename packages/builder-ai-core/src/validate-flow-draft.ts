import type { AgentTemplateConfig } from "@yutra/builder-core";
import { flowDraftSchema } from "./flow-draft-schema";
import { AI_DRAFT_ERROR_CODES, aiDraftIssue, toValidationResult, zodToAiDraftIssues } from "./errors";
import type { AiDraftIssue, AiDraftValidationResult, FlowDraft } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeScenario(value: string): string {
  return value.toLowerCase().replace(/-/g, "_");
}

function mapTemplateToScenario(template: AgentTemplateConfig): string {
  const source = `${template.templateId}|${template.domain}`.toLowerCase();
  if (source.includes("ecommerce")) return "ecommerce_support";
  if (source.includes("helpdesk")) return "it_helpdesk";
  if (source.includes("approval")) return "approval";
  return "custom";
}

export function validateFlowDraft(draft: FlowDraft, template: AgentTemplateConfig): AiDraftValidationResult {
  const issues: AiDraftIssue[] = [];
  const parsed = flowDraftSchema.safeParse(draft);
  if (!parsed.success) {
    issues.push(...zodToAiDraftIssues(AI_DRAFT_ERROR_CODES.DRAFT_INVALID, parsed.error));
    return toValidationResult(issues);
  }

  const normalizedScenario = normalizeScenario(draft.scenario);
  const expectedScenario = mapTemplateToScenario(template);
  if (normalizedScenario !== expectedScenario && normalizedScenario !== "custom") {
    issues.push(
      aiDraftIssue(
        AI_DRAFT_ERROR_CODES.UNKNOWN_SCENARIO,
        `Draft scenario '${draft.scenario}' does not match template '${template.templateId}'.`,
        ["scenario"]
      )
    );
  }

  const knownIntents = new Set(template.supportedIntents.map((item) => item.id));
  for (const intent of draft.intents) {
    if (!knownIntents.has(intent.id)) {
      issues.push(
        aiDraftIssue(
          AI_DRAFT_ERROR_CODES.UNKNOWN_INTENT,
          `Unknown intent '${intent.id}' for template '${template.templateId}'.`,
          ["intents", intent.id]
        )
      );
    }
  }

  const selectedSkillsSet = new Set(draft.selectedSkills);
  const knownSkills = new Set(template.availableSkills.map((item) => item.name));
  for (const skillName of draft.selectedSkills) {
    if (!knownSkills.has(skillName)) {
      issues.push(
        aiDraftIssue(
          AI_DRAFT_ERROR_CODES.UNKNOWN_SKILL,
          `Unknown skill '${skillName}' for template '${template.templateId}'.`,
          ["selectedSkills", skillName]
        )
      );
    }
  }

  if (!isRecord(draft.rules)) {
    issues.push(aiDraftIssue(AI_DRAFT_ERROR_CODES.DRAFT_INVALID, "Draft rules must be an object.", ["rules"]));
  }
  if (draft.handoffRules !== undefined && !isRecord(draft.handoffRules)) {
    issues.push(
      aiDraftIssue(AI_DRAFT_ERROR_CODES.DRAFT_INVALID, "Draft handoffRules must be an object when provided.", ["handoffRules"])
    );
  }

  const stateIds = new Set((draft.states ?? []).map((state) => state.id));
  for (const state of draft.states ?? []) {
    for (const actionName of state.actions ?? []) {
      if (!selectedSkillsSet.has(actionName)) {
        issues.push(
          aiDraftIssue(
            AI_DRAFT_ERROR_CODES.UNKNOWN_SKILL,
            `State '${state.id}' references action '${actionName}' not included in selectedSkills.`,
            ["states", state.id, "actions"]
          )
        );
      }
    }
    for (const transition of state.transitions ?? []) {
      if (!stateIds.has(transition.to)) {
        issues.push(
          aiDraftIssue(
            AI_DRAFT_ERROR_CODES.DRAFT_INVALID,
            `State '${state.id}' transitions to unknown state '${transition.to}'.`,
            ["states", state.id, "transitions"]
          )
        );
      }
    }
  }

  const intentIds = new Set(draft.intents.map((intent) => intent.id));
  if (selectedSkillsSet.has("create_refund_request") && !intentIds.has("refund_request")) {
    issues.push(
      aiDraftIssue(
        AI_DRAFT_ERROR_CODES.ASSUMPTION_REQUIRED,
        "Refund skill is selected but refund_request intent is missing.",
        ["selectedSkills"],
        "warning",
        "Add refund_request intent or remove create_refund_request."
      )
    );
  }

  const needRiskGuard = selectedSkillsSet.has("create_refund_request") || intentIds.has("refund_request");
  const hasRiskGuard =
    draft.rules.requireHumanForRefundAfterDelivery === true ||
    draft.handoffRules?.highRisk === true ||
    draft.handoffRules?.refundApproval === true;
  if (needRiskGuard && !hasRiskGuard) {
    issues.push(
      aiDraftIssue(
        AI_DRAFT_ERROR_CODES.ASSUMPTION_REQUIRED,
        "High-risk refund strategy is not explicit in rules/handoffRules.",
        ["rules"],
        "warning",
        "Add require_handoff_for_high_risk or require_approval_for_refund strategy."
      )
    );
  }

  return toValidationResult(issues);
}
