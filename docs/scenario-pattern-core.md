# Scenario Pattern Core

`@yutra/scenario-pattern-core` is the structured contract for the third layer of Yutra's archetype taxonomy:

```text
Behavior Primitives
-> Product Archetypes
-> Scenario Patterns
```

A scenario pattern is a composition preset, not a new archetype. It describes which Product Archetype owns the primary output, which Product Archetypes provide supporting outputs, and which Cross-cutting Archetypes add governance or collaboration concerns.

The next contract layer is a Scenario Composition Plan: an explicit, namespaced binding of a Pattern to Pack Config Slots, routes, data bindings, and fail-closed precedence. See [Scenario Composition Contract](./scenario-composition-contract.md). The Pattern package remains independent and does not contain execution or merge semantics.

场景组合范式是母型组合预设，不是新的主母型。它描述主产出由哪个产物型主母型负责、哪些产物型主母型提供辅助产出，以及哪些横切母型提供治理或协同能力。

## Manifest Contract

Each `ScenarioPatternManifest` includes:

- `schemaVersion` and `version`
- a stable `patternId`
- localized `name`, `summary`, `compositionRationale`, and `acceptanceSummary`
- `primaryArchetypeId`
- `supportingArchetypeIds`
- `crossCuttingArchetypeIds`
- `triggerPattern`
- generic `scenarioTags`
- a fail-closed `publicExposure` block

The contract reuses IDs and taxonomy metadata from `@yutra/archetype-core`. It does not maintain a second archetype ID system.

## Composition Roles

### Primary Product Archetype

The primary archetype owns the scenario's main output and acceptance object. `primaryOutput` and `acceptanceObject` are derived from this archetype's taxonomy metadata.

### Supporting Product Archetypes

Supporting archetypes describe auxiliary outputs required by the scenario. They do not replace the primary acceptance object.

### Cross-cutting Archetypes

Cross-cutting archetypes add governance, collaboration, adapter-contract, or feedback concerns. They are not treated as standalone scenario outputs.

## Built-in Demo Patterns

### `ecommerce-refund-demo`

- Primary: `request-resolution`
- Supporting: `approval-decision`
- Cross-cutting: `policy-guard`, `adapter-connector`, `human-handoff`
- Trigger: `user_request`
- Main output: a demo/mock refund handling result

It contains no live payment, order, or refund integration and no real amount policy.

### `customer-complaint-demo`

- Primary: `request-resolution`
- Supporting: `knowledge-answering`, `approval-decision`
- Cross-cutting: `human-handoff`, `policy-guard`
- Trigger: `user_request`

Customer complaint remains a Scenario Pattern rather than a new Product Archetype. The pattern describes generic explanation, request handling, authorization, and human collaboration without enterprise complaint procedures, compensation rules, or branded language.

### `renewal-churn-warning-demo`

- Primary: `monitoring-response`
- Supporting: `data-insight`, `lead-engagement`
- Cross-cutting: `human-handoff`, `feedback-optimization`
- Trigger: `system_event`

This pattern is currently contract/demo only because its participating Product Archetypes are not compiler-enabled. It does not connect to a live CRM or metrics system.

## Derived Composition Summary

`resolveScenarioPatternComposition(pattern, archetypeRegistry, supportContext)` derives:

- primary, supporting, and cross-cutting archetype summaries
- primary output and acceptance object from the primary taxonomy
- deduplicated Behavior Primitive coverage
- deduplicated governance focus
- compiler support status
- Creator Workbench support status

Support is supplied explicitly through `ScenarioPatternSupportContext`. Core metadata never guesses current Compiler or Creator Workbench support.

The calculated status is one of:

- `fully_supported`: every participating Product Archetype is enabled
- `partially_supported`: some participating Product Archetypes are enabled
- `contract_only`: none of the participating Product Archetypes are enabled

Cross-cutting Archetypes do not fail Workbench support merely because they do not have standalone creator flows.

## Registry and Explain APIs

The local deterministic registry supports:

- listing all built-in patterns
- lookup by pattern ID
- filtering by primary Product Archetype
- filtering by supporting Product Archetype
- filtering by Cross-cutting Archetype
- filtering by trigger pattern

`explainScenarioPattern` produces deterministic English or Chinese explanations covering composition roles, taxonomy-derived output and acceptance data, primitive coverage, governance focus, support status, and the demo-only boundary.

There is no remote registry or install workflow.

## Validation and Public Boundary

Validation fails closed when:

- an archetype ID is unknown
- a Product/Cross-cutting layer is used in the wrong role
- the primary archetype is repeated as supporting
- a role contains duplicate references
- the trigger is invalid
- the schema contains unsupported fields
- any public exposure risk flag is enabled

Built-in patterns are public demo/mock metadata only. They contain no customer data, real endpoint, secret, customer SOP, organization structure, or commercial delivery asset.

## Current Non-goals

This package currently does not:

- compile a composed Agent
- define composition execution order
- merge Pack Config files
- define Rule Compiler precedence
- connect Runtime
- connect Creator Workbench
- execute any business action

`@yutra/scenario-composition-core` supplies that explicit pre-compiler contract.
`@yutra/scenario-composition-compiler` can now compile eligible plans into a
preview-only Bundle of namespaced Slot artifacts and composition relationship
artifacts. It still does not generate an executable top-level Orchestrator DSL
or run a composed Agent. See
[Scenario Composition Compile Preview](./scenario-composition-compile-preview.md).
