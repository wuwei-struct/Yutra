# Changelog

## Unreleased

No unreleased changes are recorded after the vNext Preview release preparation.

## [0.3.0-vnext-preview.1] - 2026-07-16

### Included

- README positioning update to open-source governed Agent Creation & Execution Framework.
- Public exposure cleanup for ecommerce delivery-oriented public docs.
- Project charter mojibake fix.
- `@yutra/archetype-core`.
- `@yutra/pack-config-core`.
- `@yutra/rule-compiler`.
- Rule Compiler CLI.
- Creator Workbench Compile Preview.
- Rule Impact Explanation.
- Certification Readiness Preview.
- Manual Run Preview Evidence.
- approval-decision second archetype support.
- knowledge-answering third archetype core and Studio UI support.
- Three demo-enabled product archetypes in Creator Workbench: request-resolution, approval-decision, and knowledge-answering.
- Archetype taxonomy metadata in `@yutra/archetype-core`.
- Taxonomy-aware Creator Workbench archetype selection.
- vNext Preview release candidate checklist.
- Knowledge-answering Run Preview Action Closure alignment.
- Three-archetype RC smoke evidence.

### Intentionally Excluded

- npm package publication.
- Real customer API integration.
- Real LLM, RAG, or knowledge base integration.
- Production readiness or production certification claim.
- Marketplace, remote registry, hosted console, or multi-tenant SaaS.
- Customer-specific SOP, pricing, proposal, UAT, rollout, or delivery playbooks.

## v0.2.0-rc.1

### Included

- Skill-based runtime milestone for open source release readiness.
- `@yutra/skill-core` with manifest, loader, validator, and local registry.
- Skill CLI (`skill list`, `skill validate`, `skill inspect`, `--as-action` bridge view).
- Skill to Action adapter and runtime skill execution path.
- Ecommerce skill pack variant (`agent.skill.yutra.yaml`) and certification coverage.
- Skill-focused release docs:
  - `docs/skill-based-runtime.md`
  - `docs/skill-based-demo-path.md`
  - `docs/skill-certification-summary.md`
  - `docs/release-notes-v0.2.0-rc.1.md`

### Quick Commands

```bash
pnpm install
pnpm verify
pnpm certify
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills
```

### Intentionally Excluded

- Marketplace and remote registry.
- Install workflow and skill store.
- Sandbox and cloud execution.
- Real customer API integration.
- Runtime control-loop or trace event model rewrite.

### Known Limitations

- Local skills only.
- Local runtime execution only.
- Minimal schema validation.
- No sandbox isolation.

## v0.1.0-rc.1

### Included

- Execution standard (`@yutra/spec`) with schemas and fixtures.
- DSL loader/parser/validator (`@yutra/dsl`) for YAML/JSON.
- Execution-first runtime (`@yutra/runtime`) with deterministic loop.
- Trace core (`@yutra/trace`) with memory/jsonl storage and reader.
- CLI (`@yutra/cli`) with validate/run/trace list/show.
- Interface layers (`tool-core`, `knowledge-core`, `llm-core`) with minimal reference implementations.
- Examples matrix (`it-helpdesk`, `ecommerce-support`, `approval-agent`).
- Minimal three-column trace viewer (`@yutra/viewer`).

### Intentionally Excluded

- Chat UI, admin backend, multi-tenant capabilities.
- New CLI command surface beyond current 4 commands.
- Remote trace service, metrics dashboard, platform connector marketplace.
- Cloud LLM provider integration and LLM-first orchestration.

### Known Limitations

- Several provider/tool implementations are stubs by design.
- Viewer currently supports local JSONL loading only.
- No production deployment/security hardening guarantees.
