# Yutra vNext Preview Release Smoke

## Release state

- Tested fix commit: `8814e83`
- Test date: `2026-07-16`
- Candidate tag: `v0.3.0-vnext-preview.1`
- Package version: `0.3.0-vnext-preview.1`
- `releaseSmokeReady: true`
- `releaseTagReady: true`
- `releaseTagBlocker: none`
- `tagCreated: false`
- `githubReleaseCreated: false`
- `npmPublished: false`

The release smoke passed, and package metadata is now aligned with the
candidate tag. The tag has not been created.

## Full gates

The following commands passed before and after the smoke evidence update:

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm certify`
- `pnpm verify`

Targeted Builder Runner, Rule Compiler, DSL, Runtime, Skill Core, and package
tests also passed. Generated Action closure checks passed for all three demo
archetypes, while unknown Action IDs remain fail-closed with
`RUNTIME_ACTION_NOT_FOUND`.

## Version-alignment verification

The root package and all 17 workspace packages use
`0.3.0-vnext-preview.1`. The candidate tag is exactly
`v${packageVersion}`. Lockfile-only installation introduced no dependency
upgrade or unrelated lockfile rewrite.

The alignment changed only package metadata, release documentation, and
conformance coverage. It did not change Runtime, Compiler, DSL, Trace, Skill,
Pack Config, or Studio behavior. The browser smoke facts below remain the
evidence recorded for tested fix commit `8814e83`; no new browser smoke is
claimed by the version-alignment task.

## Three-archetype CLI smoke

The following demo Pack Configs passed dry-run and forced compile smoke:

- `request-resolution`
- `approval-decision`
- `knowledge-answering`

For every archetype, dry-run wrote no artifacts. Forced compile produced the
six expected artifacts plus `compile-report.json`. The generated
`agent.yutra.yaml` passed DSL inspect, compile reports contained the config
hash, compiler version, and artifact hashes, and all adapter entries remained
mock-only with `containsRealEndpoint=false` and `containsSecret=false`.

## Studio browser smoke

The Studio was opened in a real browser against the local demo Builder Runner.
For `request-resolution`, `approval-decision`, and `knowledge-answering`, the
following checks passed:

- archetype selection
- safe demo field edit with `confirmedByUser` provenance
- Rule Impact display
- Compile Preview
- six-artifact preview
- Certification Readiness Preview
- send `agent.yutra.yaml` to DSL Editor
- confirmation that Send did not automatically Inspect, Apply, or Run

The language selector, enabled archetype cards, coming-soon cards, and
cross-cutting archetype boundary were also checked.

## Knowledge-answering manual chain

The complete knowledge-answering chain passed:

```text
Compile Preview
-> Send to DSL Editor
-> Inspect manually
-> Apply as Run Source manually
-> Run Preview manually
-> Trace / Audit
-> run.completed
```

The run produced 35 Trace events. Evidence included `action.succeeded`,
`transition.resolved`, and `run.completed`. The successful demo Action sequence
included classification, context collection, demo retrieval, confidence
evaluation, source-policy checking, and mock answer rendering. The Audit Bundle
reported `completed`, and Manual Run Preview Evidence was captured for the DSL
source.

No automatic Runtime execution occurred. Inspect, Apply, and Run were each
triggered manually. The demo handlers reported `networkAccess=false`,
`containsRealEndpoint=false`, `containsSecret=false`, and `mode=demo_mock`.

## Public boundary and cleanup

- No real LLM / RAG / knowledge base was called.
- No real adapter, endpoint, credential, customer data, or commercial delivery
  asset was used.
- No generated compile artifacts, Trace data, Audit Bundle, browser cache, or
  server logs were retained.
- Temporary `.tmp/release-smoke` outputs and local server logs were removed.
- The Builder Runner and Studio development servers were stopped after smoke.

## Known limitations

- Certification Readiness Preview is not production certification.
- Manual Run Preview Evidence is not production certification.
- The candidate tag and GitHub Release still require a separate explicit
  release task.
- No production deployment or real external integration is included.

No Git tag was created in this task.
No GitHub Release was created in this task.
No npm publication was performed.
