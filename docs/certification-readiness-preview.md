# Certification Readiness Preview

Certification Readiness Preview is a Creator Workbench panel that summarizes whether a compiled demo Pack Config has enough evidence for local review.

It is based on Rule Compiler output:

- compile report
- `agent.yutra.yaml`
- `policy.yaml`
- `adapter.config.json`
- `templates.json`
- `test-cases.json`
- `trace.expectation.json`
- rule impact metadata

It does not run Runtime, execute generated DSL, execute test cases, write artifacts to disk, or run the official certification suite.

## Gates

The preview checks these gates:

- Compile
- Artifacts
- Test Cases
- Trace Expectation
- Fail-Closed
- Publish Gate
- Side Effect
- Adapter Safety
- Manual Runtime Run
- Official Certification

The current demo/mock path is expected to show `warning` overall because manual Run Preview and official certification evidence are intentionally absent.

## Boundary

This is not an official certification result.

It does not claim production readiness.

It does not include customer SOP, real adapter mapping, production UAT criteria, rollout plans, real endpoints, or credentials.

## Current Scope

P6-06B supports the request-resolution demo/mock compile preview path only.

Future iterations may attach manual Run Preview evidence or official certification summaries, but this preview remains separate from Runtime execution.
