# Ecommerce Skill Pack

## What Changed in P4-05

`examples/ecommerce-support` now has two parallel paths:

- baseline: `agent.yutra.yaml` (adapter/tool-based)
- skill variant: `agent.skill.yutra.yaml` (skill-based actions)

Skill directory:

- `examples/ecommerce-support/skills/query-order`
- `examples/ecommerce-support/skills/query-shipping`
- `examples/ecommerce-support/skills/create-return-request`
- `examples/ecommerce-support/skills/create-refund-request`
- `examples/ecommerce-support/skills/create-support-ticket`

## Skill Responsibilities

- `query_order`: read order base information.
- `query_shipping_status`: read shipping progress and exception.
- `create_return_request`: create return workflow request.
- `create_refund_request`: create refund workflow request (high risk metadata).
- `create_support_ticket`: create handoff/escalation ticket.

All skills reuse existing adapter contracts and mock/real switching.

## Run and Inspect

```bash
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra skill validate examples/ecommerce-support/skills/query-shipping
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills
```

## Business Value

- Capability modularization by domain intent.
- Faster replacement of backend integration units.
- Better governance visibility from skill risk metadata.
- Reusable delivery assets across customer projects.

## Runtime Positioning

- Skill is capability metadata + entry implementation.
- Action is the runtime invocation contract.
- Skill is not a peer object of Agent/State.

## P4-06 Release Readiness Links

- `docs/skill-based-runtime.md`
- `docs/skill-based-demo-path.md`
- `docs/skill-certification-summary.md`
- `docs/release-notes-skill-based-runtime.md`

## Boundary

- No marketplace/remote registry/install workflow.
- No runtime/trace core rewrite.
- No real customer API integration in this pack stage.
