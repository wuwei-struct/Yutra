# Return Adapter Contract (v0.1)

Interface:
- `checkReturnEligibility(order, context)`
- `createReturnRequest(order, reason)`

Required output fields:
- `eligible`
- `reason_code`
- `reason`
- `request_id` (for create)
- `next_step`

Notes:
- Mock implementation: `adapters/return-adapter.mjs`
- Runtime glue: `tools/create-return-ticket.mjs` and `actions.mjs` (`check_return_eligibility`)

## Implementation Notes (P3-05)

- Real integration skeleton: `adapters/real/return-adapter.real.example.mjs`
- Eligibility and request creation remain two separate operations:
  - `checkReturnEligibility(...)`
  - `createReturnRequest(...)`
- Special conditions mapping:
  - damaged goods -> manual review/handoff path
  - expired window -> policy/inform or rejection path
