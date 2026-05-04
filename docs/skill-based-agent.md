# Skill-based Agent Model

## Positioning

Yutra is a Skill-based Agent Execution Standard and Reference Runtime.

Skill-based design keeps capability and execution boundaries explicit:

- Skill: capability unit and implementation source.
- Action: standardized invocation metadata in DSL/runtime.
- State: execution context and transition boundary.
- Guard/Policy: governance and boundary checks.
- Runtime: deterministic scheduler/executor.
- Trace/Audit: execution evidence for review and delivery.

## Core Relation

Skill is not a peer object of Agent/State.
Skill is attached through Action `implementation.type = "skill"`:

1. `skill.json` defines capability and risk metadata.
2. skill adapter converts manifest to action metadata.
3. runtime executes skill entry through action executor.
4. trace/audit records skill evidence through existing action events.

## Why This Works

- Keeps runtime control flow stable.
- Reuses existing policy/trace/audit rails.
- Lets scenario packs evolve by capability modules.
- Avoids marketplace/platform scope in pack stage.

## Scope Boundary

- Skill is not upgraded to Agent/State peer level.
- No marketplace / remote registry / install workflow.
- No new runtime main control logic or trace event model rewrite.

## Related Docs

- `docs/skill-based-runtime.md`
- `docs/skill-based-demo-path.md`
- `docs/skill-certification-summary.md`
- `docs/release-notes-skill-based-runtime.md`
