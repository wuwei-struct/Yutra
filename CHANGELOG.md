# Changelog

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
