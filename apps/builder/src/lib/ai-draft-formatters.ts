import type { AiDraftIssue } from "@yutra/builder-ai-core";
import type { BuilderFormConfig } from "@yutra/builder-core";
import type { DraftDiffItem } from "../types";

export function prettyDraftJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function toReadableIssues(issues: AiDraftIssue[] | undefined): string[] {
  if (!issues || issues.length === 0) {
    return [];
  }
  return issues.map((issue) => {
    const path = issue.path && issue.path.length > 0 ? ` (${issue.path.join(".")})` : "";
    const hint = issue.hint ? ` | hint: ${issue.hint}` : "";
    return `[${issue.severity}] ${issue.code}: ${issue.message}${path}${hint}`;
  });
}

export function summarizeFormChanges(changes: DraftDiffItem[]): string {
  if (changes.length === 0) {
    return "No changes";
  }
  return changes.map((item) => item.field).join(", ");
}

export function mapDraftFormToRuleValues(
  draftForm: BuilderFormConfig,
  fallback: {
    delayedShipmentThresholdHours: number;
    returnWindowDays: number;
    highRiskAmountThreshold: number;
    requireHumanForRefundAfterDelivery: boolean;
    requireHumanForDamagedGoods: boolean;
  }
): {
  delayedShipmentThresholdHours: number;
  returnWindowDays: number;
  highRiskAmountThreshold: number;
  requireHumanForRefundAfterDelivery: boolean;
  requireHumanForDamagedGoods: boolean;
} {
  const rules = draftForm.rules as Record<string, unknown>;
  return {
    delayedShipmentThresholdHours:
      typeof rules.delayedShipmentThresholdHours === "number"
        ? rules.delayedShipmentThresholdHours
        : fallback.delayedShipmentThresholdHours,
    returnWindowDays: typeof rules.returnWindowDays === "number" ? rules.returnWindowDays : fallback.returnWindowDays,
    highRiskAmountThreshold:
      typeof rules.highRiskAmountThreshold === "number" ? rules.highRiskAmountThreshold : fallback.highRiskAmountThreshold,
    requireHumanForRefundAfterDelivery:
      typeof rules.requireHumanForRefundAfterDelivery === "boolean"
        ? rules.requireHumanForRefundAfterDelivery
        : fallback.requireHumanForRefundAfterDelivery,
    requireHumanForDamagedGoods:
      typeof rules.requireHumanForDamagedGoods === "boolean"
        ? rules.requireHumanForDamagedGoods
        : fallback.requireHumanForDamagedGoods
  };
}
