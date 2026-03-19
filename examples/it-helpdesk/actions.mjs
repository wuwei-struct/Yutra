export const itHelpdeskActions = {
  lookup_ticket: async (ctx) => {
    const ticketId = String(ctx.context.ticket_id ?? "TCK-UNKNOWN");
    return {
      ok: true,
      output: { ticketId, found: true },
      contextPatch: {
        ticket_found: true,
        ticket_status: "triaged"
      }
    };
  },
  close_ticket: async () => {
    return {
      ok: true,
      output: { closed: true },
      contextPatch: {
        ticket_status: "closed",
        resolved_by: "it-helpdesk-bot"
      }
    };
  }
};

export const actionRegistry = itHelpdeskActions;
export default itHelpdeskActions;
