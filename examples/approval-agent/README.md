# Approval Agent Example

This directory is also a certified Scenario Pack (`approval-agent-pack`).

## What this example proves

Execution-first approval and human-in-the-loop contract:
- approval decision is structured (`pending/approved/denied/escalated`)
- runtime still advances by guards/transitions, not tool-controlled freeform logic
- handoff is emitted as a structured review request payload

## State machine overview

- `intake` -> `validate_request`
- `approval_required` -> auto-approve or `await_approval`
- `await_approval` -> `approved` / `denied` / `pending_review` / `escalated_review`
- `approved` -> `execute_request` -> `notify_result` -> `completed`
- `pending_review` / `escalated_review` / `handoff_security` are handoff states

## Roles of tools / knowledge / guard / handoff

- `approval_tool`: returns stable `ApprovalDecision` contract.
- `request_approval` action: writes `approval_status`, `approval_decision`, and `human_review_request` context.
- guards: `approval_granted`, `approval_denied`, `approval_pending`, `approval_escalated`, `high_risk`.
- handoff:
  - policy/runtime/guard/tool sources are distinguishable in `handoff.requested` payload.

## Run commands

```bash
pnpm yutra validate examples/approval-agent/agent.yutra.yaml
pnpm yutra run examples/approval-agent/agent.yutra.yaml --input examples/approval-agent/demo-inputs/case1.json
pnpm yutra run examples/approval-agent/agent.yutra.yaml --input examples/approval-agent/demo-inputs/case2.json
pnpm yutra run examples/approval-agent/agent.yutra.yaml --input examples/approval-agent/demo-inputs/case3.json
```

## What to observe in trace

- `action.succeeded` on `request_approval` includes approval decision fields.
- `guard.evaluated` shows decision-driven branching.
- `handoff.requested` includes review contract fields (`reviewId`, `reasonCode`, `source`, `summary`).
- terminal events include `approvalSummary` when approval is involved.

## Pack customization

- Manifest: `examples/approval-agent/pack.manifest.json`
- Replace approval/tool behavior: `tools/*.mjs` + `actions.mjs`
- Replace governance assumptions: local policy inputs/options in your run path
- Certification references in this pack: `approval-approved`, `approval-denied`, `approval-handoff`
