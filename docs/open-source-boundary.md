# Open Source Boundary

This document explains the current open-source boundary for Yutra and the possible future commercial or private implementation layer.

It is not a legal commitment, pricing commitment, or product availability commitment.

## Why Yutra Is Open Source

Yutra open-sources its execution foundation for four reasons:

- transparency: agent execution should be inspectable
- trust: behavior should not depend on hidden prompt chains
- reproducibility: runs should be replayable and certifiable
- developer adoption: teams should be able to learn, extend, and verify the reference implementation locally

## Open-source Core

This repository currently open-sources the reference implementation for:

- DSL / Canonical IR
- Reference Runtime
- Trace / Replay / Audit
- Governance / Policy / Handoff / Approval contracts
- Skill Core / Skill Runtime
- CLI
- Basic Viewer / Studio
- Example packs and starter packs
- Conformance / Certification tests
- vNext docs for Agent Archetypes and Rule Compiler direction

## Future Commercial or Private Layer

Future commercial or private implementation layers may include:

- real customer adapters
- enterprise policy packs
- advanced industry packs
- hosted trace / audit dashboards
- private deployment templates
- customer-specific SOP / templates / configs
- UAT / rollout / delivery playbooks
- enterprise support and implementation service

These are possible future directions, not commitments in this repository.

Customer-specific delivery assets should live in private implementation repositories, not in the public reference repository.

For the demo-specific boundary, see [Public Demo Boundary](public-demo-boundary.md).

## What Should Never Be Committed

Do not commit:

- secrets
- customer data
- real customer endpoints
- private configs
- proprietary SOP
- production credentials
- customer-specific policy files
- private deployment manifests
- customer-ready pricing proposals
- detailed UAT, rollout, or delivery playbooks
- real adapter mappings
- commercially reusable customer templates

Use `.env.example`, mock fixtures, redacted configs, and local demo artifacts instead.

## Current License

Yutra currently uses the MIT license. See [LICENSE](../LICENSE).

This note is not legal advice.

## Future Strategy

The intended boundary is open core plus optional commercial packs and implementation services:

```text
Open execution standard and reference runtime
+ transparent trace / audit / certification
+ optional commercial real-world integration and delivery work
```

Yutra keeps the execution standard and reference runtime transparent. Commercial value, if pursued, should mainly come from real-world integration, industry packs, private deployment, governance consulting, and implementation services.
