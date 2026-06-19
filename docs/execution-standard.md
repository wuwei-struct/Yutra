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

## Boundaries

The execution standard does not include:

- marketplace
- remote registry
- hosted observability platform
- multi-tenant SaaS control plane
- real customer API integration
- LLM-first runtime decision making
