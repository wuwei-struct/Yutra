# Yutra Studio (Local Prototype)

`apps/builder` is now the first Yutra Studio shell.

Yutra Studio is a local single-user Agent Editor Workbench that organizes existing Builder Core, AI Draft, DSL preview, Run Preview, Trace, and Audit capabilities into one workspace.

## Run

Terminal 1:

```bash
pnpm builder:runner
```

Terminal 2:

```bash
pnpm builder:dev
```

## Build

```bash
pnpm --filter @yutra/builder build
```

## Test

```bash
pnpm --filter @yutra/builder test
```

## Workbench Layout

- Sidebar: local navigation shell.
- Top bar: draft status, local save placeholder, publish placeholder.
- Main left: Creator Workbench Compile Preview, AI Draft Assistant, and structured Builder config.
- Main center: DSL editor buffer, AgentSpec JSON, visual flow beta.
- Main right: validation, DSL normalized view, canonical IR, structure overview.
- Bottom left: run input and local runner options.
- Bottom center: embedded trace timeline and run result views.
- Bottom right: selected event detail and audit summary/download.

## Current Boundaries

- Local prototype only.
- No login, database, persistence, publishing, or multi-tenant features.
- AI Draft never auto-runs runtime.
- Runtime preview still goes through local builder-runner.
- Creator Workbench Compile Preview currently supports only `request-resolution`.
- Compile Preview shows demo/mock artifacts and compile report, but does not run Runtime, write files, save config, or publish.
- Compiled `agent.yutra.yaml` can be sent to the DSL Editor, but it must be inspected and manually applied before any Run Preview.
- DSL editing supports Validate DSL, Inspect DSL, and Apply DSL as Run Source.
- Source mode can be `Builder Source` or `DSL Source`.
- DSL Source runs through `DSL -> normalized -> canonical AgentSpec -> Runtime Preview`.
- DSL Source does not backfill the BuilderFormConfig form fields.
- Studio supports English / 中文 UI switching from the top bar.
- The language switch only changes UI labels; DSL text, Trace event type strings, payload raw fields, and canonical IR remain unchanged.
