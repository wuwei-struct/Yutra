import type { ArchetypeId } from "./ids";
import type { SideEffectLevel } from "./side-effect";

export type CompositionMode = "sequence" | "nested" | "routing" | "supervision" | "event_triggered";

export type ContextPolicy = {
  namespace: boolean;
  read?: string[];
  write?: string[];
  sharedFields?: string[];
  writeConflicts: "deny" | "most_restrictive_wins" | "last_write_wins";
};

export type GuardPolicy = {
  priority: string[];
  conflictResolution: "most_restrictive_wins" | "first_match" | "deny_on_conflict";
};

export type FailurePolicy = "fail_closed_to_handoff" | "fail_closed_error" | "fallback_state" | "stop_run";

export type TracePolicy = "unified_timeline" | "unified_timeline_with_child_runs";

export type SideEffectPolicy = {
  maxAutoSideEffect: SideEffectLevel;
  requiresPolicyGuardFrom: SideEffectLevel;
};

export type ArchetypeCompositionContract = {
  mode: CompositionMode;
  children?: ArchetypeId[];
  contextPolicy: ContextPolicy;
  guardPolicy: GuardPolicy;
  failurePolicy: FailurePolicy;
  tracePolicy: TracePolicy;
  sideEffectPolicy: SideEffectPolicy;
};

export const DEFAULT_CONTEXT_POLICY: ContextPolicy = {
  namespace: true,
  writeConflicts: "deny"
};

export const DEFAULT_GUARD_POLICY: GuardPolicy = {
  priority: ["policy-guard", "human-handoff", "archetype-local"],
  conflictResolution: "most_restrictive_wins"
};

export const DEFAULT_FAILURE_POLICY: FailurePolicy = "fail_closed_to_handoff";

export const DEFAULT_TRACE_POLICY: TracePolicy = "unified_timeline";

export const DEFAULT_SIDE_EFFECT_POLICY: SideEffectPolicy = {
  maxAutoSideEffect: "read",
  requiresPolicyGuardFrom: "write"
};

export function createDefaultCompositionContract(
  mode: CompositionMode = "sequence",
  children: ArchetypeId[] = []
): ArchetypeCompositionContract {
  return {
    mode,
    children,
    contextPolicy: { ...DEFAULT_CONTEXT_POLICY },
    guardPolicy: { ...DEFAULT_GUARD_POLICY, priority: [...DEFAULT_GUARD_POLICY.priority] },
    failurePolicy: DEFAULT_FAILURE_POLICY,
    tracePolicy: DEFAULT_TRACE_POLICY,
    sideEffectPolicy: { ...DEFAULT_SIDE_EFFECT_POLICY }
  };
}
