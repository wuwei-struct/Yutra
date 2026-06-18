# Creator Workbench

Creator Workbench is the vNext product direction above the current Yutra Studio.

It is not a generic DSL editor. It is not a complex visual workflow canvas. It is a workbench for customers and implementers to create governed agents by selecting an archetype, configuring business rules, previewing execution, and certifying behavior.

This document describes the vNext direction and the current MVP boundary.
P6-05A adds a first local Compile Preview inside Yutra Studio, but it remains demo/mock only.

## Main Entry

```text
Select Archetype
-> Configure Business Rules
-> Connect Adapters
-> Run Preview
-> Inspect Trace / Audit / Certification
```

DSL Editor remains available as an advanced mode, but it should not be the default customer entry.

## Core Pages

### 1. Archetype Selection

Choose a business action structure such as `request-resolution`, `approval-decision`, or `knowledge-answering`.

The UI should explain what the archetype does, what rules it needs, and what outputs it can generate.

### 2. Scenario Variant

Choose a specific variant within the archetype.

Example: for `request-resolution`, ecommerce variants may include shipping query, return request, refund request, and handoff.

### 3. Capability Selection

Enable the capabilities needed for the agent.

Example: order lookup, shipping check, refund eligibility, return request creation, human escalation.

### 4. Rule Configuration

Configure business rules in customer language.

Every rule item should explain what Guard, Action, Transition, Policy, Template, or Test it will affect.

### 5. System Integration

Map business actions to adapter contracts and customer systems.

The workbench should show required fields, replacement points, mock vs real adapter modes, and integration readiness.

### 6. AI Draft

Generate Pack Config draft from natural requirement.

AI draft must produce inspectable config and diff. It must not auto-run runtime or bypass validation.

### 7. Inspect

Show generated assets and mapping:

- Pack Config
- generated DSL
- policy
- templates
- test cases
- canonical IR summary

In the current MVP, Compile Preview displays the six Rule Compiler artifacts for the public `request-resolution` demo config:

- `agent.yutra.yaml`
- `policy.yaml`
- `adapter.config.json`
- `templates.json`
- `test-cases.json`
- `trace.expectation.json`

The generated agent artifact is not executed automatically.

### 8. Run Preview

Run generated assets locally against selected test input.

Every configuration path must be previewable before delivery.

### 9. Certification

Show test case results, golden trace comparison, expected path coverage, and audit readiness.

## UI Principles

- Main entry uses business language, not code language.
- Advanced mode can expose DSL Editor, but default authoring is business rules.
- Every rule item must explain what it generates.
- Every configuration must support Run Preview.
- Trace is a core product proof, not a debugging afterthought.
- First version should not use a complex drag-and-drop canvas.
- No login, multi-tenant SaaS backend, marketplace, remote registry, or production publishing system in the first creator iteration.

## Relationship to Current Studio

Current Yutra Studio is an early workbench prototype:

```text
Builder Form / AI Draft / DSL Inspect / Creator Compile Preview / Run Preview / Trace / Audit
```

Creator Workbench evolves it into:

```text
Archetype Selection / Business Rule Config / Rule Compiler / Run Preview / Certification
```

The same execution foundation remains:

```text
Generated assets -> Canonical IR -> Runtime -> Trace / Audit / Certification
```

P6-05A only previews generated assets. It does not run Runtime, write artifacts to disk, publish an Agent, or save customer configuration.

## Current MVP: Compile Preview

The current Creator Workbench MVP supports only one archetype:

- enabled: `request-resolution`
- disabled / coming later: all other main and cross-cutting archetypes

The request-resolution form edits a public demo/mock Pack Config:

- capabilities
- refund policy basics
- handoff policy basics
- response style basics

Adapters remain fixed to `mock`. The UI does not expose secret fields, real endpoints, customer adapter mappings, or customer SOP fields.

Compile Preview calls the local builder-runner endpoint:

```text
POST /creator/compile-preview
```

The endpoint calls `@yutra/rule-compiler` in memory and returns artifacts, issues, and compile report metadata. It does not write files and does not execute generated DSL.

## Current Boundary

The current Creator Workbench MVP does not implement:

- full archetype coverage
- customer-ready rule matrices
- real adapters or endpoints
- customer SOP
- automatic Runtime execution from Compile Preview
- artifact export from Studio
- drag-and-drop flow editing
- database persistence
- SaaS publishing
