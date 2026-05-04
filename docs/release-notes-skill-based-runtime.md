# Yutra Skill-based Runtime Milestone

## What's New

- `@yutra/skill-core`
- Skill manifest (`skill.json`) contract
- Skill registry and local discovery
- Skill CLI (`list` / `validate` / `inspect`)
- Skill to Action adapter
- Runtime skill execution (`implementation.type = "skill"`)
- Ecommerce skill pack variant (`examples/ecommerce-support/agent.skill.yutra.yaml`)

## What's Intentionally Excluded

- Marketplace
- Remote registry
- Install workflow
- Sandbox
- Real customer API integration
- Skill store

## Quick Commands

```bash
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra skill validate examples/ecommerce-support/skills/query-shipping
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills
pnpm exec yutra trace export <runId> --trace-file .yutra/traces/skill-based-ecommerce.jsonl --out .yutra/audit/skill-based-ecommerce-handoff.json
```

## Why It Matters

Generic skills can be called.
Yutra can prove under which state, rule, and permission context a skill was executed.
That is the key difference between "call capability" and "controlled execution standard."
