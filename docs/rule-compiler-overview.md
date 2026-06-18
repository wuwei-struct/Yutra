# Rule Compiler Overview

The Rule Compiler is a vNext deterministic module that turns Pack Config JSON into Yutra execution and delivery assets.

It is not implemented in this iteration. This document defines its scope and boundaries.

## Responsibility

The Rule Compiler does not only generate DSL.

It generates a set of executable, testable, inspectable, and deliverable assets:

```text
Pack Config JSON
-> agent.yutra.yaml
-> policy.yaml
-> adapter.config.json
-> templates.json
-> test-cases.json
-> trace.expectation.json
```

## Input

The compiler input is Pack Config JSON.

Pack Config captures:

- selected archetype
- enabled capabilities
- business objects
- business rules
- policy constraints
- adapter mappings
- templates
- expected tests

AI may draft this config, but the config must be inspected and validated before compilation.

## Outputs

### `agent.yutra.yaml`

Agent main execution structure.

It contains the generated states, actions, guards, transitions, initial state, final states, handoff states, and canonical-compatible structure.

### `policy.yaml`

Governance strategy.

It captures environment profile, allow/deny/requireHandoff rules, side-effect constraints, approval requirements, and handoff policy metadata.

### `adapter.config.json`

System integration configuration.

It maps generated actions to adapter contracts, required fields, environment settings, timeout/retry expectations, and customer replacement points.

### `templates.json`

Response template assets.

It maps business situations to response templates and channel output variants without embedding final copy into runtime logic.

### `test-cases.json`

Normal, exception, boundary, denied, and handoff test cases.

These cases are used for Run Preview, certification, and implementation acceptance.

### `trace.expectation.json`

Certification expectations for generated runs.

It should include expected status, state path, action sequence, handoff reason codes, key policy outcomes, and context keys. It should ignore volatile fields such as runId and timestamp.

## Deterministic Contract

The compiler is deterministic:

- Same Pack Config input should produce the same logical assets.
- AI can generate or revise Pack Config drafts.
- AI must not directly generate unaudited runtime control flow and execute it.
- Compiler should not invent hidden states or actions outside schema and archetype rules.
- Runtime continues to execute canonical IR.
- LLM does not control runtime state transitions.

## Example Flow

```text
autoActionEnabled = <boolean>
riskThreshold = <configured privately>
exceptionStrategy = <retry | deny | handoff>

-> eligibility guard
-> business action
-> policy threshold rule
-> handoff template
-> happy-path test case
-> boundary-path trace expectation
```

## Current Implementation Boundary

`@yutra/rule-compiler` now provides the first core implementation for the public `request-resolution` demo/mock compiler.

It can generate:

- `agent.yutra.yaml`
- `policy.yaml`
- `adapter.config.json`
- `templates.json`
- `test-cases.json`
- `trace.expectation.json`

It still does not implement:

- compiler CLI
- artifact export to disk
- Studio compiler integration
- Runtime integration
- customer SOP
- real adapters
- runtime semantic changes

See [Rule Compiler Core](rule-compiler-core.md).
