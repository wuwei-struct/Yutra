# Yutra v0.1.0-rc.2 — Execution Standard + Reference Runtime

Yutra is an Agent Execution Standard and Reference Runtime.

## This release includes

- Execution Standard v0.1
- DSL loader / validator
- Reference Runtime
- Trace Core
- Minimal CLI
- Interfaces (tool / knowledge / llm)
- 3 runnable examples
- Minimal Trace Viewer
- English / 中文 viewer switch

## What Yutra is NOT

- not a visual workflow platform
- not a chat SaaS
- not a multi-tenant backend
- not an LLM-first orchestration system

## Runnable examples

- IT Helpdesk
- E-commerce Support
- Approval Agent

## Viewer highlights

- run list
- timeline
- event detail
- completed / handoff inspection
- bilingual UI labels

## Known limitations

- local-first only
- jsonl/sqlite trace scope limited
- no remote trace server
- no production-grade connector ecosystem
- approval/ticket/vector adapter still include stubs

## Quick start

```bash
pnpm install
pnpm yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json --trace-file demo-artifacts/it-helpdesk.jsonl
pnpm --filter @yutra/viewer dev
```
