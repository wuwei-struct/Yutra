# Builder UI (P5-04B)

## Position

`apps/builder` is a local single-user Basic Agent Builder UI prototype.

It focuses on:

- business configuration input
- generated AgentSpec preview
- generated Chinese DSL draft preview
- generated validation preview
- local run preview execution
- local trace timeline and audit preview
- local AI Draft assistant (FlowDraft generation + apply preview)

## Page Structure

- Header: Yutra Agent Builder
- Left panel:
  - AI Draft Assistant
  - TemplateSelector
  - AgentBasicsForm
  - IntentSelector
  - SkillSelector
  - RulesForm
- Right panel:
  - AgentSpec JSON
  - Chinese DSL
  - Validation
  - Run Preview
  - Trace timeline + event detail
  - Audit bundle
  - Copy/download buttons

## Current Capabilities

- Select `ecommerce-support` template
- Edit basic fields (`agentName`, `version`, `responseStyle`, `language`)
- Select intents and skills
- Configure basic ecommerce rules
- Generate preview data through `@yutra/builder-core`
- Call local `@yutra/builder-runner` for runtime preview
- Show run summary, trace timeline, and audit JSON
- Download trace JSONL and audit JSON locally
- Generate FlowDraft from tags + natural language brief (mock provider)
- Preview draft explanation and apply diff
- Apply draft manually into BuilderFormConfig

## Boundaries

- No direct runtime execution in browser (runtime is called via local runner)
- Not trace viewer
- Not real LLM integration (mock provider only)
- Not auto runtime execution from AI draft
- Not persistence/database/file writing
- Not SaaS/login/multi-tenant

## AI Draft Assistant Notes

- AI Draft uses `@yutra/builder-ai-core` directly
- Flow: tags + brief -> FlowDraft -> explain/validate -> draft form diff -> manual apply
- Apply updates current BuilderFormConfig; AgentSpec/DSL/Validation refresh automatically
- Runtime is still manual through Run Preview button

## Provider Mode (P5-04C)

AI Draft Assistant now has Provider Mode:

- `Mock Draft Provider` (default)
- `Real LLM Provider` (optional)

Behavior:

- Mock mode keeps local deterministic draft generation.
- Real mode calls builder-runner `POST /ai-draft-preview`.
- Browser never asks for API key input.
- Runner unavailable shows friendly hint to start `pnpm builder:runner`.

Safety boundary remains unchanged:

- no auto apply
- no auto runtime run
- no direct final DSL generation from provider output
