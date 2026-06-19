# Rule Impact Explanation

Rule Impact Explanation is the Creator Workbench layer that shows how a business rule field affects generated agent behavior.

It answers a practical question:

```text
If this business rule changes, what Guard / Action / Transition / Policy / Template / Test Case / Trace Expectation changes with it?
```

## Why It Matters

Creator Workbench should not be a plain form. A user should understand how a field in Pack Config is compiled into governed agent behavior before trusting the generated artifacts.

Rule Impact metadata makes the mapping inspectable without executing Runtime.

## Current Scope

The current public implementation covers request-resolution demo/basic fields only:

- capabilities
- refund policy basics
- handoff policy basics
- response style basics

This is public demo metadata. It is not a customer SOP, not a complete industry rule matrix, and not a production adapter mapping.

## Impact Targets

Rule Impact metadata can point to:

- Guard
- Action
- Transition
- Policy
- Template
- Test Case
- Trace Expectation
- Adapter Config

Example:

```text
rules.refundPolicy.autoRefundMaxAmount
-> guard: high_value_refund
-> transition: evaluate_rules -> handoff
-> policy: refund amount threshold
-> test_case: high-value refund handoff
-> trace_expectation: handoff.requested
```

## Relationship to Rule Compiler

Rule Impact metadata explains what a field influences. It does not compile artifacts by itself.

The Rule Compiler remains deterministic and still produces:

- `agent.yutra.yaml`
- `policy.yaml`
- `adapter.config.json`
- `templates.json`
- `test-cases.json`
- `trace.expectation.json`

The explanation layer does not change compiler output, Runtime behavior, trace event types, or DSL semantics.

## Boundaries

Rule Impact Explanation does not:

- run Runtime
- apply DSL as run source
- save or publish agents
- include customer SOP
- include real adapters or endpoints
- include pricing, UAT, rollout, or delivery playbooks
- call an LLM

See [Public Demo Boundary](public-demo-boundary.md) for the public repository boundary.
