# Yutra v0.2.0-rc.1 — Skill-based Agent Execution Runtime

## What's New

- `@yutra/skill-core`
- Skill manifest / loader / validator
- Skill Registry + CLI
- Skill to Action Adapter
- Runtime Skill Execution
- Ecommerce Skill Pack
- Trace / Audit evidence
- Certification

## What Is Intentionally Excluded

- Marketplace
- Remote registry
- Install workflow
- Sandbox
- Skill store
- Real customer API integration

## Quick Commands

```bash
pnpm install
pnpm verify
pnpm certify
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra skill validate examples/ecommerce-support/skills/query-shipping
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills
```

## Known Limitations

- Local skills only
- Local runtime execution only
- No sandbox
- No real customer APIs
- Minimal schema validation
