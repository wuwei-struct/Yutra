# In-memory Scenario Orchestrator Runtime Adapter

`@yutra/scenario-orchestrator-runtime-demo` is a deterministic, mock-only
implementation of the one-Slot boundary defined by
`@yutra/scenario-orchestrator-runtime-contract`.

```text
namespaced Slot invocation
-> request and budget validation
-> in-memory artifact lookup and hash verification
-> Agent DSL validation
-> Action Closure and side-effect preflight
-> idempotency and single-concurrency gate
-> existing single-Agent Yutra Runtime
-> normalized Slot result
-> redacted Trace Parent and Audit references
```

The Adapter executes one Slot. It is not a Scenario Orchestrator Engine. It
does not select a Scenario Route, does not apply Composition Bindings, does
not maintain a Scenario call stack, and does not declare the Scenario
completed.

## Descriptor and Factory

`YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1` is `available` only for this local
demo implementation. It supports Agent DSL `0.1.0` and the preview
`single_active_slot_call_return` contract. Its public exposure is
`demo_only`.

The factory requires explicit dependency injection:

- an `InMemorySlotArtifactStore`;
- an explicit Runtime `ActionRegistry`;
- an explicit Action side-effect resolver;
- an optional Runtime factory and deterministic clock for tests.

There is no default wildcard Action handler, global registry, environment
lookup, filesystem lookup, or network transport. The separate
`YUTRA_RUNTIME_ADAPTER_CONTRACT_V1` remains `contract_only`; this demo package
does not represent production Runtime support.

## In-memory Artifact Store

The store keeps only:

- `slots/<slotId>/agent.yutra.yaml`;
- its canonical SHA-256 hash;
- the bound config hash;
- the Archetype ID;
- the Agent DSL version.

It does not store Pack Config, adapter config, credentials, or knowledge
content. Paths are normalized to `/`, parent traversal is rejected, and a
different artifact cannot replace an existing Slot path. Nothing is written
to disk.

## Artifact Hash Verification

Registration recomputes the Agent artifact hash. Invocation verifies the
requested artifact path, artifact hash, config hash, Archetype ID, and store
record again before Runtime starts. A mismatch fails closed and no partial
result is returned.

## Action Closure Preflight

The Adapter uses the public DSL parser, normalization, and validation APIs,
then extracts every Action referenced by the Slot states. It compares those
IDs with the injected explicit registry and returns deterministic referenced,
resolvable, and unresolved sets.

An unknown Action makes the closure incomplete. The Adapter stops before
Runtime and never substitutes a universal fallback.

## Side-effect Preflight

Every referenced Action needs an explicit side-effect classification. Unknown
classification fails closed, and the injected classification cannot lower the
Agent DSL declaration. The request maximum is enforced. This demo permits
`none`, `read`, and explicitly classified mock `external` Actions so canonical
handoff branches remain closed; it rejects `write`, `financial`, and
`approval`.

The fixture's `external` handlers only return deterministic mock handoff
metadata and do not perform an external effect. The Adapter does not infer
risk from an Action name and does not perform real side effects.

## Idempotency Ledger

The in-memory ledger binds the contract idempotency key to a canonical request
fingerprint:

- identical concurrent calls share one execution Promise;
- completed or failed calls replay the same logical result;
- the Runtime invocation count does not increase on replay;
- the same key with a different request fails with an explicit conflict.

The ledger is process-local and non-persistent. It is not a production
idempotency service and does not enable automatic retry.

## Timeout and Concurrency

Request timeout and step budgets are passed to the existing Runtime as
`actionTimeoutMs`, `maxDurationMs`, and `maxSteps`. Runtime timeout errors are
normalized to `timed_out`, never `completed`.

`maxConcurrentSlotInvocations=1`. A second different invocation receives a
stable busy error. An identical idempotent invocation may share the active
Promise. Cancellation and snapshot/resume remain unavailable.

## Context and Slot Result

Input is accepted only in:

```text
slots.<slotId>.input
```

The Adapter recalculates its byte length and supplies only that value to the
single-Agent Runtime Context. Output is a bounded, redacted summary in:

```text
slots.<slotId>.output
```

The output records the explicit Runtime final state and
`scenarioCompleted=false`. The Adapter does not write `scenario.shared`,
`scenario.output`, or another Slot namespace, and does not deep-merge Context.

Runtime status normalization is:

- `completed` -> Slot `completed`;
- `handoff` -> Slot `handoff_required`;
- timeout -> Slot `timed_out`;
- other failure -> Slot `failed`.

The Runtime final state is the Slot outcome. It is never rewritten as
`$scenario_done`.

## Trace Parent Sidecar

The Adapter records a sidecar correlation from the Orchestrator invocation to
the existing Runtime run:

- Orchestrator, Composition, Slot, invocation, and parent span IDs;
- invocation index;
- Agent artifact and config hashes;
- Runtime run ID.

It does not alter existing Trace events, copy the complete Trace, or emit
`orchestrator.*` events. Route and Binding events remain the responsibility of
a future Engine.

## Demo Audit Record

The in-memory Audit ledger stores a redacted summary with Runtime run ID,
Slot ID, artifact/config hashes, status, side-effect summary, and Trace range
reference. It stores no complete input, output, handler, Trace stream, adapter
configuration, or credential.

`auditReference.status=available` means only that this demo summary exists. It
is not a production persistent Audit system.

## Canonical Demo Smoke

The package smoke compiles the canonical Orchestrator previews and invokes:

- `complaint_resolution`;
- `policy_explanation`;
- `compensation_decision`;
- `refund_resolution`;
- `refund_authorization`.

Each invocation runs independently. The smoke verifies namespaced output,
Trace Parent binding, an available redacted Audit reference, and idempotent
replay without a second Runtime call. It does not choose a Route, apply a
Binding, or execute a full Scenario.

```bash
pnpm --filter @yutra/scenario-orchestrator-runtime-demo smoke
```

## Public Boundary

This package is a local, non-production reference:

- no Scenario Orchestrator Engine;
- no complete Scenario Composition execution;
- no Studio Run integration;
- no real adapter, service configuration, model, retrieval system, or
  knowledge source;
- no filesystem knowledge source or network request;
- no customer-specific data or operating procedure;
- no Runtime, DSL, Trace, Skill, Audit, Compiler, or Studio semantic change.

Studio continues to expose preview-only Orchestrator artifacts and no
Orchestrator Run. A possible next stage is an in-memory Scenario Orchestrator
Engine that consumes this one-Slot Adapter without changing its ownership
boundary.

## Explicit Outcome Evidence

The demo Adapter now returns allowlisted Projection Evidence and keeps the
runtime-native final state separate from the Semantic Slot outcome. Explicit
demo Action handlers emit `slotResult.semanticMarker`; the Adapter copies the
marker but does not choose a Route.

Side-effect checks are split into classification coverage and actual dispatch
enforcement. An unexecuted external branch no longer rejects a read-only
path. A selected over-limit Action is rejected before its handler. Demo
handoff and fail-closed Actions are control-only and report
`externalEffectsOccurred=false`; they do not represent external dispatch.

Use `pnpm --filter @yutra/scenario-orchestrator-runtime-demo smoke:alignment`
for the five-Slot safe summary. See
[Slot Outcome Projection and Side-effect Alignment](./slot-outcome-projection-and-side-effect-alignment.md).
