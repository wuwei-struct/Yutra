# In-memory Scenario Orchestrator Engine

`@yutra/scenario-orchestrator-engine-demo` is a deterministic, mock-only
reference Engine for tests and package smoke. It executes a complete Scenario
in one process and in memory. It is not a production Runtime, is not durable,
and is not connected to Studio.

## Execution Model

The Engine consumes a validated Scenario Orchestrator Preview Bundle and uses
`single_active_slot_call_return`:

1. start with the unique Primary Slot;
2. invoke one explicitly routed Supporting Slot;
3. project the Supporting result through its Outcome Projection Contract;
4. apply the declared identity Binding;
5. resume the Primary Slot;
6. let only the Primary select `$scenario_done`.

Supporting Slots cannot invoke each other, the call depth is one, parallelism
and recursion are disabled, and Supporting completion never means Scenario
completion.

## Outcome Projection

Runtime execution status, Runtime `finalState`, and Semantic Slot outcome are
different values. The Adapter returns allowlisted `projectionEvidence`; the
Engine calls `evaluateSlotOutcomeProjection()` and routes only on its explicit
Semantic Slot outcome. The Runtime-native `outcome` and `finalState=done` are
not used to select a Route.

Missing, unknown, or ambiguous evidence enters `$fail_closed`. There is no
default `done`, `success`, condition, Action, or Route fallback.

## Context and Call-return

The Context Store isolates:

- `scenario.input`, `scenario.shared`, and `scenario.output`;
- `slots.<slotId>.input`, `.state`, `.output`, and `.error`.

`scenario.input` is read-only. Supporting input is built by an explicit
route-specific input resolver, not by implicit Context sharing. Supporting
output is copied only by a declared identity Binding. Required missing source
paths, unsafe paths, cross-Slot writes, and deep merge all fail closed.

## Routes and Overlays

Every `conditionRef` must have an injected deterministic evaluator. Candidate
Routes are selected by active Slot and projected outcome, then evaluated by
explicit condition and priority. Unknown conditions, no match, and ambiguous
highest priority fail closed.

Cross-cutting Overlays are evaluated at Scenario start, before Slot invocation,
before Route selection, and before Terminal. Evaluators are registered by
exact Overlay ID. `deny_override` fails closed, `require_handoff` selects
`$human_handoff`, `adapter_boundary` requires the demo-only Adapter,
`audit_required` requires an available redacted reference, and
`feedback_capture` cannot write business Context.

## Terminals and Budgets

The only terminals are:

- `$scenario_done`;
- `$human_handoff`;
- `$fail_closed`.

Only a Primary Slot with an empty call stack can select `$scenario_done`.
Budgets cover Slot invocations, Route evaluations, Binding applications, call
depth, and per-Slot timeout. A request may tighten but cannot widen compiled
limits. Exhaustion emits `orchestrator.budget.exhausted` and fails closed.

## Idempotency, Trace, and Audit

The in-memory Scenario ledger reuses the same Promise/result for the same
idempotency key and canonical request. A different request using the same key
is rejected before another run starts.

The Engine emits the 13 contract event types to an in-memory Orchestrator Trace
ledger with a strictly increasing sequence. Events carry hashes and safe
references, never full input, output, Slot Trace, or Adapter configuration.
The separate audit ledger stores only redacted status, terminal, hashes,
projection summaries, Slot run references, budget usage, and the aggregate
external-effect flag.

## Canonical Demo Paths

Customer complaint supports two completed paths:

- Primary -> policy explanation -> identity Binding -> Primary ->
  `$scenario_done`;
- Primary -> compensation decision -> identity Binding -> Primary ->
  `$scenario_done`.

Ecommerce refund supports:

- refund resolution -> authorization decision -> identity Binding -> refund
  resolution -> `$scenario_done`.

Generic demo flags also exercise `$human_handoff` and `$fail_closed`. All
Actions are deterministic fixtures and report
`externalEffectsOccurred=false`.

```bash
pnpm --filter @yutra/scenario-orchestrator-engine-demo test
pnpm --filter @yutra/scenario-orchestrator-engine-demo smoke
```

## Boundary

This package executes complete demo Scenarios only in tests or explicit smoke.
It does not modify Runtime, Agent DSL, Trace, Skill, Audit, Composition
Compiler, or Orchestrator Compiler semantics. It does not use a network,
filesystem knowledge source, real service, credential, or external side
effect. It has no persistence, recovery, queue, distributed lock, parallel
scheduler, or production certification.

Studio and Builder Runner remain unchanged and expose no Scenario Run action.
A possible next stage is Studio Manual Scenario Run Preview with an explicit
manual boundary, not production Runtime integration.
