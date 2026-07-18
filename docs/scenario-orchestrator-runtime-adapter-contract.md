# Scenario Orchestrator Runtime Adapter Contract

`@yutra/scenario-orchestrator-runtime-contract` defines the future safety
boundary between a Scenario Orchestrator Engine and a Slot Runtime Adapter.
It is a contract package, not an Adapter implementation.

```text
Scenario Orchestrator Engine
-> capability and artifact preflight
-> one namespaced Slot invocation
-> existing single-Agent Runtime through a future Adapter
-> standardized Slot result and redacted references
-> Scenario Orchestrator Engine selects the next Route
```

This package defines the runtime adapter boundary only. It does not implement
or execute scenario orchestration.

本包只定义运行时适配边界，不实现也不执行场景编排。

## Why the Existing Runtime Is Not Modified

The current Yutra Runtime executes one Agent DSL state machine. Scenario
orchestration has different ownership: it maintains the active Slot, call
stack, cross-Slot bindings, terminal selection, and Scenario-level precedence.
Embedding that behavior directly in the single-Agent Runtime would mix two
execution models and weaken their independent validation and audit boundaries.

The Adapter contract therefore wraps one namespaced Slot invocation without
changing the current Runtime, Agent DSL, Trace events, Skill semantics, or
Audit implementation.

## Engine and Adapter Responsibilities

The Scenario Orchestrator Engine owns:

- Scenario state and the active Slot;
- the call stack and invocation index;
- explicit Route selection;
- identity Data Binding;
- Context namespace enforcement;
- fail-closed precedence;
- invocation budgets;
- Scenario terminals;
- Orchestrator Trace;
- handoff termination semantics.

The Slot Runtime Adapter only:

- verifies that one Slot artifact can be executed by a target Runtime;
- verifies the Agent artifact hash and config hash binding;
- performs Action Closure preflight;
- submits one redacted, namespaced Slot input;
- returns a standardized Slot outcome, output, or failure;
- returns redacted Slot Trace and Audit references;
- enforces the declared timeout and cancellation protocol;
- preserves idempotency;
- reports side effects.

The Adapter must not select a Scenario Route, mutate the call stack, write
another Slot Context, write `scenario.output`, merge Pack Configs, resume a
caller, retry a Slot, inject an adapter or credential, or treat Slot success as
Scenario completion. In particular it never emits
`orchestrator.route.selected` or `orchestrator.binding.applied`.

## Capability Handshake

`ScenarioRuntimeAdapterDescriptor` declares:

- protocol, Adapter, Orchestrator schema, execution model, and Agent DSL
  versions;
- `contract_only`, `available`, or `disabled` implementation status;
- explicit capabilities;
- input, output, timeout, and concurrency limits;
- a strict public exposure boundary.

Version `1.0.0-preview` only accepts
`single_active_slot_call_return` and
`maxConcurrentSlotInvocations=1`. Wildcard versions are forbidden. Missing
capabilities are treated as `false`.

The mandatory capabilities are:

- `slot_execution`;
- `agent_artifact_hash_verification`;
- `action_closure_preflight`;
- `idempotent_invocation`;
- `timeout_enforcement`;
- `trace_parent_binding`;
- `audit_reference`;
- `side_effect_reporting`;
- `context_redaction`.

`cancellation` and `snapshot_resume` are policy-dependent. The current
Orchestrator Contract has non-resumable handoff and no Orchestrator-level
automatic retry, so snapshot/resume is not mandatory.

## Fail-closed Compatibility

`resolveOrchestratorRuntimeCompatibility()` checks:

- `implementationStatus=available`;
- exact protocol, Orchestrator schema, and execution model support;
- every Slot Agent DSL version;
- every mandatory capability;
- every Slot Action Closure;
- each Action Closure artifact hash against the Orchestrator Slot reference.

There is no degraded execution mode. Any blocker makes the report
`incompatible`, and `currentRuntimeSupported` can only be true when the entire
report is compatible. Blockers are deterministic and ordered.

## Slot Invocation Request

`ScenarioSlotInvocationRequest` binds:

- Orchestrator run, invocation ID, invocation index, and idempotency key;
- Orchestrator, Composition, Slot, and Product Archetype identity;
- `slots/<slotId>/agent.yutra.yaml`, its hash, and the config hash;
- the Orchestrator Trace parent sequence and span;
- `slots.<slotId>.input`;
- timeout and Runtime step budgets;
- maximum allowed side-effect level;
- one invocation attempt with Orchestrator retry disabled.

The input must be redacted, finite, acyclic JSON. It cannot contain executable
functions, scripts, adapter configuration, credentials, or external service
configuration. It cannot write `scenario.output` or another Slot namespace.

## Slot Invocation Result

`ScenarioSlotInvocationResult` has one status:

- `completed`;
- `handoff_required`;
- `failed`;
- `cancelled`;
- `timed_out`.

A completed Slot requires an outcome and
`slots.<slotId>.output`. Failure, timeout, and cancellation require a safe,
non-retryable error. The Adapter does not retry and cannot return a Scenario
terminal such as `$scenario_done`.

The result includes only:

- bounded, redacted Slot output;
- a Slot Trace range reference;
- a redacted Audit availability reference;
- a side-effect summary;
- Runtime steps and elapsed milliseconds.

It does not contain a complete Trace stream, Audit Bundle, Pack Config, or
adapter configuration.

## Artifact Hash and Action Closure

Every invocation binds the exact Agent artifact and config hash from the
Orchestrator Preview Bundle. Canonical hashes use the existing
`sha256:<64 lowercase hex>` form.

`SlotActionClosureReport` lists referenced, resolvable, and unresolved Action
IDs. Unknown Actions are never ignored or mapped to a universal fallback.
`complete=false`, an absent report, or a report bound to another artifact hash
makes Runtime compatibility fail before invocation.

## Idempotency

The deterministic key contract is:

```text
hash(
  orchestratorRunId,
  invocationIndex,
  slotId,
  agentArtifactHash,
  canonicalInputHash
)
```

The browser-safe helper uses canonical JSON and SHA-256. Dynamic timestamps,
local output paths, and credentials are excluded or rejected. Input changes
produce a different key.

Repeating a key must return the same logical result or an explicit conflict.
It must not silently create another Runtime run or duplicate side effects.
Idempotency does not enable automatic retry.

## Context and Redaction

Input and output remain in:

```text
slots.<slotId>.input
slots.<slotId>.output
```

The Adapter cannot access another Slot Context or write Scenario output.
`redactionApplied=true` is mandatory for both directions. Invocation and
result size limits are part of the capability handshake.

## Trace Parent and Audit Reference

The Orchestrator Engine owns:

- `orchestrator.slot.invocation.started`;
- `orchestrator.slot.invocation.completed`;
- `orchestrator.slot.invocation.failed`.

The Slot Runtime retains existing single-Agent event types. Its events are
correlated through:

- `orchestratorRunId`;
- `orchestratorId`;
- `compositionId`;
- `slotId`;
- `invocationId`;
- `parentSpanId`;
- `invocationIndex`;
- `agentArtifactHash`;
- `configHash`.

Orchestrator Trace and Slot Trace form a parent-child relationship. Slot Trace
does not masquerade as Orchestrator Trace. The Adapter returns references
rather than copying complete events.

Audit binding reports the Runtime run, availability, `redacted=true`, artifact
and config hashes, and the side-effect summary. If Orchestrator policy requires
Audit and it is unavailable, validation fails closed.

## Side-effect Boundary

The ordered levels are:

```text
none < read < write < external < financial < approval
```

The request declares the maximum. Every Action must have an explicit
classification before execution. Unknown classification fails closed.
Cross-cutting deny rules take precedence. The Adapter cannot lower an existing
risk level.

`external`, `financial`, and `approval` require Audit availability. This
package performs no side effect.

## Timeout, Cancellation, Handoff, and Failure

Timeout enforcement is mandatory. A timed-out invocation returns `timed_out`,
never `completed`. The Engine follows an explicit Route or fails closed.

Cancellation is optional only when policy does not require it. A cancelled
Slot is not completed. No cancellation implementation or continuation token
is provided here.

Handoff and failures are standardized as Slot signals. The Adapter does not
choose their Routes or terminals. Automatic Slot retry remains disabled at
the Orchestrator level.

## Stable Errors

The contract defines stable errors for Descriptor, protocol, version,
capability, hash, Action Closure, idempotency, namespace, size, timeout,
side-effect, Trace, Audit, result, and public boundary failures. Errors are
safe and deterministic; they do not include stack traces, local paths,
credentials, or complete Context values.

## Current Yutra Runtime Status

`YUTRA_RUNTIME_ADAPTER_CONTRACT_V1` is exported with:

```text
implementationStatus=contract_only
currentRuntimeSupported=false
```

It is a Descriptor, not a callable Adapter. It has no `invokeSlot`
implementation and cannot execute an Orchestrator. Existing single-Agent Run
Preview is not Orchestrator Runtime support. Studio Scenario Orchestrator
Preview therefore still has no Apply or Run action.

The separate
[In-memory Demo Runtime Adapter](./scenario-orchestrator-in-memory-runtime-adapter.md)
implements this contract for deterministic, mock-only execution of one Slot.
Its own Descriptor is `available`, but it does not change
`YUTRA_RUNTIME_ADAPTER_CONTRACT_V1`, does not implement an Orchestrator Engine,
and does not make Studio or the production Runtime Orchestrator-capable.

## Public Boundary

The package is platform-neutral contract code. It has no filesystem, network,
Builder, Builder Runner, Runtime implementation, database, or model SDK
dependency. It does not connect external services or contain private
operational material.

This iteration:

- does not implement an Orchestrator Engine;
- does not implement a Runtime Adapter;
- does not execute a Slot or composed Agent;
- does not emit Orchestrator Trace;
- does not change Runtime, Agent DSL, Trace, Skill, Audit, Compiler, or Studio
  behavior.

The next possible stage is an in-memory Scenario Orchestrator Engine that uses
the demo Adapter without moving Route, Binding, call-stack, or terminal
ownership into the Slot Runtime.
