# Builder Run + Trace (P5-03)

## Flow

Yutra Studio (`apps/builder`) calls local Builder Runner (`apps/builder-runner`).

Builder Source flow:

1. `formConfigToAgentSpec()`
2. `validateGeneratedSpec()`
3. `executeRun()` from `@yutra/runtime`
4. collect events from `MemoryTraceStorage`
5. build audit bundle
6. return run summary / timeline / trace JSONL / audit JSON

AI Draft Assistant relation:

- AI Draft generates FlowDraft and draft form only
- user must manually apply draft
- runtime execution is still manual by clicking Run Preview
- real provider mode (if enabled) is handled by `/ai-draft-preview`, still no runtime execution

DSL Source flow:

1. user edits DSL text
2. Studio calls `/dsl/inspect`
3. builder-runner parses, normalizes, canonicalizes, and validates DSL
4. user applies DSL as run source
5. `/run-preview` receives `sourceMode=dsl`
6. canonical AgentSpec executes through the same Runtime Preview path

## Start

Terminal 1:

```bash
pnpm builder:runner
```

Terminal 2:

```bash
pnpm builder:dev
```

## Use Sample Inputs

UI provides three built-in samples:

- `shippingCase`
- `refundHighRiskCase`
- `handoffCase`

You can also edit context JSON manually.

## Download

From UI:

- Download Trace JSONL (`yutra-trace-preview.jsonl`)
- Download Audit JSON (`yutra-audit-preview.json`)

## Current Limits

- Local preview only (no cloud service)
- AI draft preview is supported, but runtime execution is always manual
- No persistence or remote storage
- No Trace Viewer replacement (minimal embedded trace panel only)
- DSL Source can run after successful inspect
- DSL Source does not rewrite BuilderFormConfig form fields
