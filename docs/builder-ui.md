# Builder UI / Yutra Studio (P5-06)

## Position

`apps/builder` is the Yutra Studio local workbench prototype.

It uses existing Builder Core, Builder AI Core, Builder Runner, Runtime, Trace, and Audit capabilities. The UI reorganizes them into an Agent Editor Workbench; it does not add new runtime semantics.

## Page Structure

- Sidebar navigation shell
- Top operation bar
- Main workspace:
  - Natural Language Draft / AI Draft Assistant
  - DSL Editor / AgentSpec JSON / Visual Flow Beta
  - Inspect panel
- Bottom workbench:
  - Run debug input and environment controls
  - Trace timeline and run result views
  - Event detail and audit summary

## Current Capabilities

- Generate FlowDraft from tags and natural language brief.
- Apply draft manually into BuilderFormConfig.
- Validate and inspect editable DSL through local builder-runner.
- Apply inspected DSL as Run Preview source.
- Preview generated DSL and canonical AgentSpec.
- Show validation, normalized structure, canonical IR, and structure counts.
- Run local preview via builder-runner.
- Inspect trace timeline and selected event payload.
- Download trace JSONL and audit JSON.
- Switch Studio UI labels between English and 中文.

Localization is intentionally UI-only. It does not translate DSL content, AgentSpec JSON keys, Trace event type values, payload raw fields, action names, state ids, skill names, file paths, code blocks, or command lines.

## Important Boundary

DSL editing now has two source modes:

- Builder Source:

```text
BuilderFormConfig -> AgentSpec -> builder-runner -> runtime -> trace/audit
```

- DSL Source:

```text
DSL text -> /dsl/inspect -> normalized -> canonical AgentSpec -> builder-runner -> runtime -> trace/audit
```

Applying DSL Source does not backfill the BuilderFormConfig form fields. Full DSL-to-form roundtrip remains out of scope.

## Non-goals

- No login.
- No database.
- No real save/publish.
- No multi-tenant backend.
- No drag-and-drop flow editor.
- No marketplace or remote registry.
- No full AST editor.
- No DSL-to-BuilderFormConfig reverse mapper.
