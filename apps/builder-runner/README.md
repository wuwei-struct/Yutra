# Builder Runner (Local)

`@yutra/builder-runner` is a local Node service for Builder Run Preview.

It is for local development/demo only, not a SaaS backend.

## Start

```bash
pnpm builder:runner
```

Default URL: `http://127.0.0.1:8788`

## API

### GET /health

Returns:

```json
{ "ok": true, "service": "yutra-builder-runner" }
```

### POST /run-preview

Receives `form + input + options`, then:

1. generates AgentSpec via `@yutra/builder-core`
2. validates generated spec
3. executes local runtime preview
4. returns trace events, timeline, trace JSONL, and audit bundle

### POST /ai-draft-preview

Receives `providerMode + tags + brief + options`, then:

1. generates FlowDraft by `mock` or controlled `real` provider mode
2. parses and validates FlowDraft
3. returns explanation, validation, and draft form preview

This endpoint does not execute Runtime and does not apply draft automatically.

Example request:

```json
{
  "providerMode": "mock",
  "tags": {
    "scenario": "ecommerce_support",
    "capabilities": ["query_order", "query_shipping_status"],
    "strategies": ["full_trace_audit"],
    "language": "zh-CN"
  },
  "brief": {
    "text": "物流超过48小时未更新，标记延迟。",
    "locale": "zh-CN"
  }
}
```

Real mode env (local only):

- `YUTRA_BUILDER_AI_PROVIDER=real`
- `YUTRA_BUILDER_AI_BASE_URL=...`
- `YUTRA_BUILDER_AI_MODEL=...`
- `YUTRA_BUILDER_AI_API_KEY=...`
- `YUTRA_BUILDER_AI_TIMEOUT_MS=30000`

## Boundaries

- local-only service
- no login / no multi-tenant
- no database / no remote persistence
- no cloud deployment contract
- no final DSL generation
- no runtime execution from AI draft endpoint
- no secret value returned to UI
- no real customer API integration
