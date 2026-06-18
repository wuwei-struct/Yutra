# vNext Roadmap

This roadmap defines the next product direction after the current Skill-based Runtime and Studio foundation.

It is intentionally staged. The next step should not attempt to implement all archetypes or a full creator platform at once.

## U0: Strategic Closure

Goal: align product direction before implementation.

Scope:

- vNext charter
- archetype library definition
- non-goal list
- rule compiler direction
- Creator Workbench boundary

Exit criteria:

- vNext docs exist.
- The team agrees that customers configure business rules, not raw DSL by default.
- Runtime remains execution-first.

## U1: Archetype Standard v0.1

Goal: define reusable archetype metadata and composition rules.

Current status: `@yutra/archetype-core` provides the first public base manifest, validation, explain, and local registry model for the 10+4 archetypes.

Scope:

- 10+4 archetype manifests
- capability atom model
- cross-cutting archetype composition model
- basic archetype validation

Non-goal:

- no full visual designer
- no marketplace
- no industry-specific hard-coded platform

## U2: Business Rule Configuration Layer

Goal: define Pack Config as the customer-facing configuration model.

Current status: `@yutra/pack-config-core` provides the first Pack Config contract, field provenance, validation, publish gate, fingerprint, and demo-only request-resolution sample. Rule Compiler is still not implemented.

Scope:

- Pack Config schema
- UI Schema
- field type library
- rule explanation metadata
- mapping from rule fields to generated assets

Field types:

- Boolean
- Enum
- Multi-select
- Number
- Text
- Condition Table
- Priority
- Mapping

## U3: Rule Compiler v0.1

Goal: compile Pack Config into executable and certifiable assets.

Scope:

- config -> `agent.yutra.yaml`
- config -> `policy.yaml`
- config -> `adapter.config.json`
- config -> `templates.json`
- config -> `test-cases.json`
- config -> `trace.expectation.json`

Compiler must be deterministic. AI may draft configuration but must not directly control runtime execution.

## U4: Request-resolution Creator MVP

Goal: prove the creation layer using a public request-resolution demo pack without exposing customer-ready SOP or implementation playbooks.

Focus:

- archetype: `request-resolution`
- representative paths: normal handling, boundary handling, exception handling, and handoff
- generic business rules for eligibility, thresholds, source-record status, adapter failure, and handoff
- adapter contract concepts
- run preview and certification

Non-goal:

- no full industry SaaS
- no real customer-specific integration in the first MVP

## U5: AI Draft Generation

Goal: generate Pack Config drafts from natural requirements.

Scope:

- natural requirement -> Pack Config draft
- diff against current config
- validation issues
- explanation of generated rules
- no auto-run without user confirmation

AI remains an authoring assistant, not the runtime controller.

## U6: Trace Preview + Certification

Goal: make preview and evidence central to creation.

Scope:

- preview page
- trace timeline
- expected state/action path
- test case execution
- certification summary
- audit bundle export

Every generated agent must be previewable and certifiable.

## U7: Second Archetype Replication

Goal: prove that Creator Workbench is not a single ecommerce hard-code.

Priority target:

- `approval-decision` creator

Expected proof:

- same Pack Config pattern
- same compiler pattern
- different archetype and business rule set
- approval / HITL / policy behavior remains auditable

## First Priority Archetypes

The first stage should prioritize only five archetypes:

1. `request-resolution`
2. `approval-decision`
3. `knowledge-answering`
4. `intake-collector`
5. `human-handoff`

Reason:

- They map to existing packs and governance/HITL capabilities.
- They cover the most common business creation needs.
- They are enough to prove the model before expanding to all 10+4.

## Explicit Deferrals

Do not start with:

- all 14 archetypes implemented
- visual drag-and-drop canvas
- marketplace
- remote registry
- multi-tenant SaaS
- real customer API integration as the core abstraction
- LLM-first orchestration
