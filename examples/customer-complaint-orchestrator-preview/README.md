# Customer Complaint Orchestrator Preview

This demo uses:

- Composition Plan: `examples/customer-complaint-composition/plan.json`
- Compile Profile: `customer-complaint-orchestrator-profile`

Dry-run the complete Composition and Orchestrator Preview Bundle:

```bash
pnpm exec yutra orchestrator compile examples/customer-complaint-composition/plan.json --out .tmp/customer-complaint-orchestrator --dry-run
```

Export it explicitly:

```bash
pnpm exec yutra orchestrator compile examples/customer-complaint-composition/plan.json --out .tmp/customer-complaint-orchestrator --force
```

`scenario.orchestrator.yaml` is a preview-only Scenario Orchestrator Contract
artifact. It is not `agent.yutra.yaml` and is not executable by the current
Yutra Runtime. The demo does not connect a real adapter or endpoint and
contains no customer SOP.
