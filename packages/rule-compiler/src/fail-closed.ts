import {
  canPublishPackConfig,
  validateApprovalDecisionConfig,
  validatePackConfig,
  validateRequestResolutionConfig,
  type PackConfig,
  type PackConfigIssue
} from "@yutra/pack-config-core";
import { isSideEffectAtLeast } from "@yutra/archetype-core";
import type { RuleCompilerInput } from "./types";
import type { RuleCompilerIssue } from "./errors";

function mapPackIssue(issue: PackConfigIssue): RuleCompilerIssue {
  const codeByPackCode: Partial<Record<string, RuleCompilerIssue["code"]>> = {
    PACK_CONFIG_REQUIRED_FIELD_MISSING: "RULE_COMPILER_REQUIRED_FIELD_MISSING",
    PACK_CONFIG_UNCONFIRMED_AI_FIELD: "RULE_COMPILER_UNCONFIRMED_AI_FIELD",
    PACK_CONFIG_SECRET_NOT_ALLOWED: "RULE_COMPILER_SECRET_NOT_ALLOWED",
    PACK_CONFIG_REAL_ENDPOINT_NOT_ALLOWED: "RULE_COMPILER_REAL_ENDPOINT_NOT_ALLOWED",
    PACK_CONFIG_ADAPTER_MODE_NOT_PUBLISHABLE: "RULE_COMPILER_REAL_ADAPTER_NOT_PUBLISHABLE"
  };
  return {
    code: codeByPackCode[issue.code] ?? "RULE_COMPILER_CONFIG_INVALID",
    severity: issue.severity,
    message: issue.message,
    path: issue.path,
    hint: issue.hint
  };
}

function hasHandoffCapability(config: PackConfig): boolean {
  return config.capabilities.handoff?.value === true;
}

function validateArchetypeSpecificConfig(config: PackConfig): PackConfigIssue[] {
  if (config.archetypeId === "request-resolution") {
    return validateRequestResolutionConfig(config).issues;
  }
  if (config.archetypeId === "approval-decision") {
    return validateApprovalDecisionConfig(config).issues;
  }
  return [];
}

export function validateCompileInput(input: RuleCompilerInput): RuleCompilerIssue[] {
  const issues: RuleCompilerIssue[] = [];
  const mode = input.mode ?? "preview";
  const base = validatePackConfig(input.config);
  const archetypeSpecific = validateArchetypeSpecificConfig(input.config);
  issues.push(...base.issues.map(mapPackIssue));
  issues.push(...archetypeSpecific.filter((issue) => !base.issues.includes(issue)).map(mapPackIssue));

  if (input.config.archetypeId !== "request-resolution" && input.config.archetypeId !== "approval-decision") {
    issues.push({
      code: "RULE_COMPILER_UNSUPPORTED_ARCHETYPE",
      severity: "error",
      message: `Unsupported archetype ${input.config.archetypeId}. This compiler supports request-resolution and approval-decision.`,
      path: ["archetypeId"]
    });
  }

  if (mode === "publish") {
    issues.push(...canPublishPackConfig(input.config).issues.map(mapPackIssue));
  }

  for (const [index, adapter] of input.config.adapters.entries()) {
    const loose = adapter as typeof adapter & { containsSecret?: boolean; containsRealEndpoint?: boolean };
    if (loose.containsSecret !== false) {
      issues.push({
        code: "RULE_COMPILER_SECRET_NOT_ALLOWED",
        severity: "error",
        message: `Adapter ${adapter.adapterId} contains a secret marker.`,
        path: ["adapters", String(index), "containsSecret"]
      });
    }
    if (loose.containsRealEndpoint !== false) {
      issues.push({
        code: "RULE_COMPILER_REAL_ENDPOINT_NOT_ALLOWED",
        severity: "error",
        message: `Adapter ${adapter.adapterId} contains a real endpoint marker.`,
        path: ["adapters", String(index), "containsRealEndpoint"]
      });
    }
  }

  if (!hasHandoffCapability(input.config)) {
    issues.push({
      code: "RULE_COMPILER_FAIL_CLOSED",
      severity: "error",
      message: `${input.config.archetypeId} compilation requires handoff capability for fail-closed fallback.`,
      path: ["capabilities", "handoff"]
    });
  }

  const sideEffectPolicy = input.config.governance.sideEffectPolicy;
  if (sideEffectPolicy && isSideEffectAtLeast(sideEffectPolicy.maxAutoSideEffect, "write")) {
    issues.push({
      code: "RULE_COMPILER_SIDE_EFFECT_UNGUARDED",
      severity: "error",
      message: "maxAutoSideEffect must stay below write for this public basic compiler.",
      path: ["governance", "sideEffectPolicy", "maxAutoSideEffect"]
    });
  }

  return issues;
}
