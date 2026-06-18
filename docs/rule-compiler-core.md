# Rule Compiler Core

`@yutra/rule-compiler` provides the first deterministic Rule Compiler core for the vNext creation layer.

It compiles a validated Pack Config into a fixed set of demo/mock artifacts.

Current scope is intentionally narrow:

- archetype: `request-resolution`
- input: public demo Pack Config from `@yutra/pack-config-core`
- output: six deterministic artifacts
- mode: `preview` and `publish` gates

It does not connect Runtime or Studio.

P6-04B adds a thin CLI/export layer on top of this core package. See [Rule Compiler CLI](rule-compiler-cli.md).

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

The first compiler supports only the public `request-resolution` basic config.

It maps public field groups:

- capabilities
- refund policy basics
- handoff policy basics
- response style basics

It intentionally avoids customer SOP, real adapter mappings, and complete industry rule matrices.

## Current Non-goals

`@yutra/rule-compiler` does not:

- connect Runtime
- connect Studio UI
- execute generated DSL
- call an LLM
- include customer SOP
- include real adapters
- include real endpoints or credentials
- include pricing, UAT, rollout, or delivery playbooks
- implement marketplace or remote registry

## Next Step

Likely next steps:

- P6-04B: compiler CLI / artifact export
- P6-05: Creator Workbench integration

Keep those separate from this core package.
