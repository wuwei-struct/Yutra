import type { ConfigField, ConfigFieldSource, PackConfig } from "@yutra/pack-config-core";
import {
  APPROVAL_DECISION_RULE_IMPACTS,
  REQUEST_RESOLUTION_RULE_IMPACTS,
  type RuleImpactDefinition
} from "../../../../../packages/pack-config-core/src/rule-impact";
import type { RuleCompilerIssue } from "@yutra/rule-compiler";
import { updateConfigField, type SupportedCreatorArchetype } from "../../lib/creator-state";
import type { MessageKey } from "../../i18n";

export type SendCompiledDslMeta = {
  compileId?: string;
  compilerVersion?: string;
  configHash?: string;
  artifactHash?: string;
};

export function fieldValue<T>(config: PackConfig, key: string, fallback: T): T {
  return (config.rules[key]?.value as T | undefined) ?? fallback;
}

export function issueGroups(issues: RuleCompilerIssue[]) {
  return {
    errors: issues.filter((issue) => issue.severity === "error"),
    warnings: issues.filter((issue) => issue.severity === "warning")
  };
}

export function updateRule<T>(config: PackConfig, key: string, value: T): PackConfig {
  return {
    ...config,
    rules: {
      ...config.rules,
      [key]: updateConfigField(config.rules[key], value)
    }
  };
}

export function updateCapability(config: PackConfig, key: string, value: boolean): PackConfig {
  return {
    ...config,
    capabilities: {
      ...config.capabilities,
      [key]: updateConfigField(config.capabilities[key], value)
    }
  };
}

export const sourceLabelKeys: Record<ConfigFieldSource, MessageKey> = {
  confirmedByUser: "creator.impact.confirmedByUser",
  defaultFromPack: "creator.impact.defaultFromPack",
  inferredByAI: "creator.impact.inferredByAI",
  migrated: "creator.impact.migrated",
  requiredButMissing: "creator.impact.requiredButMissing"
};

export function fullRulePath(key: string): string {
  return `rules.${key}`;
}

export function getConfigField(config: PackConfig, fieldPath: string): ConfigField | undefined {
  if (fieldPath.startsWith("capabilities.")) {
    return config.capabilities[fieldPath.replace("capabilities.", "")];
  }
  if (fieldPath.startsWith("rules.")) {
    return config.rules[fieldPath.replace("rules.", "")];
  }
  return undefined;
}

export function isSupportedCreatorArchetype(archetypeId: string): archetypeId is SupportedCreatorArchetype {
  return archetypeId === "request-resolution" || archetypeId === "approval-decision";
}

export function getRuleImpactsForArchetype(archetypeId: string): RuleImpactDefinition[] {
  return archetypeId === "approval-decision" ? APPROVAL_DECISION_RULE_IMPACTS : REQUEST_RESOLUTION_RULE_IMPACTS;
}

export function getRuleImpactForArchetype(archetypeId: string, fieldPath: string): RuleImpactDefinition | undefined {
  return getRuleImpactsForArchetype(archetypeId).find((impact) => impact.fieldPath === fieldPath);
}
