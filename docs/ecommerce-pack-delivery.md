# E-commerce Support Pack Delivery Guide (P3-04)

## 1. Pack positioning

`ecommerce-support-pack` is the first delivery-oriented vertical pack under Yutra Phase 3.
It targets practical after-sales support operations, not a customer-service SaaS platform.

## 2. Default customer profile

Recommended default target:
- small-to-mid merchants,
- mixed channels (marketplace + direct channels),
- auto-first support with human fallback.

## 3. Scope freeze

In scope:
1. shipping inquiry
2. return request
3. refund request/progress
4. human handoff/escalation

Out of scope:
- pre-sale recommendation
- marketing automation
- seat management backend
- CRM/OMS/ERP full integration
- multi-tenant support platform

## 4. Delivery boundaries

### Pack built-in

- SOP state machine (`agent.yutra.yaml`)
- policy parameter templates (`policies/*.json`)
- knowledge templates (`knowledge/*.md`)
- response templates (`response-templates/*.md`)
- local adapter contracts and mock adapters (`contracts/*.md`, `adapters/*.mjs`)
- certification scenarios/outcomes (`certification/*`)

### Customer-adapted

- order / shipping / return / refund API adapters
- channel output sender
- merchant-specific policy thresholds
- merchant-specific wording, legal text, escalation routing

### Not delivered in this pack

- support console/backend
- BI dashboard
- multi-tenant architecture
- remote policy distribution center

## 5. Key business parameter layer

Current policy parameters:
- `returnWindowDays`
- `refundAutoApproveBeforeShipment`
- `delayedShipmentThresholdDays`
- `allowPartialRefund`
- `highRiskAmountThreshold`
- `requireHumanForDamagedGoods`
- `requireHumanForRefundAfterDelivery`

These parameters are expected to be adjusted per merchant without changing runtime core.

## 6. Acceptance checklist (delivery DoD)

1. Shipping/return/refund/handoff core scenarios run successfully.
2. At least one shipping exception and one refund high-risk case produce handoff.
3. Policy profile switch changes at least one outcome deterministically.
4. Trace export and audit bundle export are available.
5. Delivery docs (`README/DELIVERY/CONFIG/SOP/INTEGRATION`) are aligned with policy and scenarios.

## 7. Certification linkage

- Scenario definitions: `examples/ecommerce-support/certification/scenarios.json`
- Expected outcomes: `examples/ecommerce-support/certification/expected-outcomes.json`
- Global certification gate: `pnpm certify`

## 8. Commercial implementation assets (P3-04)

- `docs/ecommerce-demo-path.md`
- `docs/ecommerce-demo-script.md`
- `docs/ecommerce-scope-checklist.md`
- `docs/ecommerce-pricing-scope.md`
- `docs/ecommerce-delivery-plan-template.md`
- `docs/ecommerce-delivery-risks.md`
- `docs/ecommerce-deliverables.md`
- `docs/ecommerce-proposal-outline.md`

## 9. Customer integration execution assets (P3-05)

- `examples/ecommerce-support/.env.example`
- `examples/ecommerce-support/integrations/generic-shop-profile/profile.json`
- `examples/ecommerce-support/integrations/generic-shop-profile/adapter-map.json`
- `docs/ecommerce-uat-plan.md`
- `docs/ecommerce-joint-debug-checklist.md`
- `docs/ecommerce-rollout-checklist.md`
