# Intake Collector Basic

`intake-collector` is the fourth Product Archetype with a complete public Core chain. Its primary output is a structured intake record.

The basic flow is:

```text
collect missing information
-> validate fields
-> evaluate completeness
-> clarify, complete, stop safely, or hand off
```

It is not a knowledge-answering archetype and does not resolve the downstream request. It prepares a validated, explicitly confirmed intake record for later processing.

## Supported Chain

The current implementation includes:

- Pack Config contract and archetype-specific validation
- ConfigField provenance
- Rule Impact metadata
- deterministic Rule Compiler
- `yutra compile`
- six canonical compiler artifacts
- a demo/mock Pack Config example
- Creator Workbench business-rule editor, Compile Preview, Rule Impact, and Certification Readiness

Creator Workbench is enabled for `intake-collector`. It uses the existing in-memory Compile Preview endpoint and remains not connected to Runtime.

## Pack Config

The public contract covers:

- capabilities: field collection, field validation, missing-field detection, duplicate check, confirmation, and handoff
- intake policy: required fields, clarification budget, incomplete handling, invalid-field handling, and duplicate handling
- validation policy: confirmation before completion, unknown-field rejection, text trimming, and partial-draft policy
- generic response style options

The built-in ID is `intake-collector:basic-demo`.

## Rule Impact

The archetype-specific metadata explains how these fields affect generated behavior:

- `requiredFields` affects the missing-fields Guard, completion transition, test cases, and completeness Trace expectation.
- `maxClarificationRounds` affects the clarification budget and handoff/stop boundary.
- `incompleteStrategy` selects ask, handoff, or stop-with-reason transitions.
- `invalidFieldStrategy` selects correction or handoff after field validation failure.
- `duplicateStrategy` selects confirm, handoff, or safe rejection.
- `requireConfirmationBeforeComplete` controls the confirmation Guard and completion transition.

These definitions remain isolated from the existing request-resolution, approval-decision, and knowledge-answering metadata.

## Compiler Artifacts

The deterministic compiler produces:

1. `agent.yutra.yaml`
2. `policy.yaml`
3. `adapter.config.json`
4. `templates.json`
5. `test-cases.json`
6. `trace.expectation.json`

The DSL includes explicit collection, validation, missing-field, duplicate, clarification, confirmation, completion, handoff, and stopped states. Missing, invalid, duplicate, exhausted-budget, and ambiguous paths remain fail-closed.

## CLI

```bash
pnpm exec yutra compile examples/intake-collector-basic/pack.config.json --out .tmp/intake-collector --dry-run
pnpm exec yutra compile examples/intake-collector-basic/pack.config.json --out .tmp/intake-collector --force
pnpm exec yutra dsl inspect .tmp/intake-collector/agent.yutra.yaml
```

The compile command only exports inspectable artifacts. It does not run the generated Agent.

## Creator Workbench

Studio exposes `intake-collector` as the fourth enabled Product Archetype. The form supports capabilities, intake policy, validation policy, and response style fields from the existing Pack Config contract.

`requiredFields` is restricted to `topic`, `request_summary`, and `context_note`; the UI does not accept arbitrary field names or real field values. Each editable rule retains ConfigField provenance and reuses the Core Rule Impact metadata.

Compile Preview returns the same six canonical artifacts, warning list, compile report, and Certification Readiness. The generated `agent.yutra.yaml` can be sent manually to the DSL Editor, but Studio does not inspect, apply, or run it automatically.

## Public Boundary

This implementation is demo/mock only:

- no real personal data fields or records
- no customer form
- no database or CRM/ERP connection
- no real endpoint or secret
- no production collection workflow
- Creator Workbench does not run Runtime automatically
- no Runtime execution or production collection integration

The example uses only generic fields such as `topic`, `request_summary`, and `context_note`.
