# Slot Outcome Projection and Side-effect Alignment

## Why `finalState=done` Is Not a Scenario Outcome

The single-Agent Runtime reports execution status and a final DSL state. A
successful canonical Slot commonly reports:

```text
runtime status = completed
Runtime finalState = done
```

Those values confirm execution completion. They do not identify the semantic
Slot outcome required by a Scenario Route. Examples of Semantic Slot outcome
are `policy_clarification_required`, `authorization_decision_available`, and
`primary_acceptance_satisfied`.

The Adapter and future Engine do not infer a semantic outcome from
`finalState=done`, an Action name, Route order, or execution order.

## Explicit Projection Contract

Each Orchestrator Slot carries a `SlotOutcomeProjectionContract` with:

- a Slot-specific `slotId`;
- explicit rules with unique integer priority;
- safe conditions over Runtime status, Runtime final state, allowlisted output
  markers, control signals, or safe error codes;
- an outcome that must be listed in the Slot `acceptedOutcomes`;
- `fallback=fail_closed`.

Every accepted outcome must be covered, and extra outcomes are rejected.
Output paths reject `__proto__`, `prototype`, and `constructor`. Scripts,
regular expressions, dynamic expressions, `eval`, and arbitrary functions are
not supported. No match, an unknown marker, or an ambiguous highest-priority
match fails closed.

`evaluateSlotOutcomeProjection()` is pure and deterministic. It does not read
Trace data, invoke handlers, execute Routes, or mutate its inputs.

## Projection Evidence

The Runtime Adapter returns evidence rather than a Scenario semantic outcome:

```text
runtimeStatus
runtimeFinalState
outputMarkers["slotResult.semanticMarker"]
controlSignal
errorCode
```

Only allowlisted scalar output markers are copied. The Adapter returns
evidence; the future Engine owns Outcome Projection and Route Selection. The
existing `outcome` field remains runtime-native and must not be interpreted as
a Scenario outcome.

The deterministic demo Action handlers produce a small envelope:

```text
slotResult.semanticMarker
slotResult.controlSignal
payload
```

The marker comes from the explicit handler result, not from Adapter inference.
It contains generic demo values only.

## Five Canonical Slot Profiles

The explicit Compile Profiles cover:

- `complaint_resolution`: policy clarification, compensation authorization,
  human review, and primary acceptance;
- `policy_explanation`: policy explanation available;
- `compensation_decision`: authorization decision available;
- `refund_resolution`: authorization required, human review, and primary
  acceptance;
- `refund_authorization`: authorization decision available.

The Projection Contracts are included in the Orchestrator Document,
deterministic Orchestrator hash, and Slot provenance IDs. Each projected
outcome has an explicit candidate Route. This iteration validates the
alignment but does not execute Routes or apply Bindings.

## Side-effect Enforcement Layers

### Classification Coverage Preflight

Before Runtime invocation, Action Closure verifies resolvability and
Classification Coverage Preflight verifies that every referenced Action has
an explicit side-effect classification. It reports the potential maximum
level. An unknown or unclassified Action fails closed.

An unexecuted high-risk Action does not block a low-risk path merely because
it exists in the complete Slot Action Closure.

### Actual Dispatch Enforcement

The Adapter wraps the explicit Action Registry. Immediately before the
selected Action handler is called, Actual Dispatch Enforcement compares that
Action's declared classification with the invocation maximum. An
unclassified or over-limit Action fails closed before the handler. The
handler invocation count remains zero, and no automatic retry or fallback
handler is used.

Only an actually dispatched Action consumes the invocation side-effect
boundary. The Adapter does not lower real external, financial, or approval
classifications.

## Control Signals and External Effects

The demo `handoff_required` and `fail_closed` Actions are control-only
signals. They update in-memory Slot output, do not create a ticket, send a
message, write a case, or call an external system, and report
`externalEffectsOccurred=false`.

A future real dispatch such as creating a handoff ticket must use a distinct
Action ID with an explicit `external` or higher classification. A real
external Action is never reclassified as `none`.

## Alignment Smoke

Run:

```bash
pnpm --filter @yutra/scenario-orchestrator-runtime-demo smoke:alignment
```

The smoke invokes one representative path for each canonical Slot and reports
only the Slot ID, Runtime status/final state, semantic marker, projected
outcome, matched projection ID, candidate Route count, and external-effect
flag. It does not print full input, output, DSL, handlers, Trace, or private
configuration.

## Current Boundary

This iteration does not implement a Scenario Orchestrator Engine, does not
execute Routes, does not apply Composition Bindings, does not declare a
Scenario completed, and does not add Studio Run. It does not change Runtime,
Agent DSL, Trace, or single-Archetype Compiler semantics.

P6-11D.2 now provides a separate
[In-memory Scenario Orchestrator Engine](./in-memory-scenario-orchestrator-engine.md)
that consumes these explicit semantic outcomes in tests and smoke. The
Projection and dispatch-time side-effect contracts remain unchanged.
