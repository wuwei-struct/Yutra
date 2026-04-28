# Escalation Adapter Contract (v0.1)

Interface:
- `createEscalationTicket(payload)`

Required output fields:
- `ticket_id`
- `queue`
- `priority`
- `handoff_status`
- `next_step`

Recommended fields:
- `reason_code`
- `summary`

Notes:
- Mock implementation: `adapters/escalation-adapter.mjs`
- Runtime glue: `tools/escalate-human.mjs`

## Implementation Notes (P3-05)

- Real integration skeleton: `adapters/real/escalation-adapter.real.example.mjs`
- Contract mapping point: `mapEscalation(...)`
- Ticket creation should always return stable queue/priority/handoff_status fields
- Recommended idempotency key for write actions: runId + orderId + reasonCode
