# E-commerce UAT Plan (P3-05)

## UAT goal

Validate ecommerce-support pack in customer-integration mode with deterministic outcomes and auditable evidence.

## Scope under UAT

- shipping path
- return path
- refund path
- handoff/escalation path

## Acceptance matrix

1. Shipping path
- input: shipping normal / delayed / exception cases
- expected: completed or handoff by policy
- evidence: trace + status + handoff reason (if any)

2. Return path
- input: eligible / expired / damaged cases
- expected: completed or handoff
- evidence: return eligibility decision and next_step mapping

3. Refund path
- input: before shipment / after delivery / high risk
- expected: completed or handoff
- evidence: refund decision + reason_code + status

4. Handoff path
- input: missing info / policy-required scenarios
- expected: handoff with structured reason
- evidence: handoff payload + escalation output

## Roles

- Delivery lead: owns final acceptance summary
- Integration engineer: owns adapter mapping verification
- Customer API owner: owns upstream data correctness
- Customer business owner: owns policy/template sign-off

## Required outputs

- UAT run log (case -> expected -> actual)
- trace file references
- audit bundle references
- open issue list (if any)

## Exit criteria

- all critical cases meet expected status
- no blocker in adapter contract mapping
- handoff path is usable as fallback
- audit bundle is exportable for reviewed runs
