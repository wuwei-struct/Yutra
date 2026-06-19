# Archetype Core

`@yutra/archetype-core` is the public standard-layer package for Yutra vNext archetypes.

It turns the vNext archetype library from documentation into governance-ready manifests that can be validated, registered, explained, and composed at the contract level.

This package does not compile DSL, generate Pack Config, connect Runtime, or include customer delivery assets.

## Relationship to `docs/archetype-library.md`

`docs/archetype-library.md` explains the product and authoring model for the 10+4 archetypes.

`@yutra/archetype-core` provides the TypeScript contract:

- archetype IDs
- `ArchetypeManifest`
- `CapabilityAtom`
- composition contract
- side-effect policy helpers
- builtin public base manifests
- behavior primitive taxonomy metadata
- manifest taxonomy metadata for product and cross-cutting archetypes
- local in-memory registry
- validation and explain helpers

## ArchetypeManifest

An `ArchetypeManifest` describes one base archetype.

Key fields:

- `archetypeId`: one of the 10 main or 4 cross-cutting archetype IDs.
- `archetypeVersion`: semver-like manifest version.
- `kind`: `main` or `cross_cutting`.
- `name` / `summary`: English and 中文 labels.
- `coreFlow`: short public flow outline.
- `commonScenarios`: scenario overview only.
- `commonRules`: rule type overview only.
- `capabilities`: capability atoms.
- `compatibleCrossCutting`: cross-cutting archetypes that commonly compose with this archetype.
- `taxonomy`: layer, primitive references, primary output, acceptance object, governance focus, trigger pattern, and scenario pattern hints.
- `defaultGovernance`: conservative context, guard, failure, trace, and side-effect policy defaults.
- `publicExposure`: explicit public safety declaration.

## Taxonomy Metadata

`@yutra/archetype-core` exports the public taxonomy metadata described in [Archetype Taxonomy](archetype-taxonomy.md):

- `BEHAVIOR_PRIMITIVE_IDS`
- `BUILTIN_BEHAVIOR_PRIMITIVES`
- `ArchetypeTaxonomy`
- `ArchetypeLayer`
- `TriggerPattern`

The 10 main archetypes are marked as `product_archetype`. The 4 cross-cutting archetypes are marked as `cross_cutting_archetype`.

Taxonomy metadata is contract metadata. It does not compile DSL, connect Runtime, alter trace events, or add new behavior semantics.

`publicExposure` must always declare:

```json
{
  "containsCustomerAssets": false,
  "containsRealEndpoints": false,
  "containsCommercialSop": false
}
```

## CapabilityAtom

A `CapabilityAtom` is a base capability inside an archetype.

It can describe:

- localized label
- generic business objects
- generic inputs / outputs
- common action types
- common guard types
- side-effect level
- whether policy guard or audit is required

It must not contain customer SOP, real adapter mappings, private thresholds, or commercial rule tables.

## Composition Contract

The composition contract describes how archetypes may compose without implementing orchestration.

It includes:

- `mode`: `sequence`, `nested`, `routing`, `supervision`, or `event_triggered`.
- `contextPolicy`: namespace and write-conflict policy.
- `guardPolicy`: priority and conflict handling.
- `failurePolicy`: default fail-closed behavior.
- `tracePolicy`: unified timeline policy.
- `sideEffectPolicy`: maximum automatic side-effect and policy-guard threshold.

Defaults are conservative:

- context write conflicts default to `deny`
- failures default to `fail_closed_to_handoff`
- automatic side effects default to `read` or lower
- `write` and higher side effects require policy guard

## Builtin 10+4 Archetypes

The package includes 14 public base manifests:

Main archetypes:

- `intake-collector`
- `knowledge-answering`
- `request-resolution`
- `approval-decision`
- `diagnostic-resolution`
- `process-orchestration`
- `content-production`
- `data-insight`
- `lead-engagement`
- `monitoring-response`

Cross-cutting archetypes:

- `human-handoff`
- `policy-guard`
- `adapter-connector`
- `feedback-optimization`

These are base definitions only. They are not industry packs and not customer-ready delivery templates.

## Registry Example

```ts
import { createArchetypeRegistry } from "@yutra/archetype-core";

const registry = createArchetypeRegistry();

const requestResolution = registry.get("request-resolution");
const compatible = registry.getCompatibleCrossCutting("request-resolution");
const explanation = registry.explain("request-resolution", "en");
const validation = registry.validateAll();
```

The registry is local and in-memory. It does not load from remote registries, marketplaces, or databases.

## Current Non-goals

`@yutra/archetype-core` does not:

- compile DSL
- generate Pack Config
- implement Rule Compiler
- connect Runtime
- execute agents
- include customer SOP
- include real adapters or endpoints
- include pricing, UAT, rollout, or delivery playbooks
- provide a marketplace or remote registry

## Next Steps

- P6-03: `pack-config-core`
- P6-04: Rule Compiler
