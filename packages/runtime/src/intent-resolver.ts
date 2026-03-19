import type { AgentSpec } from "@yutra/spec";
import type { IntentResolution, IntentResolver, RuntimeInput, RuntimeRunContext } from "./types";

function findIntent(spec: AgentSpec, intentName: string) {
  return spec.intents?.find((intent) => intent.name === intentName);
}

export const deterministicIntentResolver: IntentResolver = {
  name: "deterministic-rule-based",
  async resolve(input: RuntimeInput, spec: AgentSpec, ctx: RuntimeRunContext): Promise<IntentResolution> {
    void ctx;
    const intents = spec.intents ?? [];

    if (intents.length === 0) {
      return {};
    }

    if (input.intent) {
      const matched = findIntent(spec, input.intent);
      if (matched) {
        return {
          intent: matched.name,
          entryState: matched.entry_state,
          meta: { source: "input.intent" }
        };
      }
    }

    if (intents.length === 1) {
      return {
        intent: intents[0].name,
        entryState: intents[0].entry_state,
        meta: { source: "single-intent" }
      };
    }

    if (input.text) {
      const matched = intents.find((intent) => input.text?.includes(intent.name));
      if (matched) {
        return {
          intent: matched.name,
          entryState: matched.entry_state,
          meta: { source: "input.text" }
        };
      }
    }

    return {};
  }
};
