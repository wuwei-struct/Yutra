# Diagnostic Resolution Basic

`diagnostic-resolution` is the fifth Product Archetype with a complete public Core chain. Its primary output is a diagnostic disposition: an explicit diagnosis plus remediation or escalation disposition.

The basic flow is:

```text
collect generic signals
-> validate signals and evidence
-> run mock diagnostic checks
-> evaluate diagnosis
-> suggest or simulate safe remediation
-> verify
-> complete, request more signals, stop safely, or hand off
```

It differs from `knowledge-answering`, which returns governed knowledge; `request-resolution`, which resolves an already-defined request; and `intake-collector`, which produces a structured intake record without making a diagnostic judgment.

## Supported Chain

The current implementation includes:

- Pack Config contract and archetype-specific validation
- ConfigField provenance
- archetype-isolated Rule Impact metadata
- deterministic Rule Compiler
- `yutra compile`
- six canonical compiler artifacts
- a generic demo/mock Pack Config example

Creator Workbench is enabled for `diagnostic-resolution`, while Runtime remains disconnected. Studio edits only the existing generic demo fields, compiles artifacts in memory, and requires an explicit manual action to send `agent.yutra.yaml` to the DSL Editor.

The dedicated editor exposes the Core allowlist for `requiredSignals`; it does not accept arbitrary device, shell, API, endpoint, or credential input. Rule Impact, compile warnings, the six artifacts, and Certification Readiness use the existing Core and shared Compile Preview path. Sending DSL does not automatically Inspect, Apply, or Run.

## Pack Config

The built-in ID is `diagnostic-resolution:basic-demo`. Its contract covers:

- signal collection, diagnostic checks, branch diagnosis, remediation suggestion, safe mock remediation, verification, and handoff capabilities
- allowlisted `symptom_summary`, `environment_hint`, and `observed_behavior` demo signal identifiers
- diagnostic round and remediation attempt budgets
- explicit inconclusive, check-failure, and remediation strategies
- evidence and completion-verification requirements
- generic response style

Validation rejects unknown signal identifiers, invalid strategy values, and out-of-range budgets.

## Rule Impact

Eight Core Rule Impact definitions explain how configuration affects generated behavior:

- `requiredSignals` affects the missing-signal Guard, collection path, tests, and Trace expectations.
- `maxDiagnosticRounds` affects the diagnostic budget and exhaustion fallback.
- `inconclusiveStrategy` selects request-more-signals, handoff, or stopped paths.
- `checkFailureStrategy` selects retry, handoff, or stopped paths.
- `remediationStrategy` selects suggestion-only, mock-safe remediation, or handoff.
- `maxRemediationAttempts` affects the remediation budget and fallback.
- `requireEvidenceBeforeDiagnosis` controls the evidence Guard before diagnosis.
- `requireVerificationBeforeComplete` controls the verification Guard before completion.

The metadata remains isolated from the four existing compiler-supported Product Archetypes.

## Compiler Artifacts

The deterministic compiler produces six canonical compiler artifacts:

1. `agent.yutra.yaml`
2. `policy.yaml`
3. `adapter.config.json`
4. `templates.json`
5. `test-cases.json`
6. `trace.expectation.json`

The DSL exposes collection, validation, diagnostic check, diagnosis evaluation, clarification, remediation suggestion, mock-safe remediation, verification, completion, handoff, and stopped states. Missing evidence, unknown diagnosis, failed checks, and exhausted budgets remain explicit and fail-closed.

`perform_mock_safe_remediation` is fixed at `sideEffect=none`. It only represents a deterministic demo control path and does not access or change a real system.

## CLI

```bash
pnpm exec yutra compile examples/diagnostic-resolution-basic/pack.config.json --out .tmp/diagnostic-resolution --dry-run
pnpm exec yutra compile examples/diagnostic-resolution-basic/pack.config.json --out .tmp/diagnostic-resolution --force
pnpm exec yutra dsl inspect .tmp/diagnostic-resolution/agent.yutra.yaml
```

The CLI exports inspectable artifacts. It does not execute the generated Agent.

## Public Boundary

This implementation is generic demo/mock only:

- no real diagnostics or production remediation
- no real device, account, customer, or personal signal identifiers
- no device access or system mutation
- no shell execution
- no real endpoint, external API, credential, LLM, RAG, or knowledge base
- no Runtime execution
- no automatic Inspect, Apply, Run, or Runtime integration

It does not represent production diagnostic or repair capability.
