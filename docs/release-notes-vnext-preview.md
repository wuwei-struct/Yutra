# Yutra vNext Preview Release Notes

## Positioning

Yutra is an open-source governed Agent Creation & Execution Framework.

## What Is Included In This Preview

- DSL / Canonical IR
- Reference Runtime
- Trace / Audit / Certification
- Skill Core / Skill Runtime
- Yutra Studio
- Archetype Core
- Pack Config Core
- Rule Compiler Core
- Rule Compiler CLI
- Creator Workbench Compile Preview
- Rule Impact Explanation
- Certification Readiness Preview
- Manual Run Preview Evidence
- request-resolution demo flow
- approval-decision demo flow
- knowledge-answering demo flow

## Main Creation Flow

```text
Archetype
-> Pack Config
-> Rule Compiler
-> DSL / Policy / Templates / Test Cases / Trace Expectations
-> DSL Inspect
-> Manual Run Preview
-> Trace / Audit
```

## Supported Demo Archetypes

1. request-resolution
2. approval-decision
3. knowledge-answering

## CLI Demo

```bash
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution --dry-run
pnpm exec yutra compile examples/approval-decision-basic/pack.config.json --out .tmp/approval-decision-basic --dry-run
pnpm exec yutra compile examples/knowledge-answering-basic/pack.config.json --out .tmp/knowledge-answering-basic --dry-run
```

## Studio Demo

```bash
pnpm builder:runner
pnpm builder:dev
```

Studio supports:

- select archetype
- configure demo Pack Config
- review Rule Impact
- Compile Preview
- Certification Readiness Preview
- Send `agent.yutra.yaml` to DSL Editor
- Inspect DSL manually
- Apply DSL as Run Source manually
- Run Preview manually

## Open-source Boundary

This public repo includes open-source core and mock/demo examples only.

It does not include:

- real customer adapters
- customer-specific SOP
- real endpoints
- credentials
- pricing / proposal / UAT / rollout playbooks
- production integration assets
- hosted enterprise console

## Non-goals

Yutra is not currently:

- marketplace
- remote registry
- install workflow
- multi-tenant SaaS
- customer service backend
- BI platform
- full no-code workflow platform
- real customer API integration package
- hosted enterprise console

## Known Limitations

- Creator Workbench currently supports three demo archetypes.
- Studio does not save or publish agents.
- Runtime is only executed through explicit manual Run Preview.
- Certification Readiness Preview is not official certification.
- Manual Run Preview Evidence is not production certification.
- No real customer API integration is included.

## Suggested Next Steps

- UI polish / docs polish
- third archetype validation
- release tag preparation
- private commercial implementation assets outside the public repo
