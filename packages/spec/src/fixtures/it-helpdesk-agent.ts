import type { AgentSpec } from "../types/spec";

export const itHelpdeskAgentFixture: AgentSpec = {
  agent: "it-helpdesk-agent",
  version: "0.1.0",
  intents: [
    {
      name: "resolve_ticket",
      description: "Resolve IT helpdesk ticket",
      entry_state: "triage"
    }
  ],
  context: {
    fields: {
      ticket_id: {
        type: "string",
        required: true,
        description: "Ticket identifier"
      },
      priority: {
        type: "string",
        default: "normal"
      }
    }
  },
  initial_state: "triage",
  actions: [
    {
      name: "lookup_ticket",
      side_effect: "read"
    },
    {
      name: "close_ticket",
      side_effect: "write"
    }
  ],
  guards: [
    {
      name: "can_close",
      expression: "context.priority !== 'critical'"
    }
  ],
  states: {
    triage: {
      description: "Triage incoming issue",
      actions: ["lookup_ticket"],
      transitions: [
        {
          to: "resolved",
          guard: "can_close",
          when: "ticket_has_solution"
        }
      ],
      on_enter: ["log_triage_start"]
    },
    resolved: {
      actions: ["close_ticket"],
      final: true,
      on_exit: ["log_resolution"]
    }
  }
};
