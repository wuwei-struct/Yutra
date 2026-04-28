# E-commerce Support Pack: Customer Demo Path (P3-04)

## 1. Scenario framing

Default customer profile:
- small-to-mid ecommerce merchants
- mixed channels (marketplace + private channels)
- auto-first support with human fallback

Current support pain points:
- repeated shipping-status inquiries
- policy inconsistency in return/refund handling
- unclear handoff triggers for high-risk requests

Why this pack focuses on shipping / return / refund / handoff:
- these are the most frequent post-sale workflows
- these are the easiest to standardize with SOP + policy
- these create clear execution evidence through trace/audit

## 2. Happy-path demo

Run these two cases:
1. shipping completed:
   - `examples/ecommerce-support/demo-inputs/shipping-normal.json`
2. return or refund completed:
   - `examples/ecommerce-support/demo-inputs/return-eligible.json`
   - `examples/ecommerce-support/demo-inputs/refund-before-shipment.json`

Expected talking points:
- deterministic state transitions
- policy-driven decisions
- structured output instead of prompt-only behavior

## 3. Exception-path demo

Run at least one handoff scenario:
- `examples/ecommerce-support/demo-inputs/refund-high-risk.json`
- or `examples/ecommerce-support/demo-inputs/shipping-exception.json`

Expected talking points:
- why auto-path is blocked
- which handoff reason is triggered
- what the human review payload contains

## 4. Evidence show

For the same run, show:
1. trace timeline (`yutra trace show`)
2. audit bundle export (`yutra trace export`)
3. policy profile difference (`policies/default.demo.json` vs `policies/prod-like.example.json`)
4. adapter replacement points (`examples/ecommerce-support/adapters/*`)

This demo path is customer-facing but local-first.
It does not claim real customer API integration in P3-04.
