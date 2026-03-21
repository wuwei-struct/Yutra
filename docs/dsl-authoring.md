# DSL Authoring Guide

## Goal

Yutra supports Chinese authoring while keeping one canonical internal schema in English.

Three layers:
- Authoring layer: user-written DSL (`中文` or mixed `中英`).
- Normalize layer: key alias mapping + name canonicalization.
- Runtime layer: canonical IR only.

## Key Alias Normalize

Supported key aliases (explicit map, no fuzzy NLP):

- `智能体 -> agent`
- `版本 -> version`
- `意图 -> intents`
- `上下文 -> context`
- `初始状态 -> initial_state`
- `状态 / 状态集 -> states`
- `动作 -> actions`
- `守卫 / 条件守卫 -> guards`
- `转移 -> transitions`
- `到 -> to`
- `条件 -> when`
- `进入时 -> on_enter`
- `退出时 -> on_exit`

## Name Canonicalization

After structural normalize, names are canonicalized for:
- agent
- intent names
- context field names
- state names
- action names
- guard names
- transition targets

Provenance is explicit:
- `alias_map`: key-level alias mapping
- `dictionary`: explicit name dictionary mapping
- `slug`: deterministic slug rule
- `codepoint_fallback`: deterministic fallback for unmapped non-ASCII terms

## Explain / Inspect Commands

Human-readable explain:

```bash
pnpm exec yutra dsl explain examples/it-helpdesk/agent.zh-CN.yutra.yaml
```

Structured inspect:

```bash
pnpm exec yutra dsl inspect examples/it-helpdesk/agent.zh-CN.yutra.yaml --json
```

`explain` output sections:
- `=== Source ===`
- `=== Structural Normalize ===`
- `=== Canonicalization ===`
- `=== Canonical IR Summary ===`
- `=== Issues / Warnings ===`

`inspect --json` includes:
- `raw`
- `normalized`
- `canonical`
- `mappings.fieldAliases`
- `mappings.canonicalNames`
- `issues`
- `warnings`

## Example: Chinese DSL -> Canonical IR

Authoring:

```yaml
智能体: IT支持
初始状态: 诊断
状态集:
  诊断:
    动作:
      - lookup_ticket
    转移:
      - 到: 已解决
        条件: ctx.ticket_has_solution == true
  已解决:
    final: true
动作:
  - name: lookup_ticket
  - name: close_ticket
```

Canonical IR (summary):

```yaml
agent: it_helpdesk_agent
initial_state: triage
states:
  triage:
    actions:
      - lookup_ticket
    transitions:
      - to: resolved
        when: ctx.ticket_has_solution == true
  resolved:
    final: true
actions:
  - name: lookup_ticket
  - name: close_ticket
```

## Current Non-Supported Scope

- No natural-language parser or fuzzy field inference.
- No automatic semantic translation for arbitrary Chinese values.
- No LLM parser or AI rewriting.
- No visual authoring IDE in this stage.

