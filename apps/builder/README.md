# Basic Agent Builder UI (Local Prototype)

This app is a local single-user Builder UI prototype for Yutra.

It demonstrates:

- template selection (`ecommerce-support`)
- basic agent form input
- intent / skill selection
- rules configuration
- AgentSpec JSON preview
- Chinese DSL draft preview
- generated spec validation preview
- local Run Preview through builder-runner
- local trace timeline and audit bundle preview/download
- AI Draft Assistant (tags + brief -> FlowDraft -> Apply)
- AI Draft Provider Mode (mock default, optional real provider via builder-runner)

## Run

Terminal 1 (Runner):

```bash
pnpm builder:runner
```

Terminal 2 (UI):

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

## Scope

- Local prototype only
- Runtime preview through local runner only
- No trace viewer integration
- AI Draft uses local mock provider only
- Real provider mode is optional and goes through builder-runner `/ai-draft-preview`
- API key is never entered in browser
- AI Draft generates FlowDraft (draft), not final executable DSL
- Apply Draft requires human confirmation
- Runtime execution remains manual via Run Preview
- No persistence/database
- No SaaS/multi-tenant/login
- No cloud backend

## Roadmap

- P5-03: Builder Run + Trace
- P5-04: AI Assisted Draft
