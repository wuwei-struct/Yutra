# DSL Editor Roundtrip / Inspect

P5-06 makes the Studio DSL editor a real authoring entry point for run preview.

## Supported Flow

```text
AgentSpec -> generated DSL draft
user edits DSL text
-> /dsl/inspect
-> raw
-> normalized
-> canonical AgentSpec
-> validate
-> Apply DSL as Run Source
-> Runtime Preview
-> Trace / Audit
```

## Source Modes

### Builder Source

Builder Source remains the default.

```text
BuilderFormConfig -> AgentSpec -> Runtime Preview
```

### DSL Source

DSL Source is active only after a successful DSL inspect.

```text
DSL text -> normalized -> canonical AgentSpec -> Runtime Preview
```

If DSL inspect fails, Runtime Preview is not executed.

## What Inspect Shows

- raw parsed DSL
- normalized structural form
- canonical AgentSpec / IR
- validation errors and warnings
- explain text from `@yutra/dsl`
- structure summary

## Current Boundary

P5-06 does not implement full reverse mapping from DSL back into BuilderFormConfig.

Applying DSL as run source:

- changes the source used by Run Preview
- does not rewrite form fields
- does not save files
- does not publish agents
- does not let AI run runtime automatically

Runtime execution still uses canonical IR. The trace event model is unchanged.

