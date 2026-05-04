# E-commerce Support Pack

## Pack positioning

This pack targets small-to-mid ecommerce merchants using auto-first support with human fallback.
It is a customer-integration-ready scenario pack, not a customer-service SaaS platform.

## Scope freeze

In scope:
1. shipping inquiry
2. return request
3. refund request/progress
4. human handoff/escalation

Out of scope:
- pre-sale recommendation and marketing automation
- seat-management backend
- full OMS/ERP/CRM integration
- multitenant support platform

## Adapter-first integration layer (P3-05)

Facade entrypoints (mode-aware):
- `adapters/order-adapter.mjs`
- `adapters/shipping-adapter.mjs`
- `adapters/return-adapter.mjs`
- `adapters/refund-adapter.mjs`
- `adapters/escalation-adapter.mjs`
- `adapters/channel-response-adapter.mjs`

Concrete implementations:
- `adapters/mock/*.mjs`
- `adapters/real/*.real.example.mjs`

Mode resolver:
- `adapters/mode.mjs`

Contracts:
- `contracts/order-contract.md`
- `contracts/shipping-contract.md`
- `contracts/return-contract.md`
- `contracts/refund-contract.md`
- `contracts/escalation-contract.md`
- `contracts/channel-contract.md`

Tools remain runtime glue only:
- `tools/*.mjs`

## Skill-based variant (P4-05)

Skill-based agent entrypoint:
- `agent.skill.yutra.yaml`

Skill pack directory:
- `skills/query-order`
- `skills/query-shipping`
- `skills/create-return-request`
- `skills/create-refund-request`
- `skills/create-support-ticket`

## Integration profile sample

- `integrations/generic-shop-profile/profile.json`
- `integrations/generic-shop-profile/adapter-map.json`
- `integrations/generic-shop-profile/policy.override.json`

## Policy parameters

- `returnWindowDays`
- `refundAutoApproveBeforeShipment`
- `delayedShipmentThresholdDays`
- `allowPartialRefund`
- `highRiskAmountThreshold`
- `requireHumanForDamagedGoods`
- `requireHumanForRefundAfterDelivery`

## Run commands

```bash
pnpm yutra validate examples/ecommerce-support/agent.yutra.yaml
pnpm yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json
pnpm yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/refund-case.json
pnpm yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/handoff-case.json

pnpm yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills
pnpm yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/refund-high-risk.json --skills-dir examples/ecommerce-support/skills
```

Mock/real switch examples:

```bash
# default mock
$env:YUTRA_ECOM_ADAPTER_MODE='mock'; pnpm yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json

# real skeleton dry-run
$env:YUTRA_ECOM_ADAPTER_MODE='real'; $env:YUTRA_ECOM_ADAPTER_DRY_RUN='true'; pnpm yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json
```

## Delivery and integration docs

- `DELIVERY.md`
- `CONFIG.md`
- `SOP.md`
- `INTEGRATION.md`
- `certification/scenarios.json`
- `certification/expected-outcomes.json`
- `docs/ecommerce-skill-pack.md`
- `docs/skill-based-runtime.md`
- `docs/skill-based-demo-path.md`
- `docs/skill-certification-summary.md`
- `docs/release-notes-skill-based-runtime.md`

Skill commands:

```bash
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra skill validate examples/ecommerce-support/skills/query-shipping
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
```

Boundary note:
- Skill is behind Action execution contract, not a peer object of Agent/State.
- No marketplace / remote registry / install workflow in this pack.

Commercial delivery assets:
- `docs/ecommerce-demo-path.md`
- `docs/ecommerce-demo-script.md`
- `docs/ecommerce-scope-checklist.md`
- `docs/ecommerce-pricing-scope.md`
- `docs/ecommerce-delivery-plan-template.md`
- `docs/ecommerce-delivery-risks.md`
- `docs/ecommerce-deliverables.md`
- `docs/ecommerce-proposal-outline.md`
- `docs/ecommerce-client-onboarding-checklist.md`
- `docs/ecommerce-uat-plan.md`
- `docs/ecommerce-joint-debug-checklist.md`
- `docs/ecommerce-rollout-checklist.md`

## Response templates
- `response-templates/shipping.md`
- `response-templates/return.md`
- `response-templates/refund.md`
- `response-templates/handoff.md`
