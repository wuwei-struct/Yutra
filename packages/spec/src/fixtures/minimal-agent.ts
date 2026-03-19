import type { AgentSpec } from "../types/spec";

export const minimalAgentFixture: AgentSpec = {
  agent: "minimal-agent",
  version: "0.1.0",
  initial_state: "idle",
  states: {
    idle: {
      description: "Start state",
      transitions: [{ to: "done" }]
    },
    done: {
      final: true
    }
  }
};
