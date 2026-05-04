[![English](https://img.shields.io/badge/Language-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red)](./README.zh-CN.md)

# Yutra

Skill-based Agent Execution Standard and Reference Runtime.

## Why Yutra

- Agent workflows need deterministic execution boundaries.
- Prompt-only orchestration is difficult to govern and audit.
- Teams need proof of what ran, where, and under which policy.

## Quick Start

```bash
pnpm install
pnpm verify
pnpm certify
pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm exec yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
```

## Skill-based Demo

```bash
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra skill validate examples/ecommerce-support/skills/query-shipping
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/handoff-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
pnpm exec yutra trace export <runId> --trace-file .yutra/traces/skill-based-ecommerce.jsonl --out demo-artifacts/skill-based-ecommerce-handoff.json
```

## Core Concepts

- `Skill`: capability unit and implementation source.
- `Action`: standardized invocation contract.
- `State`: execution scene and transition boundary.
- `Runtime`: deterministic scheduler/executor.
- `Trace/Audit/Certification`: execution evidence.

Skill is not a peer object of Agent/State.

## Architecture

```text
Skill / Tool / API / Function
  -> Action Adapter
  -> Yutra Action
  -> State
  -> Agent
  -> Runtime
  -> Trace / Audit / Certification
```

## Examples And Packs

- `examples/it-helpdesk`
- `examples/ecommerce-support`
- `examples/approval-agent`
- `starters/minimal-agent-pack`
- `starters/support-pack`

## Trace, Audit, Certification

```bash
pnpm certify
```

- Stable projection checks are used instead of byte-by-byte trace matching.
- Certification summary is generated at `.yutra/certification/summary.json`.

## Non-goals

Yutra is not:
- a marketplace
- a remote registry
- an install workflow
- a SaaS platform UI/admin backend
- an LLM-first control loop rewrite

## Contributing

- Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).
- Run `pnpm verify` before opening a PR.

## License

MIT. See [LICENSE](LICENSE).

## Documentation Map

- [简体中文 README](./README.zh-CN.md)
- [Conformance and Golden Trace](docs/conformance.md)
- [Scenario Packs and Starters](docs/scenario-packs.md)
- [Skill-based Runtime](docs/skill-based-runtime.md)
- [Skill-based Demo Path](docs/skill-based-demo-path.md)
- [Skill Certification Summary](docs/skill-certification-summary.md)
- [Release Notes v0.2.0-rc.1](docs/release-notes-v0.2.0-rc.1.md)
- [GitHub Repository Settings](docs/github-repo-settings.md)
- [E-commerce Skill Pack](docs/ecommerce-skill-pack.md)
- [E-commerce Demo Path](docs/ecommerce-demo-path.md)
- [E-commerce Pricing Scope](docs/ecommerce-pricing-scope.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)


