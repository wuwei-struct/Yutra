import type { CompositionPrecedencePolicy, CompositionPrecedenceRule } from "./types";

export const COMPOSITION_PRECEDENCE_RULES = [
  "hard_boundary_first",
  "deny_overrides",
  "human_review_over_automation",
  "higher_risk_over_lower_risk",
  "explicit_route_over_local_default",
  "primary_owns_terminal_response",
  "namespaced_supporting_configs",
  "no_implicit_adapter_inheritance",
  "no_secret_merge",
  "fail_on_ambiguous_conflict"
] as const satisfies readonly CompositionPrecedenceRule[];

export const DEFAULT_COMPOSITION_PRECEDENCE_POLICY: CompositionPrecedencePolicy = {
  rules: [...COMPOSITION_PRECEDENCE_RULES],
  conflictMode: "fail_closed"
};

export function hasCompleteCompositionPrecedence(policy: CompositionPrecedencePolicy): boolean {
  return (
    policy.rules.length === COMPOSITION_PRECEDENCE_RULES.length &&
    COMPOSITION_PRECEDENCE_RULES.every((rule, index) => policy.rules[index] === rule)
  );
}
