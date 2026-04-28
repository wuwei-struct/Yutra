# DELIVERY - E-commerce Support Pack (P3-05)

## Delivery prerequisites

- Runtime/CLI stack is available locally.
- Customer confirms policy baseline and handoff owner.
- Customer can provide required adapter interfaces.
- Auth owner and secret management process are assigned.

## Built-in vs customer-adapted

Built-in:
- SOP DSL and action glue
- adapter contracts + mock adapters + real adapter skeletons
- response templates
- policy sample files
- certification scenarios
- integration profile sample

Customer-adapted:
- real order/shipping/return/refund APIs
- real ticket/escalation system
- real channel output sender
- merchant wording and policy thresholds

## Replacement points for customer integration

- `adapters/real/order-adapter.real.example.mjs`
- `adapters/real/shipping-adapter.real.example.mjs`
- `adapters/real/return-adapter.real.example.mjs`
- `adapters/real/refund-adapter.real.example.mjs`
- `adapters/real/escalation-adapter.real.example.mjs`
- `adapters/real/channel-response-adapter.real.example.mjs`

## Delivery acceptance definition (DoD)

1. shipping / return / refund / handoff cases run with expected status in mock mode.
2. adapter contract shape tests pass.
3. real adapter skeleton files exist and dry-run mapping works.
4. trace and audit export remain available.
5. integration docs are complete and path-valid.

## Customer-facing demo and proposal assets

- `docs/ecommerce-demo-path.md`
- `docs/ecommerce-demo-script.md`
- `docs/ecommerce-scope-checklist.md`
- `docs/ecommerce-pricing-scope.md`
- `docs/ecommerce-delivery-plan-template.md`
- `docs/ecommerce-delivery-risks.md`
- `docs/ecommerce-deliverables.md`
- `docs/ecommerce-proposal-outline.md`

## Integration execution assets (P3-05)

- `.env.example`
- `integrations/generic-shop-profile/profile.json`
- `integrations/generic-shop-profile/adapter-map.json`
- `docs/ecommerce-uat-plan.md`
- `docs/ecommerce-joint-debug-checklist.md`
- `docs/ecommerce-rollout-checklist.md`

These assets are for delivery implementation readiness and scope alignment.
They do not claim real production integration completion.
