# Starter: Support Pack

Use this starter when you need a support-style flow (triage -> resolved) as a base.

## Includes

- `agent.yutra.yaml`
- `demo-inputs/case1.json`
- `policy.demo.json` (optional governance placeholder)
- `pack.manifest.json`

## How to use

1. Copy this directory.
2. Replace states with your SOP.
3. Add knowledge/tools/policy as needed.
4. Keep certification and traces enabled in your workflow.

## Validate and run

```bash
pnpm yutra validate starters/support-pack/agent.yutra.yaml
pnpm yutra run starters/support-pack/agent.yutra.yaml --input starters/support-pack/demo-inputs/case1.json
```
