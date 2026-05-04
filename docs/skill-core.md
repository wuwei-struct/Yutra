# Skill Core (P4-03)

## 1. Skill in Yutra

Yutra is execution-first.
Skill is not a peer of Agent/State. Skill is the implementation unit behind Action.

Flow:

Skill / Tool / API / Function
-> Action Adapter
-> Yutra Action
-> State
-> Agent
-> Runtime
-> Trace / Audit / Certification

## 2. Skill directory standard (v0.1)

```text
skills/
  query-shipping/
    SKILL.md
    skill.json
    scripts/
      run.mjs
    references/
      shipping-policy.md
    assets/
      reply-template.md
```

## 3. SKILL.md vs skill.json

- `SKILL.md`: human/LLM readable instructions and context.
- `skill.json`: machine-readable manifest contract for loader/validator.

## 4. Manifest fields

`YutraSkillManifest` minimal fields:
- `name` (required)
- `version` (required)
- `type` (required, one of `tool|knowledge|llm|function`)
- optional: `description`, `inputSchema`, `outputSchema`, `entry`, `tags`, `metadata`
- governed options:
  - `sideEffect`: `none|read|write|external` (default `none`)
  - `riskLevel`: `low|medium|high` (default `low`)
  - `requiresApproval`: boolean (default `false`)
  - `allowedEnvironments`: `dev|demo|prod-like` only
  - `maxCallsPerRun`: positive integer

## 5. P4-01 supports

- local skill directory loading
- `skill.json` parsing + schema validation
- `SKILL.md` optional loading
- entry file existence check (if manifest declares `entry`)
- references/assets directory scan
- structured validation issues

## 6. P4-01 does NOT support

- runtime execution-chain integration
- ActionExecutor changes
- skill CLI commands
- remote registry/marketplace
- skill script execution
- new trace event types

## 7. Skill Registry and CLI (P4-02)

Local registry/discovery is now available.

Default discovery paths:
- `skills/*`
- `.yutra/skills/*`
- `examples/ecommerce-support/skills/*`

CLI:

```bash
pnpm exec yutra skill list
pnpm exec yutra skill list --json
pnpm exec yutra skill inspect query_shipping_status
pnpm exec yutra skill inspect skills/query-shipping --json
pnpm exec yutra skill validate skills/query-shipping
```

Notes:
- Local-only registry.
- No install command.
- No remote registry/marketplace.
- Skill entry scripts are not executed in P4-02.

## 8. Skill to Action Adapter (P4-03)

`@yutra/skill-core` now provides a bridge layer that converts skill metadata into action metadata:

- `skillToAction(skill)`:
  - input: `LoadedSkill | YutraSkillManifest`
  - output: `ActionSpecLike` metadata
- `skillToActionRegistry(skills)`:
  - input: `LoadedSkill[]`
  - output: `{ actions, issues }`
- `buildSkillActionMap(skills)`:
  - input: `LoadedSkill[]`
  - output: `Record<string, ActionSpecLike>`

### ActionSpecLike output example

```ts
{
  name: "query_shipping_status",
  description: "Query shipping status by order id.",
  inputSchema: { type: "object", ... },
  outputSchema: { type: "object", ... },
  sideEffect: "read",
  riskLevel: "low",
  requiresApproval: false,
  implementation: {
    type: "skill",
    skillName: "query_shipping_status",
    skillVersion: "0.1.0",
    skillDir: "/abs/path/to/skills/query-shipping",
    entry: "scripts/run.mjs"
  },
  metadata: {
    tags: ["ecommerce", "shipping"],
    allowedEnvironments: ["dev", "demo", "prod-like"],
    maxCallsPerRun: 5
  }
}
```

### Mapping rules

- `manifest.name` -> `action.name`, `implementation.skillName`
- `manifest.version` -> `implementation.skillVersion`
- `loadedSkill.dir` -> `implementation.skillDir`
- `manifest.entry` -> `implementation.entry`
- `manifest.inputSchema` -> `action.inputSchema`
- `manifest.outputSchema` -> `action.outputSchema`
- `manifest.sideEffect` -> `action.sideEffect`
- `manifest.riskLevel` -> `action.riskLevel`
- `manifest.requiresApproval` -> `action.requiresApproval`

### Why Skill is not peer of Agent/State

- Skill is capability metadata and implementation source.
- Action is the standard invocation metadata used by state transitions.
- State/Agent remain execution orchestration structures.
- This keeps runtime architecture stable and deterministic.

### Current boundary

- Adapter only converts metadata.
- Adapter does not execute skill entry.
- Adapter does not connect runtime `ActionExecutor`.
- Adapter does not add any `skill.*` trace event types.

## 9. CLI inspect as action (optional bridge view)

P4-03 adds inspect-only conversion output:

```bash
pnpm exec yutra skill inspect skills/query-shipping --as-action
pnpm exec yutra skill inspect skills/query-shipping --as-action --json
```

Notes:
- Conversion output only.
- No skill execution.
- No runtime registration.

## 10. Next roadmap

- P4-03: Skill to Action Adapter
- P4-04: Skill Runtime Execution
- P4-05: Ecommerce Skill Pack
- P4-06: Skill-based Runtime Release Readiness

## 11. Skill-based Milestone (P4-06)

Skill remains an implementation unit behind Action, not a peer object of Agent/State.

Milestone docs:
- `docs/skill-based-runtime.md`
- `docs/skill-based-demo-path.md`
- `docs/skill-certification-summary.md`
- `docs/release-notes-skill-based-runtime.md`

Explicit non-goals:
- no marketplace
- no remote registry
- no install command
