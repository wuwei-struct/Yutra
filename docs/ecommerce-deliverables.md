# E-commerce Support Pack Public Demo Assets

This public document lists mock/demo assets only. It is not a customer deliverables checklist.

## Public demo assets

1. Pack source assets
- `examples/ecommerce-support/agent.yutra.yaml`
- `examples/ecommerce-support/actions.mjs`
- `examples/ecommerce-support/pack.manifest.json`

2. Policy files
- `examples/ecommerce-support/policies/default.demo.json`
- `examples/ecommerce-support/policies/prod-like.example.json`

3. Response templates
- `examples/ecommerce-support/response-templates/*.md`

4. Adapter contracts and mock adapters
- `examples/ecommerce-support/contracts/*.md`
- `examples/ecommerce-support/adapters/*.mjs`
- `examples/ecommerce-support/adapters/mock/*.mjs`
- `examples/ecommerce-support/adapters/real/*.real.example.mjs`

5. Public demo docs
- `examples/ecommerce-support/DELIVERY.md`
- `examples/ecommerce-support/CONFIG.md`
- `examples/ecommerce-support/INTEGRATION.md`
- `examples/ecommerce-support/SOP.md`
- `docs/public-demo-boundary.md`

6. Certification references
- `examples/ecommerce-support/certification/scenarios.json`
- `examples/ecommerce-support/certification/expected-outcomes.json`
- `.yutra/certification/summary.json` (generated)

7. Demo inputs
- `examples/ecommerce-support/demo-inputs/*.json`

8. Integration profile sample
- `examples/ecommerce-support/.env.example`
- `examples/ecommerce-support/integrations/generic-shop-profile/profile.json`
- `examples/ecommerce-support/integrations/generic-shop-profile/adapter-map.json`
- `examples/ecommerce-support/integrations/generic-shop-profile/policy.override.json`

## Generated outputs after running demo/certification

- trace JSONL files under `.yutra/traces/`
- audit bundle JSON files under `.yutra/audit/`

These are generated artifacts, not static hand-authored deliverables.

## Not public deliverables

The public repository does not include pricing, proposal, UAT, rollout, customer-specific SOP, production adapter mapping, or private operational procedures.
