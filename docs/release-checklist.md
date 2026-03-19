# Release Checklist (v0.1.0-rc.1)

## Core quality gate

- [ ] `pnpm install`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm verify`

## Example execution

- [ ] `pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml`
- [ ] `pnpm exec yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json --trace-file demo-artifacts/it-helpdesk.jsonl`
- [ ] `pnpm exec yutra run examples/ecommerce-support/agent.yutra.yaml --input examples/ecommerce-support/demo-inputs/case1.json --trace-file demo-artifacts/ecommerce-support.jsonl`
- [ ] `pnpm exec yutra run examples/approval-agent/agent.yutra.yaml --input examples/approval-agent/demo-inputs/case1.json --trace-file demo-artifacts/approval-agent-completed.jsonl`
- [ ] `pnpm exec yutra run examples/approval-agent/agent.yutra.yaml --input examples/approval-agent/demo-inputs/case2.json --trace-file demo-artifacts/approval-agent-handoff.jsonl`

## Viewer checks

- [ ] `pnpm --filter @yutra/viewer build`
- [ ] `pnpm --filter @yutra/viewer dev --host 127.0.0.1 --port 5173`
- [ ] Load sample trace in viewer
- [ ] Upload local JSONL in viewer
- [ ] Confirm completed status shown
- [ ] Confirm handoff status shown

## Assets

- [ ] `docs/assets/viewer-action-succeeded.png` exists
- [ ] `docs/assets/viewer-handoff-requested.png` exists

## Demo artifacts source note

All files in `demo-artifacts/` must be generated from real commands above; do not hand-edit JSONL payloads.
