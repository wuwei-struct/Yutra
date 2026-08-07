# Creator Archetype Selection

Creator Workbench now uses taxonomy metadata from `@yutra/archetype-core` to explain archetype choice.

The main selection question is:

```text
What is the primary output of this agent?
```

This keeps users focused on Product Archetypes instead of low-level Behavior Primitives.

## Current compile-enabled archetypes

Creator Workbench currently enables five demo/mock Product Archetypes:

- `request-resolution`
- `approval-decision`
- `knowledge-answering`
- `intake-collector`
- `diagnostic-resolution`

Other Product Archetypes and all Cross-cutting Archetypes are visible as taxonomy metadata, but they are still `coming soon` for Creator Workbench compile preview.

## Five compile-enabled Product Archetypes

Use `request-resolution` when the primary output is a business action result.

Examples:

- complete a request
- reject a request
- request handoff after eligibility or adapter failure

Use `approval-decision` when the primary output is an authorization decision.

Examples:

- approve
- reject
- require more evidence
- request human review

Use `knowledge-answering` when the primary output is a source-constrained answer.

Examples:

- answer with demo source references
- ask clarification when confidence is low
- return no-answer with reason when evidence is missing
- hand off sensitive or unsafe questions

Use `intake-collector` when the primary output is a structured intake record.

Examples:

- collect generic required fields
- validate completeness and request correction
- detect duplicate demo records
- require confirmation before completion
- hand off or stop safely after the clarification budget is exhausted

Use `diagnostic-resolution` when the primary output is a diagnostic disposition.

Examples:

- collect allowlisted generic demo signals
- enforce diagnostic and mock-remediation budgets
- suggest or simulate a side-effect-free remediation
- verify the disposition before completion
- hand off or stop safely when evidence is insufficient

If one real business case mixes multiple outputs, it is probably a Scenario Pattern rather than a new main archetype.

## What the selector shows

Each archetype card shows:

- layer: Product Archetype or Cross-cutting Archetype
- primary output
- acceptance object
- governance focus
- trigger pattern
- behavior primitives
- scenario pattern hints

Cross-cutting Archetypes are marked as supporting capabilities, not standalone creator flows.

## Boundaries

This is a public demo/mock selection experience.

It does not:

- enable every archetype for compile preview
- accept real personal-data fields or customer forms
- change Rule Compiler behavior
- change Pack Config schema behavior
- run Runtime automatically
- connect real adapters
- include customer SOP or production integration assets
