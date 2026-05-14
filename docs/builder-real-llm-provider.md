# Builder Real LLM Provider (P5-04C)

## What It Is

Real LLM Provider is an optional adapter path for Builder AI Draft.

It only generates `FlowDraft` JSON. It does not generate final executable DSL.

## What It Is Not

- Not Runtime execution
- Not automatic Apply
- Not chat-style Builder
- Not model management platform

## Environment Variables

- `YUTRA_BUILDER_AI_PROVIDER=mock|real` (default: `mock`)
- `YUTRA_BUILDER_AI_BASE_URL=...`
- `YUTRA_BUILDER_AI_API_KEY=...`
- `YUTRA_BUILDER_AI_MODEL=...`
- `YUTRA_BUILDER_AI_TIMEOUT_MS=30000`

## Security Notes

- Never commit API keys.
- Never input API key in browser UI.
- Do not send real customer sensitive data to model endpoints.
- Production usage requires data masking and compliance review first.

## Fallback

If real provider is unavailable or disabled, switch back to mock mode.

Mock mode remains default and supports full local test/certify flows.

## Current Limits

- real mode requires local env setup
- tests/CI do not require network or API key
- only FlowDraft is generated; Builder Core and validation remain required
