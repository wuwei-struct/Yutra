# Approval Agent Example

## What this example proves

Structured approval chain with explicit guard evaluation and handoff for high-risk requests.

## State machine overview

- `intake` -> `validate_request`
- `approval_required` -> auto-approve or `await_approval`
- `await_approval` -> `approved` or `denied`
- `approved` -> `execute_request` -> `notify_result` -> `completed`
- `handoff_security` for high-risk or invalid requests

## Roles of tools / knowledge / guard / handoff

- approval tool: returns structured approval result (`pending/approved/rejected`) as stub.
- execute/notify tools: deterministic execution actions.
- guard: `high_risk`, `auto_approvable`, `approval_granted`, `approval_denied`.
- handoff: high-risk path ends at `handoff_security`.

## Run commands

```bash
pnpm yutra validate examples/approval-agent/agent.yutra.yaml
pnpm yutra run examples/approval-agent/agent.yutra.yaml --input examples/approval-agent/demo-inputs/case1.json
pnpm yutra run examples/approval-agent/agent.yutra.yaml --input examples/approval-agent/demo-inputs/case2.json
```

## What to observe in trace

- `guard.evaluated` drives branch behavior.
- approval path reaches `run.completed`.
- high-risk path reaches `handoff.requested`.
