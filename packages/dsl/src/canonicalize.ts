import type {
  ActionSpec,
  AgentSpec,
  ContextFieldSpec,
  GuardSpec,
  IntentSpec,
  StateSpec,
  TransitionSpec
} from "@yutra/spec";
import { NameNormalizer, type NameCanonicalizationRecord } from "./name-normalizer";
import type { DslValidationIssue } from "./errors";

export interface CanonicalizationResult {
  spec: AgentSpec;
  mappings: NameCanonicalizationRecord[];
  issues: DslValidationIssue[];
}

function rewriteContextRefs(expression: string, contextFieldMap: Map<string, string>): string {
  return expression.replace(/ctx\.([A-Za-z0-9_\u4e00-\u9fff]+)/g, (fullMatch, fieldName: string) => {
    const mapped = contextFieldMap.get(fieldName);
    if (!mapped) {
      return fullMatch;
    }
    return `ctx.${mapped}`;
  });
}

export function canonicalizeDslNames(spec: AgentSpec): CanonicalizationResult {
  const normalizer = new NameNormalizer();
  const contextFieldMap = new Map<string, string>();
  const stateNameMap = new Map<string, string>();

  const canonicalAgent = normalizer.canonicalize({
    kind: "agent",
    value: spec.agent,
    path: ["agent"]
  });

  const canonicalContextFields: Record<string, ContextFieldSpec> = {};
  for (const [fieldName, fieldSpec] of Object.entries(spec.context?.fields ?? {})) {
    const canonicalFieldName = normalizer.canonicalize({
      kind: "context_field",
      value: fieldName,
      path: ["context", "fields", fieldName]
    });
    contextFieldMap.set(fieldName, canonicalFieldName);
    canonicalContextFields[canonicalFieldName] = fieldSpec;
  }

  const canonicalActions: ActionSpec[] | undefined = spec.actions?.map((action, index) => ({
    ...action,
    name: normalizer.canonicalize({
      kind: "action",
      value: action.name,
      path: ["actions", String(index), "name"]
    })
  }));

  const canonicalGuards: GuardSpec[] | undefined = spec.guards?.map((guard, index) => ({
    ...guard,
    name: normalizer.canonicalize({
      kind: "guard",
      value: guard.name,
      path: ["guards", String(index), "name"]
    }),
    expression: guard.expression ? rewriteContextRefs(guard.expression, contextFieldMap) : guard.expression
  }));

  for (const stateName of Object.keys(spec.states)) {
    stateNameMap.set(
      stateName,
      normalizer.canonicalize({
        kind: "state",
        value: stateName,
        path: ["states", stateName]
      })
    );
  }

  const canonicalInitialState = normalizer.canonicalize({
    kind: "state",
    value: spec.initial_state,
    path: ["initial_state"]
  });

  const canonicalIntents: IntentSpec[] | undefined = spec.intents?.map((intent, index) => ({
    ...intent,
    name: normalizer.canonicalize({
      kind: "intent",
      value: intent.name,
      path: ["intents", String(index), "name"]
    }),
    entry_state: intent.entry_state
      ? normalizer.canonicalize({
          kind: "state",
          value: intent.entry_state,
          path: ["intents", String(index), "entry_state"]
        })
      : undefined
  }));

  const canonicalStates: Record<string, StateSpec> = {};
  for (const [stateName, stateSpec] of Object.entries(spec.states)) {
    const canonicalStateName =
      stateNameMap.get(stateName) ??
      normalizer.canonicalize({
        kind: "state",
        value: stateName,
        path: ["states", stateName]
      });

    const canonicalTransitions: TransitionSpec[] | undefined = stateSpec.transitions?.map((transition, index) => ({
      ...transition,
      to: normalizer.canonicalize({
        kind: "state",
        value: transition.to,
        path: ["states", stateName, "transitions", String(index), "to"]
      }),
      guard: transition.guard
        ? normalizer.canonicalize({
            kind: "guard",
            value: transition.guard,
            path: ["states", stateName, "transitions", String(index), "guard"]
          })
        : undefined,
      when: transition.when ? rewriteContextRefs(transition.when, contextFieldMap) : transition.when
    }));

    canonicalStates[canonicalStateName] = {
      ...stateSpec,
      actions: stateSpec.actions?.map((actionName, index) =>
        normalizer.canonicalize({
          kind: "action",
          value: actionName,
          path: ["states", stateName, "actions", String(index)]
        })
      ),
      guards: stateSpec.guards?.map((guardName, index) =>
        normalizer.canonicalize({
          kind: "guard",
          value: guardName,
          path: ["states", stateName, "guards", String(index)]
        })
      ),
      on_enter: stateSpec.on_enter?.map((actionName, index) =>
        normalizer.canonicalize({
          kind: "action",
          value: actionName,
          path: ["states", stateName, "on_enter", String(index)]
        })
      ),
      on_exit: stateSpec.on_exit?.map((actionName, index) =>
        normalizer.canonicalize({
          kind: "action",
          value: actionName,
          path: ["states", stateName, "on_exit", String(index)]
        })
      ),
      transitions: canonicalTransitions
    };
  }

  return {
    spec: {
      ...spec,
      agent: canonicalAgent,
      intents: canonicalIntents,
      context: spec.context ? { fields: canonicalContextFields } : undefined,
      initial_state: canonicalInitialState,
      states: canonicalStates,
      actions: canonicalActions,
      guards: canonicalGuards
    },
    mappings: normalizer.mappings,
    issues: normalizer.issues
  };
}

