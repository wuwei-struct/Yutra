# Builder AI Core (P5-04A)

## What It Is

`@yutra/builder-ai-core` is a drafting contract layer for Builder.

It accepts:

- `TagSelection`
- `NaturalLanguageBrief`

Then it produces:

- `FlowDraft` (draft only, not executable)

And supports:

- `validateFlowDraft`
- `explainFlowDraft`
- `flowDraftToBuilderFormConfig`
- `mockAiDraftProvider`
- `buildFlowDraftPrompt`

## What It Is Not

- Not a Runtime decision engine
- Not final executable DSL generation
- Not direct runtime execution
- Not a chat-style agent generator
- Not a real LLM integration in P5-04A

## Pipeline Position

```text
TagSelection + NaturalLanguageBrief
  -> FlowDraft (AI draft contract)
  -> BuilderFormConfig
  -> AgentSpec / Chinese DSL via @yutra/builder-core
  -> validate / run-preview (later stages)
```

## Why FlowDraft

FlowDraft keeps AI output constrained and reviewable:

- draft schema first
- structured issues/warnings
- deterministic explanation text
- explicit conversion to BuilderFormConfig

This avoids AI bypassing Builder Core validation or runtime safety boundaries.

## Mock Provider Scope

Current `mockAiDraftProvider`:

- supports `ecommerce_support` scenario only
- maps capability tags to intents/skills with deterministic rules
- extracts simple brief hints (`48小时`, `7天`, `5000`)
- applies strategy tags to rules/handoffRules/metadata
- never calls real model APIs

## Prompt Template Scope

`buildFlowDraftPrompt` only builds prompt text. It does not call model APIs.

Prompt constraints explicitly include:

- generate FlowDraft JSON only
- do not generate final executable DSL
- do not execute runtime
- do not bypass validation
- do not invent unknown skills/intents outside template catalogs

## Current Boundaries

- No real OpenAI/DeepSeek/cloud model
- Builder UI defaults to mock provider
- No persistence/database/SaaS

## Real Provider Adapter (P5-04C)

`@yutra/builder-ai-core` now includes a controlled real-provider adapter layer:

- `FlowDraftProvider` interface with unified `generate()` result
- `DraftProviderMode = "mock" | "real"`
- `createFlowDraftProvider()` for mode selection
- `GenericHttpFlowDraftProvider` for openai-compatible/generic HTTP APIs
- `parseFlowDraftResponse()` for strict JSON parsing (pure JSON and fenced JSON)

Real provider output contract is still `FlowDraft` only.
It does not return AgentSpec, final DSL, or Runtime execution results.

### New Error Codes

- `AI_DRAFT_PROVIDER_CONFIG_MISSING`
- `AI_DRAFT_PROVIDER_REQUEST_FAILED`
- `AI_DRAFT_PROVIDER_TIMEOUT`
- `AI_DRAFT_PROVIDER_RESPONSE_EMPTY`
- `AI_DRAFT_PARSE_FAILED`
- `AI_DRAFT_REAL_PROVIDER_DISABLED`

### Validation Gate

Real provider response path is strict:

1. prompt generation (`buildFlowDraftPrompt`)
2. HTTP response parsing (`parseFlowDraftResponse`)
3. schema validation (`flowDraftSchema`)
4. semantic validation (`validateFlowDraft`)

If validation fails, conversion to `BuilderFormConfig` is rejected.

## Next

- P5-04B: Builder UI has AI Draft Assistant with manual apply flow
- P5-04C: add real LLM provider adapters with strict contract boundaries
