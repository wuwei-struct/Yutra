# Yutra vNext Preview Release Candidate

## Status

This document describes the current vNext Preview release candidate state.
It is not a GitHub Release, npm publication, or production certification.

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
- No GitHub Release has been created yet.
- No npm package has been published.
- No real customer API integration is included.
- No real LLM / RAG / knowledge base integration is included.
- Certification Readiness Preview is not official production certification.
- Manual Run Preview Evidence is not production certification.
- Other product archetypes remain coming soon.

## Suggested tag candidate

Recommended future tag candidate:

`v0.3.0-vnext-preview.1`

Do not create this tag in this task.

## Next steps

- Final release tag preparation
- Optional browser manual smoke
- Optional fourth archetype after release tag
