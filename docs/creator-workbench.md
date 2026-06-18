# Creator Workbench

Creator Workbench is the vNext product direction above the current Yutra Studio.

It is not a generic DSL editor. It is not a complex visual workflow canvas. It is a workbench for customers and implementers to create governed agents by selecting an archetype, configuring business rules, previewing execution, and certifying behavior.

This document describes direction only. P6-01 does not implement new Studio UI.

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
Builder Form / AI Draft / DSL Inspect / Run Preview / Trace / Audit
```

Creator Workbench evolves it into:

```text
Archetype Selection / Business Rule Config / Rule Compiler / Run Preview / Certification
```

The same execution foundation remains:

```text
Generated assets -> Canonical IR -> Runtime -> Trace / Audit / Certification
```

## Current Boundary

P6-01 does not implement:

- new Studio pages
- archetype UI
- business rule forms
- rule compiler integration
- drag-and-drop flow editing
- database persistence
- SaaS publishing
