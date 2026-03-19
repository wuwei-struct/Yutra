[![English](https://img.shields.io/badge/Language-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red)](./README.zh-CN.md)

# Yutra

Yutra is an Agent Execution Standard and Reference Runtime.

## What Yutra Is

Yutra is an execution-first stack for deterministic agent flows:
- a stable execution standard,
- a DSL loader/validator,
- a reference runtime,
- and structured trace output.

## Why It Exists

- Agent workflows are complex.
- Prompt-only behavior is hard to control.
- Enterprises need traceable execution.

## English DSL Example

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

## Chinese DSL Authoring

Chinese authoring is supported via explicit parser aliases.
The parser normalizes DSL keys into one canonical internal schema used by runtime.

For a full Chinese authoring example and canonical IR mapping, see:
- [README.zh-CN.md](./README.zh-CN.md)

Current support level:
- Supported: key-level aliases (for example `智能体 -> agent`, `状态集 -> states`, `到 -> to`, `条件 -> when`).
- Supported: Chinese string values can pass parse/validate when references are consistent.
- Not implemented: semantic normalization for Chinese value meanings (value translation is not automatic).

## Quick Start

```bash
pnpm install
pnpm verify
pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm exec yutra validate examples/it-helpdesk/agent.zh-CN.yutra.yaml
pnpm exec yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
pnpm exec yutra trace list --trace-file .yutra/traces/events.jsonl
pnpm --filter @yutra/viewer dev
```

## Examples Matrix

- IT Helpdesk: state machine + tool calls + branching transitions.
- E-commerce Support: SOP + knowledge + tool integration.
- Approval Agent: guards + approval chain + handoff.

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
- an LLM-first orchestration system.

## Documentation Map

- [简体中文 README](./README.zh-CN.md)
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
