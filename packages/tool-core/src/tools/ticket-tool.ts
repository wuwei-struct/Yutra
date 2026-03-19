import type { Tool, ToolResult } from "../types";

export interface TicketToolInput {
  ticketId: string;
  action?: "get" | "update";
  patch?: Record<string, unknown>;
}

export interface TicketToolOutput {
  ticketId: string;
  status: "open" | "updated";
  payload?: Record<string, unknown>;
  stub: true;
}

export const ticketTool: Tool<TicketToolInput, TicketToolOutput> = {
  name: "ticket_tool",
  description: "Stub ticket integration tool.",
  sideEffect: "write",
  async run(input): Promise<ToolResult<TicketToolOutput>> {
    if (input.action === "update") {
      return {
        ok: true,
        data: {
          ticketId: input.ticketId,
          status: "updated",
          payload: input.patch,
          stub: true
        }
      };
    }

    return {
      ok: true,
      data: {
        ticketId: input.ticketId,
        status: "open",
        stub: true
      }
    };
  }
};
