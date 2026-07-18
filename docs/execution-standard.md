# Yutra Agent Execution Standard

Yutra defines an execution-first standard for governed agents.

The standard describes how an agent moves through states, evaluates guards, invokes actions, records trace events, and produces audit evidence.

## Scope

The execution standard covers:

- Agent
- State
- Action
- Transition
- Guard
- Context
- TraceEvent

## Reference Runtime

`@yutra/runtime` is the reference implementation of the execution standard.

The runtime is intentionally deterministic. It should not become a prompt-first control loop, and it should not bypass guard, policy, trace, or audit boundaries.

## Relationship to vNext

In the vNext creation flow, Pack Config and Rule Compiler sit above the execution standard:

```text
Business Rules
-> Pack Config
-> Rule Compiler
-> DSL / Canonical IR
-> Runtime
-> Trace / Audit / Certification
```

DSL remains the deterministic intermediate layer consumed by the runtime.

Scenario composition adds a separate future-facing contract chain:

```text
Composition Preview Bundle
-> Scenario Orchestrator Document
-> Future Orchestrator Runtime
-> Namespaced Slot DSL execution
```

`@yutra/scenario-orchestrator-core` currently defines only the document,
call-return, Context, terminal, budget, Trace, and provenance contracts. It
does not change this execution standard, the existing DSL parser, Runtime, or
Trace event model, and Yutra Runtime cannot execute the Orchestrator Document.

`@yutra/scenario-orchestrator-compiler` may serialize that contract as
`scenario.orchestrator.yaml` for inspection and hashing. The artifact uses
`kind=scenario_orchestrator`, is not current Agent DSL, and remains fixed to
`runtimeExecutable=false` and `currentRuntimeSupported=false`. It does not
extend the Runtime loop, DSL parser, or existing Trace event semantics.

`@yutra/scenario-orchestrator-runtime-contract` separately defines a future
capability handshake and one-Slot invocation boundary. It does not implement a
Runtime Adapter, change `@yutra/runtime`, or emit Orchestrator Trace. The
current Yutra Runtime Adapter descriptor remains `contract_only`.

`@yutra/scenario-orchestrator-runtime-demo` implements that boundary as a
mock-only in-memory Adapter around the unchanged public `executeRun` API. It
executes one Slot, preserves namespaced input/output, and records redacted
Trace/Audit correlation references. It does not select Routes, apply Bindings,
maintain a Scenario call stack, emit Orchestrator events, or interpret Slot
completion as Scenario completion.

Slot execution status and Runtime final state are not Scenario semantic
outcomes. Explicit Slot Outcome Projection rules consume allowlisted Adapter
evidence; a future Engine, not the Adapter or Runtime, evaluates those rules.
Action classification coverage happens before invocation, while invocation
permission is enforced at actual Action dispatch before the handler.

## Boundaries

The execution standard does not include:

- marketplace
- remote registry
- hosted observability platform
- multi-tenant SaaS control plane
- real customer API integration
- LLM-first runtime decision making
