# Ecommerce Refund Orchestrator Preview

This demo uses:

- Composition Plan: `examples/ecommerce-refund-composition/plan.json`
- Compile Profile: `ecommerce-refund-orchestrator-profile`

Dry-run or explicitly export the complete Preview Bundle:

```bash
pnpm exec yutra orchestrator compile examples/ecommerce-refund-composition/plan.json --out .tmp/ecommerce-refund-orchestrator --dry-run
pnpm exec yutra orchestrator compile examples/ecommerce-refund-composition/plan.json --out .tmp/ecommerce-refund-orchestrator --force
```

The Bundle preserves the Primary `refund_resolution` and Supporting
`refund_authorization` Slot artifacts without deep merge. The
`scenario.orchestrator.yaml` file is not Agent DSL and cannot be executed by
the current Yutra Runtime. The demo contains no real order, payment, refund,
adapter, endpoint, credential, or customer rule.
