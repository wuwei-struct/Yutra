[![English](https://img.shields.io/badge/Language-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red)](./README.zh-CN.md)

# Yutra

Yutra is a Skill-based Agent Execution Standard and Reference Runtime.

Skill gives AI capabilities.  
Yutra makes those capabilities executable, governed, traceable, auditable, and certifiable.

## Why Yutra

Modern agents are increasingly built from Skills, tools, APIs, and functions.  
But a capability alone is not enough.

Teams still need to answer:

- Which Skill was called?
- In which Agent state?
- Under which Guard or Policy?
- With what input and output?
- Was the call allowed, denied, retried, handed off, or audited?
- Can the behavior be reproduced and certified?

Yutra provides the execution layer above Skills.

## What Yutra Provides

- DSL for defining agents, states, actions, transitions, guards, and context.
- Reference Runtime for deterministic execution.
- Skill Core for loading, validating, inspecting, adapting, and executing local Skills.
- Governance with policy packs, allow / deny / handoff, approval, and HITL contracts.
- Trace & Audit for replay, context diff, comparison, and audit bundle export.
- Certification with golden traces and conformance checks.
- Scenario Packs including IT Helpdesk, Approval Agent, and Skill-based E-commerce Support.

## Quick Start

```bash
pnpm install
pnpm verify
pnpm certify
pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm exec yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
```

## Skill-based Demo

This demo shows a local Skill being adapted into a Yutra Action and executed under trace/audit.

```bash
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra skill validate examples/ecommerce-support/skills/query-shipping
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/handoff-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
pnpm exec yutra trace export <runId> --trace-file .yutra/traces/skill-based-ecommerce.jsonl --out demo-artifacts/skill-based-ecommerce-handoff.json
```

## Core Concepts

| Concept | Meaning |
|---|---|
| Skill | Capability unit and implementation source |
| Action | Standardized invocation contract |
| State | Execution context and transition boundary |
| Guard | Runtime condition and decision gate |
| Policy | Governance layer for allow / deny / handoff |
| Runtime | Deterministic execution engine |
| Trace | Execution evidence |
| Audit Bundle | Portable review artifact |
| Certification | Stable behavior verification |

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

Skill is not a top-level Agent or State object.  
It is the implementation unit behind a Yutra Action.

## Examples and Packs

- `examples/it-helpdesk` - basic stateful support flow.
- `examples/ecommerce-support` - Skill-based e-commerce support pack.
- `examples/approval-agent` - approval and human-in-the-loop flow.
- `starters/minimal-agent-pack` - minimal starter pack.
- `starters/support-pack` - support-oriented starter pack.

## Trace, Audit, Certification

## Trace / Audit / Certification

Yutra records execution evidence as trace events.

You can:

- replay a run
- inspect context diffs
- compare runs
- export audit bundles
- certify examples against stable golden projections

```bash
pnpm certify
```

Certification summary: `.yutra/certification/summary.json`.

## Non-goals

## What Yutra Is Not

Yutra is currently not:
- a Skill marketplace
- a remote registry
- an install workflow
- a SaaS dashboard
- a customer service backend
- a BI / analytics platform
- an LLM-first orchestration framework
- a real customer API integration layer

## Documentation

### Start Here

- [中文 README](./README.zh-CN.md)
- [Skill-based Runtime](docs/skill-based-runtime.md)
- [Skill-based Demo Path](docs/skill-based-demo-path.md)
- [Release Notes v0.2.0-rc.1](docs/release-notes-v0.2.0-rc.1.md)

### Concepts

- [Conformance and Golden Trace](docs/conformance.md)
- [Scenario Packs and Starter Packs](docs/scenario-packs.md)
- [Skill Certification Summary](docs/skill-certification-summary.md)

### E-commerce Pack

- [E-commerce Skill Pack](docs/ecommerce-skill-pack.md)
- [E-commerce Demo Path](docs/ecommerce-demo-path.md)
- [E-commerce Pricing Scope](docs/ecommerce-pricing-scope.md)
- [E-commerce Proposal Outline](docs/ecommerce-proposal-outline.md)

### Project

- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)

## Contributing

- Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).
- Run `pnpm verify` before opening a PR.

## License

MIT. See [LICENSE](LICENSE).
