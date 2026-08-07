import { isArchetypeId, type SideEffectLevel } from "@yutra/archetype-core";
import { packConfigSchema, type AdapterConfig, type PackConfig } from "./pack-config-schema";
import { APPROVAL_DECISION_FIELD_IDS } from "./approval-decision-config";
import {
  DIAGNOSTIC_RESOLUTION_DEMO_SIGNAL_IDS,
  DIAGNOSTIC_RESOLUTION_FIELD_IDS
} from "./diagnostic-resolution-config";
import { KNOWLEDGE_ANSWERING_FIELD_IDS } from "./knowledge-answering-config";
import { INTAKE_COLLECTOR_FIELD_IDS } from "./intake-collector-config";
import { REQUEST_RESOLUTION_FIELD_IDS } from "./request-resolution-config";
import type { PackConfigIssue, PackConfigValidationResult } from "./errors";
import { makeResult } from "./errors";
import { collectUnconfirmedFields, isFieldMissing, isFieldNeedsConfirmation } from "./provenance";

function schemaIssues(error: { issues: Array<{ path: Array<string | number>; message: string }> }): PackConfigIssue[] {
  return error.issues.map((issue) => ({
    code: "PACK_CONFIG_SCHEMA_INVALID",
    severity: "error",
    message: issue.message,
    path: issue.path.map(String)
  }));
}

function validateAdapters(adapters: AdapterConfig[]): PackConfigIssue[] {
  const issues: PackConfigIssue[] = [];
  adapters.forEach((adapter, index) => {
    const loose = adapter as AdapterConfig & { containsSecret?: boolean; containsRealEndpoint?: boolean };
    if (loose.containsSecret !== false) {
      issues.push({
        code: "PACK_CONFIG_SECRET_NOT_ALLOWED",
        severity: "error",
        message: `Adapter ${adapter.adapterId ?? index} must not contain secrets.`,
        path: ["adapters", String(index), "containsSecret"]
      });
    }
    if (loose.containsRealEndpoint !== false) {
      issues.push({
        code: "PACK_CONFIG_REAL_ENDPOINT_NOT_ALLOWED",
        severity: "error",
        message: `Adapter ${adapter.adapterId ?? index} must not contain real endpoints.`,
        path: ["adapters", String(index), "containsRealEndpoint"]
      });
    }
  });
  return issues;
}

function sideEffectTooHigh(level: SideEffectLevel | undefined): boolean {
  return level === "write" || level === "external" || level === "financial" || level === "approval" || level === "notification" || level === "irreversible";
}

export function validatePackConfig(input: unknown): PackConfigValidationResult {
  const issues: PackConfigIssue[] = [];
  const parsed = packConfigSchema.safeParse(input);

  if (!parsed.success) {
    issues.push(...schemaIssues(parsed.error));
    const maybe = input as Partial<PackConfig> | undefined;
    if (typeof maybe?.archetypeId === "string" && !isArchetypeId(maybe.archetypeId)) {
      issues.push({
        code: "PACK_CONFIG_ARCHETYPE_INVALID",
        severity: "error",
        message: `Unknown archetype id ${maybe.archetypeId}.`,
        path: ["archetypeId"]
      });
    }
    if (typeof maybe?.packConfigVersion === "string" && !/^\d+\.\d+\.\d+([-.][A-Za-z0-9.]+)?$/.test(maybe.packConfigVersion)) {
      issues.push({
        code: "PACK_CONFIG_VERSION_INVALID",
        severity: "error",
        message: `Invalid pack config version ${maybe.packConfigVersion}.`,
        path: ["packConfigVersion"]
      });
    }
    if (Array.isArray(maybe?.adapters)) {
      issues.push(...validateAdapters(maybe.adapters as AdapterConfig[]));
    }
    return makeResult(issues);
  }

  const config = parsed.data;
  if (!isArchetypeId(config.archetypeId)) {
    issues.push({
      code: "PACK_CONFIG_ARCHETYPE_INVALID",
      severity: "error",
      message: `Unknown archetype id ${config.archetypeId}.`,
      path: ["archetypeId"]
    });
  }

  for (const [section, fields] of [
    ["capabilities", config.capabilities],
    ["rules", config.rules],
    ["policies", config.policies]
  ] as const) {
    for (const [fieldId, field] of Object.entries(fields)) {
      if (isFieldNeedsConfirmation(field)) {
        issues.push({
          code: "PACK_CONFIG_UNCONFIRMED_AI_FIELD",
          severity: "warning",
          message: `${section}.${fieldId} needs user confirmation.`,
          path: [section, fieldId]
        });
      }
      if (isFieldMissing(field)) {
        issues.push({
          code: "PACK_CONFIG_REQUIRED_FIELD_MISSING",
          severity: "error",
          message: `${section}.${fieldId} is required but missing.`,
          path: [section, fieldId]
        });
      }
    }
  }

  issues.push(...validateAdapters(config.adapters));

  if (config.governance.sideEffectPolicy && sideEffectTooHigh(config.governance.sideEffectPolicy.maxAutoSideEffect)) {
    issues.push({
      code: "PACK_CONFIG_FIELD_TYPE_INVALID",
      severity: "warning",
      message: "Pack Config allows write-or-higher automatic side effects; keep this behind policy review.",
      path: ["governance", "sideEffectPolicy", "maxAutoSideEffect"]
    });
  }

  return makeResult(issues);
}

export function validateRequestResolutionConfig(input: unknown): PackConfigValidationResult {
  const base = validatePackConfig(input);
  const issues = [...base.issues];
  const parsed = packConfigSchema.safeParse(input);
  if (!parsed.success) {
    return makeResult(issues);
  }

  const config = parsed.data;
  if (config.archetypeId !== "request-resolution") {
    issues.push({
      code: "PACK_CONFIG_ARCHETYPE_INVALID",
      severity: "error",
      message: "Request-resolution config must use archetypeId=request-resolution.",
      path: ["archetypeId"]
    });
  }

  const knownCapabilityIds = new Set(
    REQUEST_RESOLUTION_FIELD_IDS.filter((id) => id.startsWith("capabilities.")).map((id) => id.replace("capabilities.", ""))
  );
  for (const capabilityId of Object.keys(config.capabilities)) {
    if (!knownCapabilityIds.has(capabilityId)) {
      issues.push({
        code: "PACK_CONFIG_UNKNOWN_CAPABILITY",
        severity: "warning",
        message: `Unknown request-resolution capability ${capabilityId}.`,
        path: ["capabilities", capabilityId]
      });
    }
  }

  return makeResult(issues);
}

export function validateApprovalDecisionConfig(input: unknown): PackConfigValidationResult {
  const base = validatePackConfig(input);
  const issues = [...base.issues];
  const parsed = packConfigSchema.safeParse(input);
  if (!parsed.success) {
    return makeResult(issues);
  }

  const config = parsed.data;
  if (config.archetypeId !== "approval-decision") {
    issues.push({
      code: "PACK_CONFIG_ARCHETYPE_INVALID",
      severity: "error",
      message: "Approval-decision config must use archetypeId=approval-decision.",
      path: ["archetypeId"]
    });
  }

  const knownCapabilityIds = new Set(
    APPROVAL_DECISION_FIELD_IDS.filter((id) => id.startsWith("capabilities.")).map((id) => id.replace("capabilities.", ""))
  );
  for (const capabilityId of Object.keys(config.capabilities)) {
    if (!knownCapabilityIds.has(capabilityId)) {
      issues.push({
        code: "PACK_CONFIG_UNKNOWN_CAPABILITY",
        severity: "warning",
        message: `Unknown approval-decision capability ${capabilityId}.`,
        path: ["capabilities", capabilityId]
      });
    }
  }

  return makeResult(issues);
}

export function validateKnowledgeAnsweringConfig(input: unknown): PackConfigValidationResult {
  const base = validatePackConfig(input);
  const issues = [...base.issues];
  const parsed = packConfigSchema.safeParse(input);
  if (!parsed.success) {
    return makeResult(issues);
  }

  const config = parsed.data;
  if (config.archetypeId !== "knowledge-answering") {
    issues.push({
      code: "PACK_CONFIG_ARCHETYPE_INVALID",
      severity: "error",
      message: "Knowledge-answering config must use archetypeId=knowledge-answering.",
      path: ["archetypeId"]
    });
  }

  const knownCapabilityIds = new Set(
    KNOWLEDGE_ANSWERING_FIELD_IDS.filter((id) => id.startsWith("capabilities.")).map((id) => id.replace("capabilities.", ""))
  );
  for (const capabilityId of Object.keys(config.capabilities)) {
    if (!knownCapabilityIds.has(capabilityId)) {
      issues.push({
        code: "PACK_CONFIG_UNKNOWN_CAPABILITY",
        severity: "warning",
        message: `Unknown knowledge-answering capability ${capabilityId}.`,
        path: ["capabilities", capabilityId]
      });
    }
  }

  return makeResult(issues);
}

export function validateIntakeCollectorConfig(input: unknown): PackConfigValidationResult {
  const base = validatePackConfig(input);
  const issues = [...base.issues];
  const parsed = packConfigSchema.safeParse(input);
  if (!parsed.success) {
    return makeResult(issues);
  }

  const config = parsed.data;
  if (config.archetypeId !== "intake-collector") {
    issues.push({
      code: "PACK_CONFIG_ARCHETYPE_INVALID",
      severity: "error",
      message: "Intake-collector config must use archetypeId=intake-collector.",
      path: ["archetypeId"]
    });
  }

  const knownCapabilityIds = new Set(
    INTAKE_COLLECTOR_FIELD_IDS.filter((id) => id.startsWith("capabilities.")).map(
      (id) => id.replace("capabilities.", "")
    )
  );
  for (const capabilityId of Object.keys(config.capabilities)) {
    if (!knownCapabilityIds.has(capabilityId)) {
      issues.push({
        code: "PACK_CONFIG_UNKNOWN_CAPABILITY",
        severity: "warning",
        message: `Unknown intake-collector capability ${capabilityId}.`,
        path: ["capabilities", capabilityId]
      });
    }
  }

  return makeResult(issues);
}

export function validateDiagnosticResolutionConfig(input: unknown): PackConfigValidationResult {
  const base = validatePackConfig(input);
  const issues = [...base.issues];
  const parsed = packConfigSchema.safeParse(input);
  if (!parsed.success) {
    return makeResult(issues);
  }

  const config = parsed.data;
  if (config.archetypeId !== "diagnostic-resolution") {
    issues.push({
      code: "PACK_CONFIG_ARCHETYPE_INVALID",
      severity: "error",
      message: "Diagnostic-resolution config must use archetypeId=diagnostic-resolution.",
      path: ["archetypeId"]
    });
  }

  const knownCapabilityIds = new Set(
    DIAGNOSTIC_RESOLUTION_FIELD_IDS.filter((id) => id.startsWith("capabilities.")).map(
      (id) => id.replace("capabilities.", "")
    )
  );
  for (const capabilityId of Object.keys(config.capabilities)) {
    if (!knownCapabilityIds.has(capabilityId)) {
      issues.push({
        code: "PACK_CONFIG_UNKNOWN_CAPABILITY",
        severity: "warning",
        message: `Unknown diagnostic-resolution capability ${capabilityId}.`,
        path: ["capabilities", capabilityId]
      });
    }
  }

  const requiredSignals = config.rules["diagnosticPolicy.requiredSignals"]?.value;
  const allowedSignals = new Set<string>(DIAGNOSTIC_RESOLUTION_DEMO_SIGNAL_IDS);
  if (
    !Array.isArray(requiredSignals) ||
    requiredSignals.length === 0 ||
    requiredSignals.some((signal) => typeof signal !== "string" || !allowedSignals.has(signal))
  ) {
    issues.push({
      code: "PACK_CONFIG_FIELD_TYPE_INVALID",
      severity: "error",
      message: "requiredSignals must contain only allowlisted generic demo signal identifiers.",
      path: ["rules", "diagnosticPolicy.requiredSignals"]
    });
  }

  for (const [key, min, max] of [
    ["diagnosticPolicy.maxDiagnosticRounds", 1, 8],
    ["diagnosticPolicy.maxRemediationAttempts", 0, 3]
  ] as const) {
    const value = config.rules[key]?.value;
    if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) {
      issues.push({
        code: "PACK_CONFIG_FIELD_TYPE_INVALID",
        severity: "error",
        message: `${key} must be a safe integer between ${min} and ${max}.`,
        path: ["rules", key]
      });
    }
  }

  for (const [key, allowed] of [
    ["diagnosticPolicy.inconclusiveStrategy", ["ask_more_signals", "handoff", "stop_with_reason"]],
    ["diagnosticPolicy.checkFailureStrategy", ["retry", "handoff", "stop_with_reason"]],
    ["diagnosticPolicy.remediationStrategy", ["suggest_only", "mock_safe_attempt", "handoff"]]
  ] as const) {
    if (!allowed.includes(config.rules[key]?.value as never)) {
      issues.push({
        code: "PACK_CONFIG_FIELD_TYPE_INVALID",
        severity: "error",
        message: `${key} must use a supported explicit strategy.`,
        path: ["rules", key]
      });
    }
  }

  for (const key of [
    "validationPolicy.requireEvidenceBeforeDiagnosis",
    "validationPolicy.rejectUnknownSignals",
    "validationPolicy.requireVerificationBeforeComplete"
  ]) {
    if (typeof config.rules[key]?.value !== "boolean") {
      issues.push({
        code: "PACK_CONFIG_FIELD_TYPE_INVALID",
        severity: "error",
        message: `${key} must be boolean.`,
        path: ["rules", key]
      });
    }
  }

  return makeResult(issues);
}

export function canPublishPackConfig(input: unknown): PackConfigValidationResult {
  const validation = validatePackConfig(input);
  const issues = [...validation.issues];
  const parsed = packConfigSchema.safeParse(input);
  if (!parsed.success) {
    return makeResult(issues);
  }

  const config = parsed.data;
  if (!config.governance.publishable) {
    issues.push({
      code: "PACK_CONFIG_NOT_PUBLISHABLE",
      severity: "error",
      message: "governance.publishable=false blocks publish.",
      path: ["governance", "publishable"]
    });
  }

  for (const field of collectUnconfirmedFields(config)) {
    if (field.field.source === "requiredButMissing") {
      issues.push({
        code: "PACK_CONFIG_REQUIRED_FIELD_MISSING",
        severity: "error",
        message: `${field.path.join(".")} is required but missing.`,
        path: field.path
      });
    }
    if (config.governance.environment === "prod-like" || config.governance.environment === "production") {
      if (field.field.source === "inferredByAI" || field.field.needsConfirmation) {
        issues.push({
          code: "PACK_CONFIG_UNCONFIRMED_AI_FIELD",
          severity: "error",
          message: `${field.path.join(".")} must be confirmed before prod-like or production publish.`,
          path: field.path
        });
      }
    }
  }

  for (const [index, adapter] of config.adapters.entries()) {
    if ((config.governance.environment === "production" || config.governance.environment === "prod-like") && adapter.mode === "real_placeholder") {
      issues.push({
        code: "PACK_CONFIG_ADAPTER_MODE_NOT_PUBLISHABLE",
        severity: "error",
        message: `Adapter ${adapter.adapterId} is real_placeholder and cannot be published to ${config.governance.environment}.`,
        path: ["adapters", String(index), "mode"]
      });
    }
  }

  return makeResult(issues);
}
