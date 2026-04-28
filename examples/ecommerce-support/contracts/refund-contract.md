# Refund Adapter Contract (v0.1)

Interface:
- `checkRefundEligibility(order, context)`
- `createRefundRequest(order, amount?, reason)`

Required output fields:
- `eligible`
- `reason_code`
- `reason`
- `refund_request_id` (for create)
- `refund_status`
- `next_step`

Notes:
- Mock implementation: `adapters/refund-adapter.mjs`
- Runtime glue: `tools/create-refund-ticket.mjs` and `actions.mjs` (`check_refund_eligibility`)

## Implementation Notes (P3-05)

- Real integration skeleton: `adapters/real/refund-adapter.real.example.mjs`
- Contract mapping point: `mapRefundDecision(...)`
- Eligibility and request creation remain separated:
  - `checkRefundEligibility(...)`
  - `createRefundRequest(...)`
- Typical mapping strategy:
  - before shipment -> auto approval (policy-controlled)
  - after delivery -> policy-controlled manual review
  - high amount/high risk -> handoff/escalation
