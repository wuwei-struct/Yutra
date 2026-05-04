# Skill-based Runtime

## One-line Positioning

Skill gives AI capabilities. Yutra makes those capabilities run under rules.

## Architecture (Text Diagram)

```text
Skill / Tool / API / Function
  -> Action Adapter
  -> Yutra Action
  -> State
  -> Agent
  -> Runtime
  -> Trace / Audit / Certification
```

## Skill and Action in Yutra

- Skill: capability unit and implementation source.
- Action: standardized invocation metadata and execution envelope.
- State: execution scene and transition boundary.
- Guard/Policy: boundary controls for risk, approval, and handoff.
- Runtime: deterministic scheduler/executor.
- Trace/Audit: evidence chain of what ran, when, and under which rule.

Skill is not a peer object of Agent/State.
Skill is attached through `implementation.type = "skill"` on an Action.

## Current Support

- Local skill manifest (`skill.json`) loading and validation.
- Local skill registry and discovery.
- CLI: `yutra skill list`, `yutra skill validate`, `yutra skill inspect`.
- Skill to Action adapter (`skillToAction`, `skillToActionRegistry`).
- Runtime execution for `implementation.type = "skill"`.
- Ecommerce support pack skill-based variant (`agent.skill.yutra.yaml`).

## Current Non-support

- Remote registry.
- Marketplace.
- Install workflow.
- Sandbox runtime isolation.
- Skill store.
- Cloud execution.

## Why This Milestone Matters

Generic skill calling can invoke capability.
Yutra provides governed execution evidence:
- which state called the skill,
- which policy metadata applied (`riskLevel`, `requiresApproval`, `sideEffect`),
- and what trace/audit proof was generated.
