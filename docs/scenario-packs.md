# Scenario Packs and Starter Packs

## What is a Scenario Pack

A Scenario Pack is a structured, certified domain delivery unit built on existing Yutra capabilities.

Each pack groups:
- DSL entrypoints
- tools/actions
- optional knowledge/policy files
- demo inputs
- certification references
- pack manifest

It is not a platform feature and does not add new runtime architecture.

## What is a Starter Pack

A Starter Pack is a smaller copy-ready template that helps developers begin quickly.

Compared with Scenario Packs, starters are intentionally minimal:
- fewer states
- minimal/no integrations
- small demo input
- pack manifest for consistency

## Scenario Pack vs Example

- Example: runnable demonstration.
- Scenario Pack: runnable demonstration + manifest + certification linkage + customization guidance.

In this repository, existing examples are now pack-aware scenario packs.

## Manifest Structure

Each pack contains `pack.manifest.json`:

```json
{
  "pack": "it-helpdesk-pack",
  "version": "0.1.0",
  "domain": "it-helpdesk",
  "language": ["en", "zh-CN"],
  "includes": {
    "dsl": ["agent.yutra.yaml", "agent.zh-CN.yutra.yaml"],
    "tools": ["actions.mjs"],
    "inputs": ["demo-inputs/case1.json"],
    "certification": ["it-helpdesk-happy", "it-helpdesk-zh"],
    "docs": ["README.md"]
  },
  "entrypoints": {
    "canonical": "agent.yutra.yaml",
    "zhCN": "agent.zh-CN.yutra.yaml"
  }
}
```

## Current Certified Scenario Packs

- `examples/it-helpdesk`
- `examples/ecommerce-support` (delivery baseline docs: `DELIVERY.md`, `CONFIG.md`, `SOP.md`)
- `examples/approval-agent`

Run full certification:

```bash
pnpm certify
```

Summary output:
- `.yutra/certification/summary.json`

## Current Starter Packs

- `starters/minimal-agent-pack`
- `starters/support-pack`

Use starter flow:
1. Copy a starter directory.
2. Rename pack/agent names.
3. Replace states/transitions/actions for your domain.
4. Run validate/run, then add it to certification.

## Replace Knowledge / Tools / Policy

- knowledge: replace local files under `knowledge/` and update action queries.
- tools: replace local tool implementations under `tools/` and action registry mapping.
- policy: add/update local policy JSON/YAML and pass runtime options/environment in your execution path.

## Scope Boundaries

- No marketplace
- No remote registry
- No multi-tenant pack management
- No new runtime/trace core features in this pack stage

## Skill Core Relation (P4-01)

Skill is now introduced as an Action-backend implementation unit.
It is not a Scenario Pack replacement and not a runtime control layer.

See:
- `docs/skill-core.md`
