import type { ActionSpec, AgentSpec, ContextSpec, IntentSpec, StateSpec } from "@yutra/spec";
import { builderFormSchema } from "./form-schema";
import { builderTemplateSchema } from "./template-schema";
import {
  BUILDER_ISSUE_CODES,
  type AgentTemplateConfig,
  type BuilderFormConfig,
  type BuilderIssue
} from "./types";
import {
  issue,
  throwIfIssues,
  unknownIntentIssue,
  unknownSkillIssue,
  zodToBuilderIssues
} from "./errors";

function slugifyAgentName(value: string): string {
  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_./]+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return normalized || "generated-agent";
}

function hasIntent(form: BuilderFormConfig, intentId: string): boolean {
  return form.selectedIntentIds.includes(intentId);
}

function hasSkill(form: BuilderFormConfig, skillName: string): boolean {
  return form.selectedSkillNames.includes(skillName);
}

function buildIntents(form: BuilderFormConfig, template: AgentTemplateConfig): IntentSpec[] {
  return template.supportedIntents
    .filter((intent) => form.selectedIntentIds.includes(intent.id))
    .map((intent) => ({
      name: intent.id,
      description: intent.description ?? intent.label,
      entry_state: intent.entryState ?? "triage"
    }));
}

function buildContext(template: AgentTemplateConfig): ContextSpec | undefined {
  if (!template.defaultContextFields || template.defaultContextFields.length === 0) {
    return undefined;
  }

  const fields: NonNullable<ContextSpec["fields"]> = {};
  for (const field of template.defaultContextFields) {
    const generatedField: NonNullable<ContextSpec["fields"]>[string] = {
      type: field.type,
      required: field.required
    };
    if (Object.prototype.hasOwnProperty.call(field, "default") && field.default !== undefined) {
      generatedField.default = field.default;
    }
    fields[field.name] = generatedField;
  }
  return { fields };
}

function buildActions(form: BuilderFormConfig, template: AgentTemplateConfig): ActionSpec[] {
  const selected = new Set(form.selectedSkillNames);
  return template.availableSkills
    .filter((skill) => selected.has(skill.name))
    .map((skill) => ({
      name: skill.name,
      description: skill.description ?? skill.label,
      sideEffect: skill.sideEffect,
      riskLevel: skill.riskLevel,
      requiresApproval: skill.requiresApproval,
      implementation: {
        type: "skill",
        skillName: skill.name,
        metadata: {
          templateId: template.templateId
        }
      },
      metadata: {
        templateId: template.templateId
      }
    }));
}

function buildStates(form: BuilderFormConfig): Record<string, StateSpec> {
  const includeShipping = hasIntent(form, "shipping_query") && hasSkill(form, "query_shipping_status");
  const includeReturn = hasIntent(form, "return_request") && hasSkill(form, "create_return_request");
  const includeRefund = hasIntent(form, "refund_request") && hasSkill(form, "create_refund_request");
  const includeHandoff =
    hasIntent(form, "handoff") ||
    hasSkill(form, "create_support_ticket") ||
    hasIntent(form, "refund_request");

  const triageTransitions: NonNullable<StateSpec["transitions"]> = [];
  if (includeShipping) {
    triageTransitions.push({ to: "query_shipping", when: 'ctx.intent == "shipping_query"' });
  }
  if (includeReturn) {
    triageTransitions.push({ to: "handle_return", when: 'ctx.intent == "return_request"' });
  }
  if (includeRefund) {
    triageTransitions.push({ to: "handle_refund", when: 'ctx.intent == "refund_request"' });
  }
  if (includeHandoff && hasSkill(form, "create_support_ticket")) {
    triageTransitions.push({ to: "create_handoff_ticket", when: 'ctx.intent == "handoff"' });
  }
  triageTransitions.push({ to: "resolved" });

  const states: Record<string, StateSpec> = {
    triage: {
      actions: hasSkill(form, "query_order") ? ["query_order"] : undefined,
      transitions: triageTransitions
    },
    resolved: {
      final: true
    }
  };

  if (includeShipping) {
    states.query_shipping = {
      actions: [hasSkill(form, "query_order") ? "query_order" : "", "query_shipping_status"].filter(Boolean),
      transitions:
        includeHandoff && hasSkill(form, "create_support_ticket")
          ? [{ to: "create_handoff_ticket", when: "ctx.risk_level == \"high\"" }, { to: "resolved" }]
          : [{ to: "resolved" }]
    };
  }

  if (includeReturn) {
    states.handle_return = {
      actions: [hasSkill(form, "query_order") ? "query_order" : "", "create_return_request"].filter(Boolean),
      transitions:
        includeHandoff && hasSkill(form, "create_support_ticket")
          ? [{ to: "create_handoff_ticket", when: "ctx.missing_info?.length > 0" }, { to: "resolved" }]
          : [{ to: "resolved" }]
    };
  }

  if (includeRefund) {
    states.handle_refund = {
      actions: [hasSkill(form, "query_order") ? "query_order" : "", "create_refund_request"].filter(Boolean),
      transitions:
        includeHandoff && hasSkill(form, "create_support_ticket")
          ? [{ to: "create_handoff_ticket", when: "ctx.risk_level == \"high\"" }, { to: "resolved" }]
          : [{ to: "resolved" }]
    };
  }

  if (includeHandoff && hasSkill(form, "create_support_ticket")) {
    states.create_handoff_ticket = {
      actions: ["create_support_ticket"],
      transitions: [{ to: "handoff_human" }]
    };
    states.handoff_human = {
      handoff: true
    };
  }

  return states;
}

function validateFormAgainstTemplate(form: BuilderFormConfig, template: AgentTemplateConfig): BuilderIssue[] {
  const issues: BuilderIssue[] = [];

  if (form.templateId !== template.templateId) {
    issues.push(
      issue(
        BUILDER_ISSUE_CODES.UNKNOWN_TEMPLATE,
        `Form templateId '${form.templateId}' does not match template '${template.templateId}'.`,
        ["templateId"]
      )
    );
  }

  const knownIntentIds = new Set(template.supportedIntents.map((intent) => intent.id));
  for (const intentId of form.selectedIntentIds) {
    if (!knownIntentIds.has(intentId)) {
      issues.push(unknownIntentIssue(intentId));
    }
  }

  const knownSkillNames = new Set(template.availableSkills.map((skill) => skill.name));
  for (const skillName of form.selectedSkillNames) {
    if (!knownSkillNames.has(skillName)) {
      issues.push(unknownSkillIssue(skillName));
    }
  }

  return issues;
}

export function formConfigToAgentSpec(form: BuilderFormConfig, template: AgentTemplateConfig): AgentSpec {
  const parsedTemplate = builderTemplateSchema.safeParse(template);
  if (!parsedTemplate.success) {
    throwIfIssues(
      "Template validation failed.",
      zodToBuilderIssues(BUILDER_ISSUE_CODES.TEMPLATE_INVALID, parsedTemplate.error)
    );
  }

  const parsedForm = builderFormSchema.safeParse(form);
  if (!parsedForm.success) {
    throwIfIssues("Form validation failed.", zodToBuilderIssues(BUILDER_ISSUE_CODES.FORM_INVALID, parsedForm.error));
  }

  const relationIssues = validateFormAgainstTemplate(form, template);
  throwIfIssues("Form/template relation validation failed.", relationIssues);

  const states = buildStates(form);
  const spec: AgentSpec = {
    agent: slugifyAgentName(form.agentName),
    version: form.version ?? "0.1.0",
    intents: buildIntents(form, template),
    context: buildContext(template),
    initial_state: "triage",
    states,
    actions: buildActions(form, template)
  };

  return spec;
}
