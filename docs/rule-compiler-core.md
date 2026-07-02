# Rule Compiler Core

`@yutra/rule-compiler` provides the first deterministic Rule Compiler core for the vNext creation layer.

It compiles a validated Pack Config into a fixed set of demo/mock artifacts.

Current scope is intentionally narrow:

- archetypes: `request-resolution`, `approval-decision`, and `knowledge-answering`
- input: public demo Pack Config from `@yutra/pack-config-core`
- output: six deterministic artifacts
- mode: `preview` and `publish` gates

It does not connect Runtime directly and does not connect Studio UI directly.

P6-04B adds a thin CLI/export layer on top of this core package. See [Rule Compiler CLI](rule-compiler-cli.md).
P6-05A adds a local Studio Compile Preview through builder-runner. That preview calls this package in memory and still does not execute Runtime or write artifacts.
P6-06A adds Rule Impact Explanation in the Creator Workbench using Pack Config metadata. That layer explains field impact but does not change compiler output.
P6-06B adds Certification Readiness Preview derived from compile output. It does not execute Runtime, does not execute test cases, and does not run official certification.

## Position in the vNext Chain

```text
Natural Requirement
-> AI Draft Config
-> Pack Config JSON
-> Rule Compiler
-> DSL / Policy / Templates / Tests / Trace Expectations
-> Canonical IR
-> Runtime
```

The compiler is deterministic. AI may draft Pack Config, but AI does not compile or execute runtime control flow.

## Input

The input is:

```ts
type RuleCompilerInput = {
  config: PackConfig
  mode?: "preview" | "publish"
  locale?: "en" | "zh-CN"
}
```

`preview` is the default. `publish` applies stricter gates.

## Outputs

The compiler produces six artifacts:

| Artifact | Purpose |
|---|---|
| `agent.yutra.yaml` | Generated Yutra DSL execution structure |
| `policy.yaml` | Governance and fail-closed policy artifact |
| `adapter.config.json` | Mock / placeholder adapter mapping artifact |
| `templates.json` | Generic demo response templates |
| `test-cases.json` | Normal, boundary, exception, and handoff test cases |
| `trace.expectation.json` | Expected trace event and fail-closed markers |

Each artifact includes deterministic content and a `sha256:<hash>` value.

## Compile Report

Every compile result includes:

- `packConfigHash`
- `compilerVersion`
- `mode`
- `failClosedPolicy=enabled`
- coverage summary
- artifact hashes
- warnings

This prepares for future audit binding. The compiler does not write trace events.

## Certification Readiness Preview

`@yutra/rule-compiler` exposes a deterministic readiness preview helper.

It derives readiness gates from a `RuleCompilerOutput`:

- compile
- artifacts
- test cases
- trace expectation
- fail-closed
- publish gate
- side effect
- adapter safety
- manual runtime run
- official certification

The preview is intentionally conservative. Demo/mock output is expected to remain `warning` until manual Run Preview evidence and official certification evidence are attached.

It does not call Runtime, execute generated DSL, execute test cases, write artifacts, or claim production readiness.

## Fail-closed Gate

The compiler blocks:

- invalid Pack Config
- unsupported archetype
- `requiredButMissing` fields
- secrets
- real endpoints
- unconfirmed AI fields in publish mode
- `real_placeholder` adapters in production-like publish
- missing handoff fallback
- unsafe write-or-higher automatic side effects

Preview mode may allow warnings, but it still blocks secrets, real endpoints, and missing required fields.

## Request-resolution Basic Compiler

The first compiler supports the public `request-resolution` basic config.

It maps public field groups:

- capabilities
- refund policy basics
- handoff policy basics
- response style basics

It intentionally avoids customer SOP, real adapter mappings, and complete industry rule matrices.

## Approval-decision Basic Compiler

The second compiler supports the public `approval-decision` basic config.

It maps public field groups:

- capabilities
- approval policy basics
- risk policy basics
- response style basics

It generates the same six artifacts as request-resolution:

- `agent.yutra.yaml`
- `policy.yaml`
- `adapter.config.json`
- `templates.json`
- `test-cases.json`
- `trace.expectation.json`

It intentionally avoids real enterprise approval procedures, real approval hierarchy, production adapter mappings, organization data, customer SOP, and delivery templates.

Creator Workbench UI is demo-enabled for `approval-decision`. The current support remains demo/mock only: Pack Config + Rule Compiler + CLI + Compile Preview UI, with no Runtime execution or real approval system integration.

## Knowledge-answering Basic Compiler

The third compiler supports the public `knowledge-answering` basic config.

It maps public field groups:

- capabilities
- knowledge policy basics
- source citation policy basics
- response style basics

It generates the same six artifacts:

- `agent.yutra.yaml`
- `policy.yaml`
- `adapter.config.json`
- `templates.json`
- `test-cases.json`
- `trace.expectation.json`

It intentionally avoids real answer generation, real knowledge base content, real retrieval provider configuration, real source endpoints, customer knowledge assets, customer SOP, and delivery templates.

Creator Workbench UI is not enabled for `knowledge-answering` yet. Current support is Pack Config + Rule Impact metadata + Rule Compiler + CLI only.

## Rule Impact Explanation Relationship

Rule Impact metadata lives in `@yutra/pack-config-core`. It explains how a business field can affect Guard, Action, Transition, Policy, Template, Test Case, and Trace Expectation targets.

The Rule Compiler remains deterministic and artifact-focused:

- impact metadata does not execute Runtime
- impact metadata does not change generated artifact content
- impact metadata does not bypass compile gates
- impact metadata does not introduce customer SOP or real adapter mapping

## Current Non-goals

`@yutra/rule-compiler` does not:

- connect Runtime
- connect Studio UI directly
- execute generated DSL
- call an LLM
- include customer SOP
- include real adapters
- include real endpoints or credentials
- include pricing, UAT, rollout, or delivery playbooks
- implement marketplace or remote registry

## Next Step

Likely next steps:

- P6-05B: optional apply compiled DSL into the existing DSL inspect/run source flow
- P6-06: richer visual business-rule configuration

Keep those separate from this core package.
