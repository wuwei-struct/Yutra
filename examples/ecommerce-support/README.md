# E-commerce Support Example

## What this example proves

Execution-first customer support SOP: issue triage, order lookup, policy lookup, and ticket actions.

## State machine overview

- `triage` -> classify shipping/return/refund.
- `fetch_order` -> load order facts.
- `answer_shipping` -> shipping response.
- `check_return_eligibility` -> `create_return_request`.
- `check_refund_eligibility` -> `create_refund_request`.
- `inform_policy` -> policy-only response.
- `resolved` (final) / `handoff_human` (handoff).

## Roles of tools / knowledge / guard / handoff

- tools: order lookup, shipping check, return/refund ticket creation.
- knowledge: local file KB for return window, refund timeline, manual-review rules.
- guard: not central in this example; branching is primarily `when` + context.
- handoff: unknown/conflicting order context can route to `handoff_human`.

## Run commands

```bash
pnpm yutra validate examples/ecommerce-support/agent.yutra.yaml
pnpm yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/case1.json
pnpm yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/case2.json
```

## What to observe in trace

- SOP progression across multiple states (not one-shot prompt).
- `action.succeeded` payloads with context delta.
- `transition.resolved` showing path selection.
