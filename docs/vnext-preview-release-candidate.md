# Yutra vNext Preview Release Candidate

## Status

This document records the published vNext Preview GitHub prerelease state.
It is not an npm publication or production certification.

- `packageVersion: 0.3.0-vnext-preview.1`
- `candidateTag: v0.3.0-vnext-preview.1`
- `releasedTag: v0.3.0-vnext-preview.1`
- `releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451`
- `releaseSmokeReady: true`
- `releaseTagReady: true`
- `releaseTagBlocker: none`
- `tagCreated: true`
- `githubReleaseCreated: true`
- `githubReleaseType: prerelease`
- `githubReleaseUrl: https://github.com/wuwei-struct/Yutra/releases/tag/v0.3.0-vnext-preview.1`
- `npmPublished: false`
- `publishedDate: 2026-07-16`

## Positioning

Yutra is an open-source governed Agent Creation & Execution Framework.

## Current demo-enabled product archetypes

- request-resolution
- approval-decision
- knowledge-answering

## Current creation flow

```text
Archetype
-> Pack Config
-> Rule Compiler
-> DSL / Policy / Templates / Test Cases / Trace Expectations
-> DSL Inspect
-> Manual Run Preview
-> Trace / Audit
```

## Studio support

Creator Workbench currently supports:

- taxonomy-aware archetype selection
- business rule configuration
- rule impact explanation
- compile preview
- 6 artifact preview
- certification readiness preview
- send `agent.yutra.yaml` to DSL Editor
- manual Inspect / Apply / Run Preview

## CLI support

The following demo configs can be compiled:

- `examples/request-resolution-ecommerce-basic/pack.config.json`
- `examples/approval-decision-basic/pack.config.json`
- `examples/knowledge-answering-basic/pack.config.json`

## Certification gates

The release candidate must pass:

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm certify`
- `pnpm verify`

## Open-source boundary

This public repo includes open-source core and demo/mock examples only.

It does not include:

- real customer adapters
- real customer SOP
- real endpoints
- credentials
- production integration assets
- pricing / proposal / UAT / rollout playbooks
- hosted enterprise console
- real LLM / RAG / knowledge base integration

## Known limitations

- No production deployment package is included.
- The GitHub Release is a prerelease, not a stable release.
- No npm package has been published.
- No real customer API integration is included.
- No real LLM / RAG / knowledge base integration is included.
- Certification Readiness Preview is not official production certification.
- Manual Run Preview Evidence is not production certification.
- Other product archetypes remain coming soon.

## Release smoke status

- Tested fix commit: `8814e83`
- Smoke evidence: [vNext Preview Release Smoke](./vnext-preview-release-smoke.md)
- `releaseSmokeReady: true`
- `releaseTagReady: true`
- `releaseTagBlocker: none`

The full three-archetype CLI and Studio smoke passed at the linked tested fix
commit. Package metadata is now aligned to `0.3.0-vnext-preview.1`, matching the
candidate tag. This version-only alignment did not change the verified Runtime,
Compiler, DSL, Trace, Skill, or Studio behavior. The annotated tag is fixed to
the release preparation commit recorded above.

## Published prerelease

The published GitHub prerelease is:

[Yutra v0.3.0 vNext Preview 1](https://github.com/wuwei-struct/Yutra/releases/tag/v0.3.0-vnext-preview.1)

## Next steps

- Preserve the prerelease Tag and release evidence
- Keep npm publication as a separate explicit decision
- Optionally validate a fourth archetype after the prerelease
