# Creator Workbench

Creator Workbench is the vNext product direction above the current Yutra Studio.

It is not a generic DSL editor. It is not a complex visual workflow canvas. It is a workbench for customers and implementers to create governed agents by selecting an archetype, configuring business rules, previewing execution, and certifying behavior.

This document describes the vNext direction and the current MVP boundary.
P6-05A adds a first local Compile Preview inside Yutra Studio, but it remains demo/mock only.

P6-08A organizes the Studio surface into a clearer Creator Workbench UI:

- Header / current workbench status
- Archetype & Business Rules
- Rule Explanation
- Compile Preview
- Readiness & Evidence

See [Creator Workbench UI](creator-workbench-ui.md).

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

Creator Workbench should guide users with the question:

```text
What is the primary output of this agent?
```

中文：这个 Agent 的主要产出物是什么？

Users select a Product Archetype, not a low-level Behavior Primitive. Complex business scenarios can be represented as Scenario Patterns that combine multiple archetypes.

For example, customer complaint is a Scenario Pattern rather than a new main archetype. Explaining policy may use `knowledge-answering`; compensation handling may combine `request-resolution` and `approval-decision`; public signal response may start from `monitoring-response`.

`approval-decision` remains a Product Archetype because its primary output is an authorization decision.

See [Archetype Taxonomy](archetype-taxonomy.md).

P6-08E adds taxonomy-aware archetype selection to the Studio UI. Each archetype card can show its layer, primary output, acceptance object, governance focus, trigger pattern, Behavior Primitive refs, and Scenario Pattern hints from `@yutra/archetype-core`.

Cross-cutting archetypes are visible as taxonomy metadata, but they are marked as supporting capabilities rather than standalone creator flows.

See [Creator Archetype Selection](creator-archetype-selection.md).

### 2. Scenario Variant

Choose a specific variant within the archetype.

Example: for `request-resolution`, ecommerce variants may include shipping query, return request, refund request, and handoff.

### 3. Capability Selection

Enable the capabilities needed for the agent.

Example: order lookup, shipping check, refund eligibility, return request creation, human escalation.

### 4. Rule Configuration

Configure business rules in customer language.

Every rule item should explain what Guard, Action, Transition, Policy, Template, or Test it will affect.
P6-06A adds Rule Impact Explanation for public `request-resolution` demo fields so users can inspect how a Pack Config field maps to Guard, Action, Transition, Policy, Template, Test Case, and Trace Expectation targets.

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

In the current MVP, Compile Preview displays the six Rule Compiler artifacts for public `request-resolution` and `approval-decision` demo configs:

- `agent.yutra.yaml`
- `policy.yaml`
- `adapter.config.json`
- `templates.json`
- `test-cases.json`
- `trace.expectation.json`

The generated agent artifact is not executed automatically.
It can be sent to the DSL Editor for manual inspection, but that does not make it a trusted run source.

### 8. Run Preview

Run generated assets locally against selected test input.

Every configuration path must be previewable before delivery.

### 9. Certification

Show test case results, golden trace comparison, expected path coverage, and audit readiness.

P6-06B adds a Certification Readiness Preview panel for the current demo/mock compile output.
It checks compile status, artifact presence, test-case artifact presence, trace expectation evidence, fail-closed coverage, publish gate status, side-effect coverage, adapter safety, manual Runtime Run evidence, and official certification evidence.

It is not an official certification result, does not execute test cases, does not run Runtime, and does not claim production readiness.

P6-06C adds a manual Run Preview Evidence bridge.
After a user manually sends compiled DSL to the DSL Editor, inspects it, applies it as DSL Source, and runs Run Preview, Studio can show that runId, event count, trace presence, and audit bundle presence in the Certification Readiness Panel.
This evidence only updates the `manual_runtime_run` gate display. It does not run Runtime automatically, does not execute test cases, does not mark official certification as ready, and does not claim production readiness.

## UI Principles

- Main entry uses business language, not code language.
- Advanced mode can expose DSL Editor, but default authoring is business rules.
- Every rule item must explain what it generates.
- Every configuration must support Run Preview.
- Trace is a core product proof, not a debugging afterthought.
- First version should not use a complex drag-and-drop canvas.
- No login, multi-tenant SaaS backend, marketplace, remote registry, or production publishing system in the first creator iteration.

## Creator Workflow

The Studio UI shows this manual workflow:

1. Select archetype
2. Configure business rules
3. Review rule impact
4. Compile preview
5. Send `agent.yutra.yaml` to DSL editor
6. Inspect DSL manually
7. Apply DSL as run source manually
8. Run Preview manually
9. Review Trace / Audit

This is a workflow guide only. It does not run Runtime automatically, does not inspect DSL automatically, does not apply DSL automatically, and does not represent production readiness.

Boundary label: No automatic Runtime execution.

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

Creator Workbench only previews generated assets. It does not run Runtime, write artifacts to disk, publish an Agent, or save customer configuration.
P6-05B adds a manual bridge from the compiled `agent.yutra.yaml` artifact to the existing DSL Editor. The bridge only copies text into the editor.

## Current MVP: Compile Preview

The current Creator Workbench MVP supports three archetypes:

- enabled: `request-resolution`
- enabled: `approval-decision`
- enabled: `knowledge-answering`
- disabled / coming later: all other main and cross-cutting archetypes

The archetype selector is taxonomy-aware. It shows why `request-resolution` is appropriate for business action results, why `approval-decision` is appropriate for authorization decisions, and why `knowledge-answering` is appropriate for governed source-constrained answers. It does not claim that all 14 archetypes are compile-enabled.

The request-resolution, approval-decision, and knowledge-answering forms edit public demo/mock Pack Configs:

- capabilities
- refund policy basics
- handoff policy basics
- approval policy basics
- risk policy basics
- knowledge policy basics
- source policy basics
- response style basics

Each editable field shows source provenance, affected artifact chips, and an Impact control that opens the Rule Impact Explanation panel.

The UI now separates business rules, rule explanation, compile output, and readiness evidence into distinct sections so the workbench reads as an Agent Creation Workbench rather than a stacked feature panel.

Adapters remain fixed to `mock`. The UI does not expose secret fields, real endpoints, customer adapter mappings, customer SOP fields, real LLM providers, real RAG providers, real knowledge base paths, source URLs, or document IDs.

Compile Preview calls the local builder-runner endpoint:

```text
POST /creator/compile-preview
```

The endpoint calls `@yutra/rule-compiler` in memory and returns artifacts, issues, and compile report metadata. It does not write files and does not execute generated DSL.

## Manual DSL Bridge

After Compile Preview succeeds, the `agent.yutra.yaml` artifact can be sent to the DSL Editor.

Manual flow:

1. Send `agent.yutra.yaml` to DSL Editor
2. Inspect DSL
3. Apply DSL as Run Source
4. Run Preview manually

Important boundaries:

- sending to DSL Editor does not inspect the DSL
- sending to DSL Editor does not apply DSL as run source
- sending to DSL Editor does not run Runtime
- compiled DSL must pass `/dsl/inspect` before it can be used as a run source
- Studio does not write compiled artifacts to disk

## Rule Impact Explanation

The Creator Workbench includes a Rule Impact panel for public `request-resolution`, `approval-decision`, and `knowledge-answering` demo configs.

The panel explains:

- business meaning of the selected field
- affected Guard / Action / Transition / Policy / Template / Test Case / Trace Expectation targets
- affected artifact files
- safety notes such as fail-closed or handoff requirements

This is explanation metadata only. It does not change Rule Compiler output, does not run Runtime, and does not contain customer SOP or real adapter mapping.

## Certification Readiness Preview

After Compile Preview succeeds, Creator Workbench shows a Certification Readiness Panel.

The panel includes:

- overall readiness: ready / warning / blocked
- gate status for compile, artifacts, test cases, trace expectation, fail-closed, publish gate, side effect, adapter safety, manual runtime run, and official certification
- artifact status for the six compiler outputs
- counts for test cases, trace expectations, issue counts, and rule impact metadata
- an explicit boundary note

Important boundaries:

- it does not run Runtime
- it does not execute generated DSL
- it does not execute test cases
- it does not run `pnpm certify`
- it is not an official certification result
- it does not prove production readiness
- manual Run Preview evidence is UI evidence only; official certification remains separate
- DSL edits after evidence capture make the manual run evidence stale

See [Certification Readiness Preview](certification-readiness-preview.md).

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
