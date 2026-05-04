# Contributing

## Project Positioning

Yutra is a Skill-based Agent Execution Standard and Reference Runtime.

## Local Development

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm verify
```

## Certification Gate

Run this before opening a PR:

```bash
pnpm certify
```

## Pull Request Discipline

- One PR should have one clear intent.
- Do not expand scope opportunistically.
- Do not claim "passed" without real command execution.
- Keep changes execution-first and traceable.

## Add A New Skill

- Create `SKILL.md`, `skill.json`, and `scripts/run.mjs`.
- Keep implementation behind action contract (`implementation.type = "skill"`).
- Reuse existing adapter/tool contracts when possible.
- Add validation/inspect/runtime tests.
- Keep boundary constraints explicit in docs.

## Add A New Scenario Pack

- Reuse existing DSL/runtime/trace boundaries.
- Include `agent.yutra.yaml`, `README.md`, and `demo-inputs/case1.json`.
- Add runnable commands and trace expectations.
- Do not introduce new platform capabilities.

## Add A Tool / Knowledge Provider

- Add only minimal interface-compatible implementation.
- Keep deterministic behavior for testability.
- Mark stubs honestly if not production-ready.
- Do not move control logic from runtime into provider layers.

## PRs We Do Not Accept

- Marketplace and remote registry scope.
- Install workflow scope.
- SaaS dashboard or platform UI/admin backend scope.
- Real customer API integration requests in reference stage.
- Unrelated large feature bundles that bypass roadmap boundaries.

## Explicit Non-goals

- No marketplace.
- No remote registry.
- No install workflow.
- No runtime semantics rewrite without design iteration.
