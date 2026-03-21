# Starter: Minimal Agent Pack

Use this starter when you want the smallest executable Yutra pack.

## Includes

- `agent.yutra.yaml`
- `demo-inputs/case1.json`
- `pack.manifest.json`

## How to use

1. Copy this directory and rename the folder.
2. Rename `agent` in `agent.yutra.yaml`.
3. Replace states/transitions with your domain flow.
4. Add actions only when needed.

## Validate and run

```bash
pnpm yutra validate starters/minimal-agent-pack/agent.yutra.yaml
pnpm yutra run starters/minimal-agent-pack/agent.yutra.yaml --input starters/minimal-agent-pack/demo-inputs/case1.json
```
