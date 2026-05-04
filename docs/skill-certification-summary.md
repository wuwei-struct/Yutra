# Skill Certification Summary

## Certified Skills

- `query_order`
- `query_shipping_status`
- `create_return_request`
- `create_refund_request`
- `create_support_ticket`

## Certified Skill Paths

- Shipping skill path
- Return skill path
- Refund skill path
- Handoff skill path

## Trace Certification Checkpoints

- `implementationType = skill`
- `skillName`
- `inputValidated`
- `outputValidated`
- `riskLevel`
- `requiresApproval`

## Parallel Baseline Guarantee

Still passing in parallel:
- Original adapter/tool baseline path.
- Skill-based variant path.
- `pnpm certify` conformance suite.

## Reference Locations

- Ecommerce certification scenarios:
  - `examples/ecommerce-support/certification/scenarios.json`
- Ecommerce expected outcomes:
  - `examples/ecommerce-support/certification/expected-outcomes.json`
- Conformance tests:
  - `tests/conformance/ecommerce-delivery.test.ts`
