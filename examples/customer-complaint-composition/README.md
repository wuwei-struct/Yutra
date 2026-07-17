# Customer Complaint Composition Preview

This public demo plan composes three independently validated Product Archetype Pack Configs:

- Primary: `request-resolution`
- Supporting: `knowledge-answering`
- Supporting: `approval-decision`
- Cross-cutting: `human-handoff`, `policy-guard`

Compile the namespaced preview Bundle without writing files:

```bash
pnpm exec yutra composition compile examples/customer-complaint-composition/plan.json --out .tmp/customer-complaint --dry-run
```

Write the preview Bundle explicitly:

```bash
pnpm exec yutra composition compile examples/customer-complaint-composition/plan.json --out .tmp/customer-complaint --force
```

The result is preview-only and cannot run a composed Agent. It does not generate a top-level Orchestrator DSL, deep-merge Pack Configs, connect Runtime, or access a real complaint system. All adapters and business values are generic demo/mock data; no customer SOP, real endpoint, secret, or commercial delivery asset is included.
