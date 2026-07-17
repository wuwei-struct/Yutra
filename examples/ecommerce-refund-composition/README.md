# Ecommerce Refund Composition Preview

This public demo plan keeps `request-resolution` as the Primary Product Archetype and uses `approval-decision` as an independently namespaced supporting authorization flow. `policy-guard`, `adapter-connector`, and `human-handoff` remain scoped Cross-cutting Overlays.

Compile the namespaced preview Bundle:

```bash
pnpm exec yutra composition compile examples/ecommerce-refund-composition/plan.json --out .tmp/ecommerce-refund --dry-run
```

```bash
pnpm exec yutra composition compile examples/ecommerce-refund-composition/plan.json --out .tmp/ecommerce-refund --force
```

The output is not a runnable composed Agent and contains no top-level Orchestrator DSL. It does not deep-merge Pack Configs or connect Runtime. The example contains no real order, payment, refund, adapter, endpoint, amount rule, credential, or customer data.
