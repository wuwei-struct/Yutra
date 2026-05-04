[![English](https://img.shields.io/badge/Language-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red)](./README.zh-CN.md)

# Yutra

Yutra is a Skill-based Agent Execution Standard and Reference Runtime.

## What Yutra Is

Yutra is an execution-first stack for deterministic agent flows:
- a stable execution standard,
- a DSL loader/validator,
- a skill-to-action metadata adapter,
- a reference runtime,
- and structured trace output.

## Why It Exists

- Agent workflows are complex.
- Prompt-only behavior is hard to control.
- Enterprises need traceable execution.

## Minimal Example

```yaml
agent: it-helpdesk-agent
initial_state: triage
states:
  triage:
    actions:
      - lookup_ticket
    transitions:
      - to: resolved
        when: ctx.ticket_has_solution == true
  resolved:
    actions:
      - close_ticket
    final: true
actions:
  - name: lookup_ticket
  - name: close_ticket
```

## Chinese Authoring and Canonical IR

Chinese authoring is supported via explicit parser aliases and deterministic name canonicalization.
Runtime still executes one canonical internal schema.

- Full Chinese authoring example and mapping: [README.zh-CN.md](./README.zh-CN.md)
- Debug commands:

```bash
pnpm exec yutra dsl explain examples/it-helpdesk/agent.zh-CN.yutra.yaml
pnpm exec yutra dsl inspect examples/it-helpdesk/agent.zh-CN.yutra.yaml --json
```

## Quick Start

```bash
pnpm install
pnpm verify
pnpm certify
pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm exec yutra validate examples/it-helpdesk/agent.zh-CN.yutra.yaml
pnpm exec yutra skill list
pnpm exec yutra skill inspect query_shipping_status
pnpm exec yutra skill inspect skills/query-shipping --as-action
pnpm exec yutra skill validate skills/query-shipping
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills
pnpm exec yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
pnpm exec yutra trace list --trace-file .yutra/traces/events.jsonl
pnpm --filter @yutra/viewer dev
```

## Skill Demo

```bash
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra skill validate examples/ecommerce-support/skills/query-shipping
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/handoff-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
pnpm exec yutra trace export <runId> --trace-file .yutra/traces/skill-based-ecommerce.jsonl --out demo-artifacts/skill-based-ecommerce-handoff.json
```

## Examples Matrix

- IT Helpdesk: state machine + tool calls + branching transitions.
- E-commerce Support: SOP + knowledge + tool integration.
- Approval Agent: guards + approval chain + handoff.

## Certified Scenario Packs

- `examples/it-helpdesk` (`it-helpdesk-pack`)
- `examples/ecommerce-support` (`ecommerce-support-pack`, business-depth delivery pack in P3-02)
- `examples/approval-agent` (`approval-agent-pack`)

Each pack includes a `pack.manifest.json` with entrypoints, included assets, and certification references.

## Starter Packs

- `starters/minimal-agent-pack`: smallest copy-and-rename starter.
- `starters/support-pack`: support-flow starter with optional policy placeholder.

See details in [docs/scenario-packs.md](docs/scenario-packs.md).

## Conformance and Golden Trace

Yutra includes a local conformance suite with golden trace projections.

```bash
pnpm certify
```

Certification compares stable behavior fields (event sequence, state/action path, final status, governance/approval signals) and ignores volatile fields (`runId`, `ts`, generated IDs).

Machine-readable summary:
- `.yutra/certification/summary.json`

## Trace Viewer

The viewer keeps a strict three-column layout:
- Left: Run list
- Middle: Timeline
- Right: Event detail

Localization:
- Viewer supports English / 中文 UI switching.
- Switching locale only changes UI labels.
- Trace event type strings and payload raw fields remain unchanged.

## Non-goals

Yutra is currently not:
- a visual workflow platform,
- a chat SaaS shell,
- a multi-tenant admin backend,
- an LLM-first orchestration system,
- a skill marketplace/remote skill store.

## Documentation Map

- [简体中文 README](./README.zh-CN.md)
- [DSL Authoring Guide](docs/dsl-authoring.md)
- [Conformance and Golden Trace](docs/conformance.md)
- [Scenario Packs and Starters](docs/scenario-packs.md)
- [Skill Core](docs/skill-core.md)
- [Skill-based Agent](docs/skill-based-agent.md)
- [Skill-based Runtime](docs/skill-based-runtime.md)
- [Skill-based Demo Path](docs/skill-based-demo-path.md)
- [Skill Certification Summary](docs/skill-certification-summary.md)
- [Skill-based Runtime Release Notes](docs/release-notes-skill-based-runtime.md)
- [Release Notes v0.2.0-rc.1](docs/release-notes-v0.2.0-rc.1.md)
- [E-commerce Skill Pack](docs/ecommerce-skill-pack.md)
- [E-commerce Pack Delivery Baseline](docs/ecommerce-pack-delivery.md)
- [E-commerce Client Onboarding Checklist](docs/ecommerce-client-onboarding-checklist.md)
- [E-commerce Demo Path](docs/ecommerce-demo-path.md)
- [E-commerce Demo Script](docs/ecommerce-demo-script.md)
- [E-commerce Scope Checklist](docs/ecommerce-scope-checklist.md)
- [E-commerce Pricing Scope](docs/ecommerce-pricing-scope.md)
- [E-commerce Delivery Plan Template](docs/ecommerce-delivery-plan-template.md)
- [E-commerce Delivery Risks](docs/ecommerce-delivery-risks.md)
- [E-commerce Deliverables](docs/ecommerce-deliverables.md)
- [E-commerce Proposal Outline](docs/ecommerce-proposal-outline.md)
- [E-commerce UAT Plan](docs/ecommerce-uat-plan.md)
- [E-commerce Joint Debug Checklist](docs/ecommerce-joint-debug-checklist.md)
- [E-commerce Rollout Checklist](docs/ecommerce-rollout-checklist.md)
- [Execution Standard](docs/execution-standard.md)
- [Tool Interface](docs/tool-interface.md)
- [Knowledge Interface](docs/knowledge-interface.md)
- [LLM Interface](docs/llm-interface.md)
- [Example Walkthrough](docs/example-walkthrough.md)
- [Demo Script](docs/demo-script.md)
- [Release Checklist](docs/release-checklist.md)
- [Contributing](CONTRIBUTING.md)
- [Agent Collaboration Rules](AGENTS.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)




