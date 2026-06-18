# Pack Config Core

`@yutra/pack-config-core` defines the public contract for the vNext Business Rule Configuration layer.

Pack Config sits before DSL:

```text
Natural Requirement
-> AI Draft Config
-> Pack Config JSON
-> Rule Compiler
-> DSL / Policy / Templates / Tests / Trace Expectations
-> Canonical IR
-> Runtime
```

This package only defines and validates Pack Config. It does not compile DSL and does not connect Runtime.

## What It Provides

- `PackConfig` schema
- `ConfigField` provenance model
- first field type library
- request-resolution public base field definitions
- demo-only sample config
- publish gate validation
- deterministic config fingerprint
- human-readable explain output

## Relationship to DSL / Rule Compiler / Runtime

Pack Config is a product-layer contract.

- Rule Compiler will later compile Pack Config into DSL, policy, templates, tests, and trace expectations.
- DSL remains the deterministic intermediate execution asset.
- Runtime still executes canonical IR.

Current boundary:

- no Rule Compiler
- no DSL generation
- no policy/template/test generation
- no Runtime execution
- no Studio UI integration

## ConfigField Provenance

Every configurable field records where it came from:

- `defaultFromPack`: supplied by the public pack baseline.
- `inferredByAI`: drafted by AI and must be confirmed.
- `confirmedByUser`: explicitly confirmed by a human.
- `migrated`: migrated from another config or version.
- `requiredButMissing`: required input not yet provided.

Governance rules:

- `inferredByAI` must set `needsConfirmation=true`.
- `requiredButMissing` must not contain a value.
- prod-like and production publish gates block unconfirmed AI fields.
- missing required fields always block publish.

## Publish Gate

`canPublishPackConfig(config)` checks whether a config can be published.

It blocks:

- `publishable=false`
- `requiredButMissing`
- unconfirmed AI fields in `prod-like` or `production`
- `containsSecret=true`
- `containsRealEndpoint=true`
- `real_placeholder` adapters in `prod-like` or `production`

Dev and demo configs may still carry warnings so users can see what must be confirmed later.

## Request-resolution Base Config

The package includes public base field definitions for `request-resolution`.

Fields cover:

- capabilities: order lookup, shipping lookup, refund request, return request, handoff
- refund policy basics
- handoff policy basics
- response style basics

These are public base fields only. They are not customer SOP, not a complete industry rule table, and not a commercial delivery template.

## Sample Config

`REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG` is a mock/demo sample.

It uses:

- `environment=demo`
- mock adapters only
- `containsRealEndpoint=false`
- `containsSecret=false`
- demo values only

It does not contain customer names, real endpoints, customer credentials, private adapter configs, or commercial SOP.

## Fingerprint

`createPackConfigFingerprint(config)` returns a deterministic `sha256:<hash>` string.

The helper excludes volatile field metadata such as `updatedAt` and `metadata.generatedAt`.

This prepares for future audit binding. It does not write trace events.

## Current Non-goals

`@yutra/pack-config-core` does not:

- compile DSL
- generate `agent.yutra.yaml`
- generate `policy.yaml`
- generate templates
- generate tests
- generate trace expectations
- connect Runtime
- connect Studio UI
- include customer SOP
- include real adapter mappings
- include real endpoints or secrets
- include pricing, UAT, rollout, or delivery playbooks

## Next Step

P6-04 should implement the first Rule Compiler contract:

```text
Pack Config -> DSL / Policy / Templates / Tests / Trace Expectations
```
