# IT Helpdesk Example

## What this example proves

A deterministic state-machine helpdesk flow with tool actions and guard-based branching.

## State machine overview

- `triage`: lookup ticket and evaluate close condition.
- `resolved`: close ticket and finish (`final=true`).

## Roles of tools / guard / handoff

- tools: `lookup_ticket`, `close_ticket`.
- guard: `can_close` controls transition from `triage` to `resolved`.
- handoff: not used in this example (focus is minimal completion path).

## Run commands

```bash
pnpm yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
```

## What to observe in trace

- `state.entered` -> `action.started/succeeded` -> `guard.evaluated`
- `transition.resolved` to `resolved`
- final `run.completed`
