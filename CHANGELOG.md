# Changelog

## Unreleased

### Added

- `@yutra/scenario-orchestrator-runtime-contract` with a fail-closed capability handshake, Slot invocation/result contracts, artifact and Action Closure binding, deterministic idempotency, Trace/Audit parent binding, side-effect limits, and an explicitly contract-only current Yutra Runtime descriptor.
- Studio Scenario Orchestrator Preview with a strict canonical-ID Runner API, explicit Compile Profile inspection, six read-only Orchestrator artifacts, Context/Route/Terminal/Trace/Provenance views, and enforced non-Agent-DSL/non-Runtime boundaries.
- `@yutra/scenario-orchestrator-compiler` with explicit Compile Profiles, canonical Composition Bundle verification, deterministic `scenario.orchestrator.yaml` contract output, six preview artifacts, closed hashes/provenance, fail-closed profile alignment, and `yutra orchestrator compile`.
- `@yutra/scenario-orchestrator-core` with a preview-only `single_active_slot_call_return` Orchestrator Document contract, isolated Slot Context, explicit call-return Routes and identity Bindings, fixed fail-closed terminals, budgets, Trace/Audit expectations, closed provenance, deterministic demo fixtures, and bilingual explanation.
- Studio Scenario Composition Workbench with canonical catalog/detail views, Composition Readiness, in-memory preview compilation, seven composition artifacts, six namespaced artifacts per Slot, and a manual single-Slot DSL Editor bridge.
- Builder Runner read-only Scenario Composition Catalog, Detail, and Compile Preview APIs with strict canonical-ID requests and fail-closed renewal churn rejection.
- `@yutra/scenario-composition-compiler` with deterministic, preview-only per-Slot Rule Compiler output, namespaced artifacts, composition relationship artifacts, hashes, and fail-closed reporting.
- `yutra composition compile` with dry-run, explicit export, JSON summary, overwrite protection, and output-path safety.
- Customer complaint and ecommerce refund Composition Compile Preview examples.
- `@yutra/scenario-composition-core` with an `orchestrated_subflows` composition-plan contract, namespaced Pack Config Slots, explicit routes and identity bindings, fail-closed precedence, and contract-layer readiness.
- `@yutra/scenario-pattern-core` with demo-only Scenario Pattern manifests, fail-closed role validation, derived composition summaries, local registry queries, and bilingual explanations.
- Built-in composition contracts for ecommerce refund, customer complaint, and renewal churn warning demos.

### Intentionally Excluded

- Orchestrator Engine or callable Runtime Adapter implementation, Slot execution, and composed Agent execution.
- Runtime-executable Orchestrator DSL, Orchestrator Runtime, or composed Agent execution.
- Executable top-level Orchestrator DSL, composed Agent execution, or generic Pack Config deep merge.
- Composition Runtime execution, Plan authoring, and executable top-level Orchestrator DSL generation.
- Pack Config merge and Compiler precedence.
- Creator Workbench or Runtime integration for Scenario Patterns.

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
