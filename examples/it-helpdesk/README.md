# IT Helpdesk Example

This directory is also a certified Scenario Pack (`it-helpdesk-pack`).

## What this example proves

A deterministic state-machine helpdesk flow with tool actions and guard-based branching.

## State machine overview

- `triage`: lookup ticket and evaluate close condition.
- `resolved`: close ticket and finish (`final=true`).

## Roles of tools / guard / handoff

- tools: `lookup_ticket`, `close_ticket`.
- guard: `can_close` controls transition from `triage` to `resolved`.
- handoff: not used in this example (focus is minimal completion path).

## Run commands

```bash
pnpm yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm yutra validate examples/it-helpdesk/agent.zh-CN.yutra.yaml
pnpm yutra dsl explain examples/it-helpdesk/agent.zh-CN.yutra.yaml
pnpm yutra dsl inspect examples/it-helpdesk/agent.zh-CN.yutra.yaml --json
pnpm yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
pnpm yutra run examples/it-helpdesk/agent.zh-CN.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
```

## Chinese authoring note

- `agent.zh-CN.yutra.yaml` demonstrates Chinese authoring (field aliases + Chinese names).
- The DSL parser normalizes it into canonical internal names before runtime execution.
- Runtime still executes against canonical schema only.
- `agent.yutra.yaml` and `agent.zh-CN.yutra.yaml` are semantically equivalent after canonicalization.

## Inspect output focus

- In `dsl explain`, check:
  - `=== Structural Normalize ===` for alias map rewrites
  - `=== Canonicalization ===` for name mappings and provenance
- In `dsl inspect --json`, check:
  - `mappings.fieldAliases`
  - `mappings.canonicalNames`
  - `canonical` for runtime-facing IR

## What to observe in trace

- `state.entered` -> `action.started/succeeded` -> `guard.evaluated`
- `transition.resolved` to `resolved`
- final `run.completed`

## Pack customization

- Manifest: `examples/it-helpdesk/pack.manifest.json`
- Replace tools: edit `actions.mjs` (or `actions.ts`)
- Replace domain context/flow: edit `agent.yutra.yaml` and `agent.zh-CN.yutra.yaml`
- Certification references in this pack: `it-helpdesk-happy`, `it-helpdesk-zh`
