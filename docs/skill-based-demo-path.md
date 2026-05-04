# Skill-based Demo Path (5 Minutes)

This quick demo is for external developers.
Goal: show that Skill is executed inside Yutra's controlled runtime chain, not as an uncontrolled direct call.

## Prerequisites

```bash
pnpm install
pnpm build
```

## Step 1: Show a Skill Manifest

Open:

- `examples/ecommerce-support/skills/query-shipping/skill.json`

This is the capability contract (`name`, schemas, `sideEffect`, `riskLevel`, `requiresApproval`, `entry`).

## Step 2: Validate Skill

```bash
pnpm exec yutra skill validate examples/ecommerce-support/skills/query-shipping
```

Expected: `OK`, `errors: 0`.

## Step 3: Inspect as Action

```bash
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
```

Focus on:
- `implementation.type: skill`
- `implementation.skillName`
- `implementation.entry`

## Step 4: Run Skill-based Ecommerce Agent

```bash
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
```

Expected: run status `completed`.

## Step 5: Verify Trace Contains Skill Execution Evidence

```bash
pnpm exec yutra trace list --trace-file .yutra/traces/skill-based-ecommerce.jsonl
```

Then inspect the run and confirm payload fields in `action.started` / `action.succeeded`:
- `implementationType: "skill"`
- `skillName`
- `inputValidated`
- `outputValidated`

## Step 6: Run Handoff Case and Export Audit Bundle

```bash
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/handoff-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
pnpm exec yutra trace export <handoff-runId> --trace-file .yutra/traces/skill-based-ecommerce.jsonl --out demo-artifacts/skill-based-ecommerce-handoff.json
```

Expected: a real audit bundle at `demo-artifacts/skill-based-ecommerce-handoff.json`.

## Re-generate Artifacts

- Trace source: `.yutra/traces/skill-based-ecommerce.jsonl`
- Shared demo artifact: `demo-artifacts/skill-based-ecommerce-handoff.json`

## Step 7: Conclusion to Present

Skill is capability metadata + entry implementation.
Yutra places that capability into a governed chain:
Action -> State -> Policy -> Runtime -> Trace/Audit evidence.
