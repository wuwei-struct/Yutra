[![English](https://img.shields.io/badge/Language-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red)](./README.zh-CN.md)

# Yutra

Yutra is a Skill-based Agent Execution Standard, Runtime, and Builder.

Yutra is evolving toward an Agent Creation Layer:
Archetype Library + Business Rule Configuration + Rule Compiler + Creator Workbench.

Current status and vNext direction are intentionally separate: the Skill-based Runtime and Studio exist today; the Agent Creation Layer is the next-stage direction documented in this repository.

Skill gives AI capabilities.  
Yutra makes those capabilities executable, governed, traceable, auditable, and certifiable.

Builder Core now exists as `@yutra/builder-core` for form-to-spec and Chinese DSL draft generation.
Yutra Studio now exists as a local Agent Editor Workbench at `apps/builder` (not SaaS, not multi-tenant).
Yutra Studio supports AI Draft, editable DSL inspect, AgentSpec preview, Run Preview, Trace, and Audit in one workspace.
AI Draft Core now exists as `@yutra/builder-ai-core` with local mock provider only (no real LLM yet).
Builder UI now supports AI Draft Assistant (manual apply required, runtime preview remains manual).
Builder Runner now supports optional real provider draft preview path (`/ai-draft-preview`) with strict FlowDraft-only boundary.

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

## Open Source Boundary

### Open-source core

This repository currently open-sources the reference implementation for:

- DSL / Canonical IR
- Reference Runtime
- Trace / Replay / Audit
- Governance / Policy / Handoff / Approval contracts
- Skill Core / Skill Runtime
- CLI
- Basic Viewer / Studio
- Example packs and starter packs
- Conformance / Certification tests
- vNext docs for Agent Archetypes and Rule Compiler direction

### Commercial / implementation layer

Future commercial or private implementation layers may include:

- real customer adapters
- enterprise policy packs
- advanced industry packs
- hosted trace / audit dashboards
- private deployment templates
- customer-specific SOP / templates / configs
- UAT / rollout / delivery playbooks
- enterprise support and implementation service

### Principle

Yutra keeps the execution standard and reference runtime transparent. Commercial value, if pursued, will mainly come from real-world integration, industry packs, private deployment, governance consulting, and implementation services.

See [Open Source Boundary](docs/open-source-boundary.md).

## Quick Start

```bash
pnpm install
pnpm verify
pnpm certify
pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm exec yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
pnpm builder:runner
pnpm builder:dev
```

## Yutra Studio

Yutra Studio is the local single-user Agent Editor Workbench prototype.

It includes:
- left navigation and top operation bar
- AI Draft Assistant
- DSL editor with Validate / Inspect / Apply as Run Source
- AgentSpec JSON preview
- validation / normalized / canonical inspect panel backed by `/dsl/inspect`
- Run Preview with embedded Trace and Audit panels
- English / 中文 UI switching from the top bar

Current limits:
- no real save or publish
- no login, database, or multi-tenant backend
- no full DSL-to-BuilderFormConfig reverse mapping
- Runtime execution still uses canonical IR
- language switching only changes UI labels; DSL, Trace event type strings, payload fields, and canonical IR stay unchanged

## vNext Direction

Yutra vNext is not about adding more hard-coded scenario packs.

The next step is to introduce an Agent Creation Layer:

```text
Archetype Library
+ Business Rule Config
+ Rule Compiler
+ Creator Workbench
+ Runtime / Trace / Audit / Certification
```

The goal is to let users configure business rules instead of writing DSL directly. The DSL remains the deterministic intermediate layer behind the scenes.

The vNext direction keeps Runtime execution-first. Customers should configure business rules; Yutra should generate DSL, policy, templates, tests, and trace expectations behind the scenes.

Start here:

- [vNext Charter](docs/vnext-charter.md)
- [Agent Archetype Library](docs/archetype-library.md)
- [Archetype Core](docs/archetype-core.md)
- [Business Rule Config](docs/business-rule-config.md)
- [Rule Compiler Overview](docs/rule-compiler-overview.md)
- [Creator Workbench](docs/creator-workbench.md)
- [vNext Roadmap](docs/vnext-roadmap.md)

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
- a marketplace
- a remote skill registry
- an install workflow
- a multi-tenant SaaS platform
- a customer service backend
- a BI / analytics platform
- a full no-code workflow platform
- an LLM-first orchestration framework
- a real customer API integration package
- a hosted enterprise console

## Documentation

### Start Here

- [简体中文 README](./README.zh-CN.md)
- [Builder Core](docs/builder-core.md)
- [Yutra Studio](docs/yutra-studio.md)
- [DSL Editor Roundtrip / Inspect](docs/dsl-editor-roundtrip.md)
- [Builder UI / Yutra Studio](docs/builder-ui.md)
- [Builder Run + Trace](docs/builder-run-trace.md)
- [Builder AI Core](docs/builder-ai-core.md)
- [Builder Real LLM Provider](docs/builder-real-llm-provider.md)
- [Skill-based Runtime](docs/skill-based-runtime.md)
- [Skill-based Demo Path](docs/skill-based-demo-path.md)
- [Release Notes v0.2.0-rc.1](docs/release-notes-v0.2.0-rc.1.md)

### Concepts

- [Conformance and Golden Trace](docs/conformance.md)
- [Scenario Packs and Starter Packs](docs/scenario-packs.md)
- [Skill Certification Summary](docs/skill-certification-summary.md)

### vNext

- [vNext Charter](docs/vnext-charter.md)
- [Agent Archetype Library](docs/archetype-library.md)
- [Archetype Core](docs/archetype-core.md)
- [Business Rule Configuration](docs/business-rule-config.md)
- [Rule Compiler Overview](docs/rule-compiler-overview.md)
- [Creator Workbench](docs/creator-workbench.md)
- [vNext Roadmap](docs/vnext-roadmap.md)

### E-commerce Pack

- [E-commerce Skill Pack](docs/ecommerce-skill-pack.md)
- [E-commerce Demo Path](docs/ecommerce-demo-path.md)

Detailed pricing, proposal, UAT, rollout, and customer delivery playbooks are not public entry points. Keep customer-specific or commercially reusable implementation assets in private delivery repositories.

### Open Source & Commercial Boundary

- [Open Source Boundary](docs/open-source-boundary.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)
- [License](LICENSE)

### Project

- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)

## Contributing

- Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).
- Run `pnpm verify` before opening a PR.

## License

MIT. See [LICENSE](LICENSE).
