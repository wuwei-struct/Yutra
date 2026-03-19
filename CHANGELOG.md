# Changelog

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
