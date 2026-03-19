# Example Walkthrough

## 1) Run IT Helpdesk

```bash
pnpm yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json --trace-file .yutra/traces/walkthrough-it.jsonl
```

Trace focus:
- deterministic two-state flow
- action execution and close transition

## 2) Run E-commerce Support

```bash
pnpm yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/case1.json --trace-file .yutra/traces/walkthrough-ecom.jsonl
```

Trace focus:
- SOP decomposition across triage/order/answer states
- knowledge + tool actions updating context

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
2. 60s: Run one happy-path example (`it-helpdesk`).
3. 60s: Open viewer and inspect `action.succeeded` payload + transition.
4. 30s: Run approval high-risk case and show `handoff.requested`.
