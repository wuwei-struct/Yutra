import type { ActionSideEffect } from "@yutra/spec";
import { RUNTIME_ERROR_CODES } from "./error-codes";
import { buildHandoffPayload, type HumanReviewRequest } from "./handoff-contract";
import type { EnvironmentProfile, HandoffPolicyRule, PolicyPack } from "./types";

interface EvaluatePolicyForActionInput {
  policyPack?: PolicyPack;
  environment: EnvironmentProfile;
  actionName: string;
  stateName: string;
  sideEffect: ActionSideEffect;
  externalCallsUsed: number;
}

export interface PolicyDecision {
  effect: "allow" | "deny" | "handoff";
  errorCode?: string;
  reasonCode?: string;
  reason?: string;
  policyName?: string;
  policyVersion?: string;
  environment: EnvironmentProfile;
  sideEffect: ActionSideEffect;
  handoffPayload?: HumanReviewRequest;
}

function matchesEnvironment(ruleEnvironments: string[] | undefined, environment: EnvironmentProfile): boolean {
  if (!ruleEnvironments || ruleEnvironments.length === 0) {
    return true;
  }
  return ruleEnvironments.includes(environment);
}

function resolveHandoffRule(
  policyPack: PolicyPack,
  environment: EnvironmentProfile,
  actionName: string,
  stateName: string
): HandoffPolicyRule | undefined {
  const candidates = policyPack.handoffRules ?? [];
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const rule = candidates[index] as HandoffPolicyRule & { environments?: string[] };
    if (!matchesEnvironment(rule.environments, environment)) {
      continue;
    }
    const actionMatched = !rule.action || rule.action === actionName;
    const stateMatched = !rule.state || rule.state === stateName;
    if (actionMatched && stateMatched) {
      return rule;
    }
  }
  return undefined;
}

export function evaluatePolicyForAction(input: EvaluatePolicyForActionInput): PolicyDecision {
  const { policyPack, environment, actionName, stateName, sideEffect, externalCallsUsed } = input;

  if (!policyPack) {
    return {
      effect: "allow",
      environment,
      sideEffect
    };
  }

  const actionRule = [...(policyPack.actionRules ?? [])]
    .reverse()
    .find((rule) => rule.action === actionName && matchesEnvironment(rule.environments, environment));

  if (actionRule?.allow === false) {
    return {
      effect: "deny",
      errorCode: RUNTIME_ERROR_CODES.POLICY_ACTION_DENIED,
      reasonCode: actionRule.reasonCode ?? "action_denied",
      reason: actionRule.reason ?? `Action '${actionName}' is denied by policy.`,
      policyName: policyPack.name,
      policyVersion: policyPack.version,
      environment,
      sideEffect
    };
  }

  if (actionRule?.requireHandoff === true) {
    const handoffRule = resolveHandoffRule(policyPack, environment, actionName, stateName);
    const reasonCode = actionRule.reasonCode ?? handoffRule?.reasonCode ?? "policy_handoff_required";
    const reason = actionRule.reason ?? `Action '${actionName}' requires handoff under policy.`;
    return {
      effect: "handoff",
      errorCode: RUNTIME_ERROR_CODES.POLICY_HANDOFF_REQUIRED,
      reasonCode,
      reason,
      policyName: policyPack.name,
      policyVersion: policyPack.version,
      environment,
      sideEffect,
      handoffPayload: buildHandoffPayload({
        reasonCode,
        reason,
        source: "policy",
        action: actionName,
        state: stateName,
        policyPack,
        summaryTemplate: handoffRule?.summaryTemplate
      })
    };
  }

  const sideEffectRule = [...(policyPack.sideEffectRules ?? [])]
    .reverse()
    .find((rule) => rule.sideEffect === sideEffect && matchesEnvironment(rule.environments, environment));

  if (sideEffectRule?.allow === false) {
    return {
      effect: "deny",
      errorCode: RUNTIME_ERROR_CODES.POLICY_SIDEEFFECT_DENIED,
      reasonCode: sideEffectRule.reasonCode ?? "sideeffect_denied",
      reason: sideEffectRule.reason ?? `Side effect '${sideEffect}' is denied by policy.`,
      policyName: policyPack.name,
      policyVersion: policyPack.version,
      environment,
      sideEffect
    };
  }

  if (typeof sideEffectRule?.maxCalls === "number" && externalCallsUsed >= sideEffectRule.maxCalls) {
    return {
      effect: "deny",
      errorCode: RUNTIME_ERROR_CODES.POLICY_SIDEEFFECT_DENIED,
      reasonCode: sideEffectRule.reasonCode ?? "sideeffect_max_calls_exceeded",
      reason:
        sideEffectRule.reason ??
        `Side effect '${sideEffect}' reached max calls ${sideEffectRule.maxCalls} under policy.`,
      policyName: policyPack.name,
      policyVersion: policyPack.version,
      environment,
      sideEffect
    };
  }

  if (sideEffectRule?.requireHandoff === true) {
    const handoffRule = resolveHandoffRule(policyPack, environment, actionName, stateName);
    const reasonCode = sideEffectRule.reasonCode ?? handoffRule?.reasonCode ?? "policy_handoff_required";
    const reason = sideEffectRule.reason ?? `Side effect '${sideEffect}' requires handoff under policy.`;
    return {
      effect: "handoff",
      errorCode: RUNTIME_ERROR_CODES.POLICY_HANDOFF_REQUIRED,
      reasonCode,
      reason,
      policyName: policyPack.name,
      policyVersion: policyPack.version,
      environment,
      sideEffect,
      handoffPayload: buildHandoffPayload({
        reasonCode,
        reason,
        source: "policy",
        action: actionName,
        state: stateName,
        policyPack,
        summaryTemplate: handoffRule?.summaryTemplate
      })
    };
  }

  return {
    effect: "allow",
    policyName: policyPack.name,
    policyVersion: policyPack.version,
    environment,
    sideEffect
  };
}
