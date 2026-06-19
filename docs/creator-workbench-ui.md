# Creator Workbench UI

Creator Workbench is organized as a public demo/mock Agent Creation Workbench.

It compiles business-rule Pack Configs into inspectable artifacts, but it does not run Runtime automatically, does not connect real adapters, and does not represent production readiness.

## Information Architecture

The current Studio UI groups Creator Workbench into five areas:

1. Header / current workbench status
2. Archetype & Business Rules
3. Rule Explanation
4. Compile Preview
5. Readiness & Evidence

This keeps archetype selection, business-rule editing, rule impact explanation, compiler output, and certification readiness separate instead of presenting them as one long panel.

## Creator Workflow

The UI shows the manual workflow:

1. Select archetype
2. Configure business rules
3. Review rule impact
4. Compile preview
5. Send `agent.yutra.yaml` to DSL editor
6. Inspect DSL manually
7. Apply DSL as run source manually
8. Run Preview manually
9. Review Trace / Audit

The workflow is a guide only. It does not trigger any step automatically.

## Boundaries

- Demo/mock only.
- No automatic Runtime execution.
- No automatic Inspect DSL.
- No automatic Apply DSL as Run Source.
- No real adapter or endpoint connection.
- No customer SOP or commercial delivery asset.
- No production readiness claim.

## Supported Archetypes

The current Creator Workbench UI supports two demo archetypes:

- `request-resolution`
- `approval-decision`

Other archetypes remain disabled / coming later.
