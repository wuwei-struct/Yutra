# Contributing

## Project Positioning

Yutra is an Agent Execution Standard and Reference Runtime.

## Local Development

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm verify
```

## Pull Request Discipline

- One PR should have one clear intent.
- Do not expand scope opportunistically.
- Do not claim "passed" without real command execution.
- Keep changes execution-first and traceable.

## Add a New Example

- Reuse existing DSL/runtime/trace boundaries.
- Include `agent.yutra.yaml`, `README.md`, and `demo-inputs/case1.json`.
- Add runnable commands and trace expectations.
- Do not introduce new platform capabilities.

## Add a Tool / Knowledge Provider

- Add only minimal interface-compatible implementation.
- Keep deterministic behavior for testability.
- Mark stubs honestly if not production-ready.
- Do not move control logic from runtime into provider layers.

## Explicit Non-goals

Yutra is currently not:

- a visual workflow platform,
- a chat SaaS shell,
- a multi-tenant admin backend,
- an LLM-first orchestration system.
