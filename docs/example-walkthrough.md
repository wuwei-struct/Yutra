# Example Walkthrough

## 0) Conformance Gate (Recommended Before Demo)

```bash
pnpm certify
```

Check summary:
- `.yutra/certification/summary.json`

Pack and starter references:
- `docs/scenario-packs.md`
- `examples/*/pack.manifest.json`
- `starters/minimal-agent-pack`

## 1) Run IT Helpdesk

```bash
pnpm yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json --trace-file .yutra/traces/walkthrough-it.jsonl
```

Trace focus:
- deterministic two-state flow
- action execution and close transition

DSL debug entry (Chinese authoring):

```bash
pnpm yutra dsl explain examples/it-helpdesk/agent.zh-CN.yutra.yaml
pnpm yutra dsl inspect examples/it-helpdesk/agent.zh-CN.yutra.yaml --json
```

## 2) Run E-commerce Support (P3-02 business-depth)

```bash
pnpm yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-delayed.json --trace-file .yutra/traces/walkthrough-ecom-shipping-delayed.jsonl
pnpm yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/return-expired.json --trace-file .yutra/traces/walkthrough-ecom-return-expired.jsonl
pnpm yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/refund-high-risk.json --trace-file .yutra/traces/walkthrough-ecom-refund-high-risk.jsonl
```

Trace focus:
- SOP path and exception routing
- policy-aware handoff behavior
- response-template layer separated from execution logic

## 3) Run Approval Agent

```bash
pnpm yutra run examples/approval-agent/agent.yutra.yaml --input examples/approval-agent/demo-inputs/case2.json --trace-file .yutra/traces/walkthrough-approval-handoff.jsonl
```

Trace focus:
- guard evaluation (`high_risk`)
- transition into handoff state

## 4) Open Trace Viewer

```bash
pnpm --filter @yutra/viewer dev
```

In viewer:
- load sample trace from dropdown, or upload one of `.yutra/traces/*.jsonl`
- left panel: switch runs
- middle panel: inspect event sequence
- right panel: inspect structured payload

## Suggested 3-minute demo order

1. 30s: Positioning (`execution-first`, not prompt script).
2. 45s: Run `it-helpdesk` happy path.
3. 45s: Run `ecommerce-support` high-risk refund case and highlight handoff reason.
4. 45s: Open viewer and inspect `action.succeeded` + `handoff.requested` payload.
5. 15s: Close with deterministic policy-driven execution summary.


Integration docs:
- docs/ecommerce-client-onboarding-checklist.md
- docs/ecommerce-demo-path.md
- docs/ecommerce-demo-script.md
- docs/ecommerce-scope-checklist.md
- docs/ecommerce-pricing-scope.md
- docs/ecommerce-delivery-plan-template.md
- docs/ecommerce-delivery-risks.md
- docs/ecommerce-deliverables.md
- docs/ecommerce-proposal-outline.md
- examples/ecommerce-support/INTEGRATION.md

