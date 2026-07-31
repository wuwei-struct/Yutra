# Scenario Run Evidence Bundle and Offline Replay

`@yutra/scenario-run-evidence-core` defines a browser-safe, redacted evidence
contract for the manual Scenario Run Preview. It records enough governed
execution metadata to validate and inspect a completed, handoff, or fail-closed
demo run without retaining full execution data.

Evidence Replay is not re-execution. It reads an existing bundle, verifies its
integrity, and rebuilds read-only views. It never calls the Runtime Adapter,
Scenario Engine, or `POST /creator/scenario-runs/preview`.

## Evidence Bundle

The strict `1.0.0-preview` bundle contains:

- evidence ID and canonical SHA-256 hash;
- run identity, status, terminal, and `scenarioCompleted`;
- Plan, Composition Bundle, Orchestrator, and Preview Bundle source hashes;
- safe Slot invocation references and projected semantic outcomes;
- Route, Binding, and Overlay decision summaries;
- an ordered safe Timeline;
- budget usage and a redacted Audit summary;
- explicit redaction and public-demo boundary flags.

It does not contain complete Scenario input/output, complete Slot output,
complete Trace/Audit records, Agent DSL, Pack Config, handlers, executable
code, Adapter configuration, credentials, secrets, endpoints, or local paths.

## Hash and Integrity

The Evidence Hash is computed over canonical JSON with `evidenceHash` itself
excluded. Object keys are sorted, arrays preserve their governed order, and
non-canonical values fail closed. Local path and UI state fields are not part
of the contract.

Validation checks:

- the strict schema and fixed public boundary;
- the canonical hash;
- contiguous Timeline indexes and Orchestrator Trace sequence;
- unique, contiguous Slot invocation references;
- Projection-to-Slot reference closure;
- budget invocation count alignment;
- run status, terminal, `scenarioCompleted`, and final event consistency.

Changing a terminal, Route, Binding, Slot reference, or any other bundle value
invalidates the hash. A caller cannot repair or silently accept damaged
evidence.

## Offline Replay

`replayScenarioEvidence(bundle)` returns:

- `replayMode=offline_evidence`;
- `runtimeExecuted=false`;
- Integrity status and blockers;
- the safe Timeline and Slot invocation tree;
- Projection, Route, Binding, and Overlay summaries;
- terminal, budget, and redacted Audit summaries.

Replay never fills missing events, guesses a terminal, reruns a Slot, applies
a Binding, evaluates an Overlay, or chooses a Route. Invalid evidence returns
an invalid Integrity Report and empty replay views.

## Runner and Studio

Builder Runner creates `evidenceBundle` server-side from the actual canonical
demo Run Result, safe Orchestrator Timeline, redacted Audit summary, and
compiler source hashes. The client cannot submit Evidence, Plan, Profile,
Route, Binding, artifact, or hash fields. Evidence creation failure fails the
Scenario Run response closed.

Studio exposes a separate Scenario Evidence & Replay Inspector. `Replay
Evidence` is disabled until a manual run succeeds. Clicking it invokes only
the browser-safe replay function; it does not make another Scenario Run API
request. Scenario or demo-case changes clear both Evidence and Replay state.

The Inspector displays Evidence ID/hash, Integrity, source provenance,
redaction, Slot tree, decisions, terminal, budget, Audit summary, and the
offline Timeline. It has no upload, save, publish, or remote-sync action.

## Canonical Demo Coverage

Evidence creation and replay cover:

- customer complaint policy explanation completion;
- customer complaint compensation completion;
- customer complaint handoff to `$human_handoff`;
- ecommerce refund authorization completion;
- Overlay deny ending at `$fail_closed` without a Slot invocation.

## Boundary

This is an in-memory, demo-only evidence summary and offline inspector. It is
not a persistence layer, run-history system, remote evidence service, or
production Audit platform. It does not connect real systems and does not
change Runtime, DSL, Trace, Compiler, or Scenario Engine execution semantics.

```bash
pnpm --filter @yutra/scenario-run-evidence-core test
pnpm --filter @yutra/scenario-run-evidence-core build
```
