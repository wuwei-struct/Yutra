import type { PolicyPack, RuntimeRunContext } from "./types";

export type HumanReviewSource = "policy" | "runtime" | "guard" | "tool" | "manual";

export interface HumanReviewRequest {
  reviewId: string;
  reasonCode: string;
  reason: string;
  source: HumanReviewSource;
  action?: string;
  state?: string;
  severity?: "low" | "medium" | "high";
  policyName?: string;
  policyVersion?: string;
  summary: string;
  requiredFields?: string[];
  recommendedActions?: string[];
  requestedAt: string;
  metadata?: Record<string, unknown>;
}

interface BuildHandoffPayloadInput {
  reviewId?: string;
  reasonCode: string;
  reason: string;
  source: HumanReviewSource;
  action?: string;
  state?: string;
  severity?: "low" | "medium" | "high";
  policyPack?: Pick<PolicyPack, "name" | "version">;
  summaryTemplate?: string;
  requiredFields?: string[];
  recommendedActions?: string[];
  requestedAt?: string;
  metadata?: Record<string, unknown>;
}

function renderSummary(template: string, data: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => data[key] ?? "");
}

export function buildHandoffPayload(input: BuildHandoffPayloadInput): HumanReviewRequest {
  const summaryTemplate =
    input.summaryTemplate ??
    "Handoff requested by {source}: {reason} (reasonCode={reasonCode}, action={action}, state={state}).";
  const summary = renderSummary(summaryTemplate, {
    source: input.source,
    reason: input.reason,
    reasonCode: input.reasonCode,
    action: input.action ?? "-",
    state: input.state ?? "-"
  });

  return {
    reviewId: input.reviewId ?? `review-${Date.now()}`,
    reasonCode: input.reasonCode,
    reason: input.reason,
    source: input.source,
    action: input.action,
    state: input.state,
    severity: input.severity ?? "medium",
    policyName: input.policyPack?.name,
    policyVersion: input.policyPack?.version,
    summary,
    requiredFields: input.requiredFields,
    recommendedActions: input.recommendedActions,
    requestedAt: input.requestedAt ?? new Date().toISOString(),
    metadata: input.metadata
  };
}

export function buildRuntimeHandoffPayload(
  ctx: RuntimeRunContext,
  reasonCode: string,
  reason: string,
  source: "runtime" | "guard" | "tool" | "manual",
  extra?: {
    action?: string;
    summaryTemplate?: string;
    requiredFields?: string[];
    reviewId?: string;
    severity?: "low" | "medium" | "high";
    recommendedActions?: string[];
    metadata?: Record<string, unknown>;
  }
): HumanReviewRequest {
  return buildHandoffPayload({
    reviewId: extra?.reviewId,
    reasonCode,
    reason,
    source,
    action: extra?.action,
    state: ctx.currentState,
    summaryTemplate: extra?.summaryTemplate,
    requiredFields: extra?.requiredFields,
    severity: extra?.severity,
    recommendedActions: extra?.recommendedActions,
    metadata: extra?.metadata,
    policyPack: ctx.appliedPolicyPack
  });
}
