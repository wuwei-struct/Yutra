# Scenario Orchestrator DSL Contract

`@yutra/scenario-orchestrator-core` defines the contract between an inspectable
Scenario Composition Preview Bundle and a future Orchestrator Compiler and
Runtime:

```text
Scenario Composition Preview Bundle
-> Future Orchestrator Compiler
-> Scenario Orchestrator Document
-> Future Orchestrator Runtime
-> Namespaced Slot DSL Execution
```

The package defines and validates a document contract only. The separate
`@yutra/scenario-orchestrator-compiler` can now generate a preview-only
`scenario.orchestrator.yaml` contract artifact. Core itself still does not
generate artifacts, modify `@yutra/dsl`, connect Runtime, or execute a
composed Agent.

The contract package does not generate an `orchestrator.yutra.yaml` artifact.

Every document is fixed to:

```text
kind=scenario_orchestrator
schemaVersion=1.0.0-preview
executionModel=single_active_slot_call_return
previewOnly=true
runtimeExecutable=false
```

## Composition Plan, Preview Bundle, and Orchestrator

A Scenario Composition Plan declares namespaced Product Archetype Slots,
explicit Routes, identity Data Bindings, Cross-cutting Overlays, and
fail-closed precedence. The Compile Preview Bundle independently compiles each
Slot and binds its artifacts with deterministic hashes.

The Scenario Orchestrator Document references that Plan and Bundle. It does not
embed complete Slot DSL content. Each Slot references only:

- `slots/<slotId>/agent.yutra.yaml`;
- its artifact namespace and agent artifact hash;
- its Pack Config hash;
- its Product Archetype and Pack Config identity.

Validation requires the Plan, Bundle, Slot index, hashes, and provenance to
form a closed set.

## Why There Is No Flattened Mega DSL

The contract forbids a flattened mega DSL, Pack Config deep merge, flattened
Slot state, implicit shared context, implicit adapter inheritance, and secret
propagation.

Those approaches would lose rule provenance, mix same-named fields with
different meanings, allow Supporting flows to overwrite Primary state, and
make independent audit or recertification impossible. The strict schema
rejects `mergedPackConfig`, `flattenedConfig`, `deepMerge`, scripts, embedded
expressions, credentials, and endpoint fields.

## Execution Model: single_active_slot_call_return

Version `1.0.0-preview` defines one execution model:
`single_active_slot_call_return`.

1. At most one Product Archetype Slot is active.
2. Execution starts from the unique Primary Slot.
3. Only the Primary may explicitly invoke a Supporting Slot.
4. Invocation creates a caller frame.
5. A Supporting Slot returns structured output through `resume_caller`.
6. Required identity Data Bindings are applied before the caller resumes.
7. Supporting Slots cannot call one another or themselves.
8. Supporting Slots cannot implicitly end the Scenario.
9. Parallel Slots, recursion, implicit loops, event fan-out, and distributed
   workflow behavior are not part of this version.

The call stack starts empty. Its maximum depth is `1`. A Supporting
`resume_caller` without an explicit inbound invocation is invalid. Supporting
failure never automatically resumes the caller.

## Primary and Supporting Responsibilities

The Primary Slot owns:

- Scenario entry;
- the main acceptance object;
- the final outward response;
- writes to `scenario.output`;
- the `$scenario_done` decision.

A Supporting Slot:

- remains an independently compiled Product Archetype Slot;
- writes only its own Slot Context;
- returns data only through an explicit identity Binding;
- cannot override Primary terminal ownership;
- cannot be used as the entry Slot.

The Orchestrator does not change any Slot DSL Guard, Action, Transition, Policy,
or retry behavior.

## Context Namespace Isolation

The fixed Scenario Context is:

```text
scenario
scenario.input
scenario.shared
scenario.output
```

Each Slot owns:

```text
slots.<slotId>.input
slots.<slotId>.state
slots.<slotId>.output
slots.<slotId>.error
```

`scenario.input` becomes read-only after start. `scenario.shared` uses
explicit bindings only. Only the Primary may write `scenario.output`.
Supporting output is not visible to the Primary until a declared Binding is
successfully applied.

The fixed Context Policy declares:

```text
implicitMergeAllowed=false
implicitCrossSlotReadAllowed=false
implicitCrossSlotWriteAllowed=false
adapterInheritanceAllowed=false
secretPropagationAllowed=false
```

Missing required data fails closed. Same-named fields are never automatically
overwritten or deep-merged.

## Explicit Routing and Data Binding

Every Route declares:

- source Slot and outcome;
- safe `conditionRef`;
- unique priority for the same Slot and outcome;
- one explicit effect;
- the source Composition Route provenance.

Allowed effects are:

- `invoke_slot`;
- `resume_caller`;
- `terminate`;
- `request_handoff`;
- `fail_closed`.

Conditions are references, not embedded scripts. Ambiguous route resolution,
missing routes, unknown targets, invalid caller frames, or static invocation
cycles fail closed.

Data Bindings preserve source Slot/path, target Slot/path, `required`, and
Composition provenance. Version 1 supports `transform=identity` only.

## Fixed Terminals

The complete terminal set is:

| Terminal | Status | Rule |
| --- | --- | --- |
| `$scenario_done` | `completed` | Primary only; `scenario.output` required |
| `$human_handoff` | `handoff_required` | audited, redacted, not completed |
| `$fail_closed` | `failed` | stops further automation |

`$fail_closed` covers unresolved conflicts, missing Routes or Bindings, Slot
failure without an explicit failure route, and exhausted budgets.

Handoff requires reason, source Slot, source Route, a redacted Context
snapshot, and Overlay provenance when applicable. Version 1 handoff is not
resumable and does not define an approval callback, continuation queue, or
persistence mechanism.

## Execution Budgets and Failure Policy

The built-in demo budgets are:

- `maxSlotInvocations=16`;
- `maxRouteEvaluations=64`;
- `maxBindingApplications=64`;
- `maxCallDepth=1`.

Budgets must be positive, finite integers within the contract limit. They
cannot be dynamically relaxed. Exhaustion enters `$fail_closed`.

The Orchestrator does not retry an entire Slot automatically. Action retry
remains owned by the independent Slot DSL and current Runtime contract.
Partial Scenario success is forbidden. Handoff is distinct from both failure
and completion.

## Cross-cutting Overlay Boundary

The document references Composition Overlays but does not implement an Overlay
Runtime.

- `deny_override` can only restrict behavior.
- `require_handoff` outranks automation.
- `adapter_boundary` cannot inject an adapter.
- `audit_required` cannot disable existing audit.
- `feedback_capture` cannot write business Context.

An Overlay cannot relax a Product Archetype deny. An unresolved Overlay
conflict fails closed.

## Trace and Audit Event Contract

This iteration defines, but does not emit, the following Orchestrator Trace
event contract:

- `orchestrator.started`
- `orchestrator.slot.invocation.started`
- `orchestrator.slot.invocation.completed`
- `orchestrator.slot.invocation.failed`
- `orchestrator.route.evaluated`
- `orchestrator.route.selected`
- `orchestrator.binding.applied`
- `orchestrator.binding.failed`
- `orchestrator.overlay.evaluated`
- `orchestrator.handoff.requested`
- `orchestrator.budget.exhausted`
- `orchestrator.completed`
- `orchestrator.failed`

Common fields retain the Orchestrator, Composition, run, sequence, active Slot,
optional Route/Binding/Overlay/Terminal references, and the Plan, Bundle, and
Orchestrator hashes.

The contract requires audit evidence and redacted Context snapshots. Trace
events must not contain secrets, full adapter configs, or real endpoints. No
existing Trace event type or Trace Runtime behavior is changed in this
iteration.

## Provenance Contract

Provenance closes over:

- Composition ID, version, Pattern, Plan hash, and Bundle hash;
- every Slot's Archetype, Pack Config, config hash, and agent artifact hash;
- every Route and its Composition Route;
- every Binding and its Composition Binding;
- every Overlay and its Composition Overlay;
- a deterministic future Orchestrator hash input.

Dynamic timestamps do not participate in a future Orchestrator hash. A Slot
artifact outside the Preview Bundle cannot be referenced.

## Built-in Contract Fixtures

### Customer complaint

`customer-complaint-orchestrator-contract` references:

- Primary: `complaint_resolution`;
- Supporting: `policy_explanation`;
- Supporting: `compensation_decision`;
- Cross-cutting: `human-handoff`, `policy-guard`.

The Primary explicitly calls either Supporting Slot. Each Supporting Slot
returns through `resume_caller`; required Bindings return structured output to
the Primary. Human handoff terminates automation without pretending the
Scenario completed.

### Ecommerce refund

`ecommerce-refund-orchestrator-contract` references:

- Primary: `refund_resolution`;
- Supporting: `refund_authorization`;
- Cross-cutting: `policy-guard`, `adapter-connector`, `human-handoff`.

Authorization is an explicit Supporting call. Its result returns to the
Primary through an identity Binding. The fixture contains no real amount
threshold, order system, payment system, or refund integration.

### Renewal churn warning

No validated Orchestrator Contract is provided for renewal churn warning.
`monitoring-response`, `data-insight`, and `lead-engagement` are not currently
compiler-enabled, so no Slot artifact reference or executable support is
fabricated.

## Public Boundary and Current Status

The built-in documents and Bundle references are deterministic demo fixtures.
They contain no real customer data, endpoint, credential, customer SOP,
commercial delivery asset, LLM, RAG, knowledge base, or production adapter.

This document defines a future scenario orchestration contract. It is not currently executable by Yutra Runtime.

Current non-goals:

- no Runtime-executable Orchestrator DSL;
- no Scenario Runtime;
- no composed Agent execution;
- no modification to `@yutra/dsl`;
- no Studio capability change;
- no visual Plan Authoring.

The preview Compiler is documented in
[Scenario Orchestrator Compiler Preview](./scenario-orchestrator-compiler-preview.md).
It preserves `previewOnly=true`, `runtimeExecutable=false`, and
`currentRuntimeSupported=false`. A next possible stage is a Studio
Orchestrator Preview or a separate Runtime Adapter Contract.
