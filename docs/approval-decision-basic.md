# Approval-decision Basic Demo

`approval-decision` is the second public archetype core chain after `request-resolution`.

It demonstrates that Yutra vNext is not hard-coded to a single ecommerce/request-resolution path.

## Current Support

The public demo chain currently includes:

- Pack Config contract in `@yutra/pack-config-core`
- Rule Impact metadata
- deterministic Rule Compiler support in `@yutra/rule-compiler`
- CLI compile/export support
- six demo/mock artifacts:
  - `agent.yutra.yaml`
  - `policy.yaml`
  - `adapter.config.json`
  - `templates.json`
  - `test-cases.json`
  - `trace.expectation.json`

Example:

```bash
pnpm exec yutra compile examples/approval-decision-basic/pack.config.json --out .tmp/approval-decision-basic --dry-run
pnpm exec yutra compile examples/approval-decision-basic/pack.config.json --out .tmp/approval-decision-basic --force
```

## Current Boundary

This is public demo/mock standard-layer support only.

It does not:

- enable Creator Workbench UI for `approval-decision`
- connect Runtime
- automatically execute generated DSL
- execute test cases
- run official certification as a user action
- claim production readiness
- save or publish an agent
- include real approval system adapters
- include real endpoints, credentials, or organization data
- include real approval hierarchy
- include customer SOP
- include pricing, UAT, rollout, or delivery playbooks

## Demo Fields

The public Pack Config covers generic fields:

- request intake
- evidence collection
- eligibility check
- risk review
- approval decision
- handoff
- low-risk threshold
- missing evidence strategy
- high-risk strategy
- policy conflict strategy
- timeout strategy
- response style

These fields are intentionally abstract. They are not a real company approval policy or a customer-ready implementation template.

## Why This Matters

The second archetype proves the shared creation pattern:

```text
Archetype
-> Pack Config
-> Rule Impact metadata
-> Rule Compiler
-> CLI artifacts
```

The same contract shape can support a different business behavior structure without changing Runtime, Trace, Skill, or DSL semantics.
