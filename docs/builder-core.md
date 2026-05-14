# Builder Core

## What It Is

Builder Core is a generator layer in Yutra for converting structured builder form config into:

- canonical `AgentSpec`
- Chinese DSL draft for preview/review

It sits between form input and runtime execution artifacts, but does not execute runtime in this phase.

## What It Is Not

- Not a React UI
- Not `apps/builder`
- Not an AI auto-generation system
- Not natural language parsing

## Core Relationship

`TemplateConfig` describes what can be generated.  
`BuilderFormConfig` captures a concrete business configuration selected by a user or caller.

Then:

1. `formConfigToAgentSpec(form, template)` generates canonical `AgentSpec`.
2. `agentSpecToChineseDsl(spec)` renders a deterministic Chinese DSL draft.
3. `validateGeneratedSpec(spec)` validates generated spec with existing Yutra schema/DSL rules.

## API Summary

- `builderTemplateSchema`: validates `AgentTemplateConfig`
- `builderFormSchema`: validates `BuilderFormConfig`
- `ecommerceSupportTemplate`: built-in template for ecommerce-support
- `formConfigToAgentSpec`: form/template -> `AgentSpec`
- `agentSpecToChineseDsl`: `AgentSpec` -> Chinese DSL draft text
- `validateGeneratedSpec`: structural validation with issue list

## E-commerce Template Example

The built-in `ecommerce-support` template includes:

- intents: `shipping_query`, `return_request`, `refund_request`, `handoff`
- skills: `query_order`, `query_shipping_status`, `create_return_request`, `create_refund_request`, `create_support_ticket`
- default context/state/rule assets for a minimal and extendable flow

## Current Limitations (P5-01)

- Supports builder core library only (no UI)
- Uses template metadata only (does not read skill files dynamically)
- Generates deterministic minimal state machine, not full business orchestration
- Chinese DSL output is a draft for preview and review, not source-of-truth runtime input

## Builder UI Status (P5-02)

- A local prototype UI is available at `apps/builder`
- UI remains local-only, single-user, and non-SaaS
- Builder generation source of truth remains `@yutra/builder-core`

## AI Draft Core Status (P5-04A)

- `@yutra/builder-ai-core` now exists for FlowDraft contract drafting
- AI draft output must still go through `flowDraftToBuilderFormConfig`
- Final `AgentSpec` generation and validation remain in `@yutra/builder-core`
- Current provider is local mock only (no real LLM in this phase)

## Roadmap

- P5-02: Basic Builder UI
- P5-03: Builder Run + Trace
- P5-04: AI Assisted Draft
