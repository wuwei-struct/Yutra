# Builder Runner (Local)

`@yutra/builder-runner` is a local Node service for Yutra Studio run preview, DSL inspect, trace, and audit demo flows.

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

### POST /dsl/inspect

Receives `dslText + format`, then:

1. parses YAML or JSON DSL
2. runs structural normalize and name canonicalization via `@yutra/dsl`
3. validates the canonical AgentSpec
4. returns raw, normalized, canonical IR, explain text, validation issues, and summary

This endpoint does not execute Runtime and does not write files.

### POST /run-preview

Supports Builder Source:

```json
{
  "sourceMode": "builder",
  "form": {},
  "input": {}
}
```

and DSL Source:

```json
{
  "sourceMode": "dsl",
  "dslText": "agent: ecommerce_support\ninitial_state: triage\nstates:\n  triage:\n    final: true",
  "format": "yaml",
  "input": {}
}
```

Builder Source flow:

1. generates AgentSpec via `@yutra/builder-core`
2. validates generated spec
3. executes local runtime preview
4. returns trace events, timeline, trace JSONL, and audit bundle

DSL Source flow:

1. parses and inspects DSL via `@yutra/dsl`
2. rejects invalid DSL before runtime execution
3. executes the canonical AgentSpec when validation passes
4. returns the same run preview / trace / audit shape

### POST /ai-draft-preview

Receives `providerMode + tags + brief + options`, then:

1. generates FlowDraft by `mock` or controlled `real` provider mode
2. parses and validates FlowDraft
3. returns explanation, validation, and draft form preview

This endpoint does not execute Runtime and does not apply draft automatically.

### POST /creator/compile-preview

Receives a Pack Config, compile mode, and locale:

```json
{
  "config": {},
  "mode": "preview",
  "locale": "zh-CN"
}
```

Then:

1. calls `@yutra/rule-compiler` in memory
2. returns compile issues, compile report, and six demo/mock artifacts when compilation succeeds
3. returns structured errors without artifacts when compilation fails

This endpoint does not execute Runtime, does not run generated `agent.yutra.yaml`, does not write files, does not read `.env`, and does not connect to real adapters or endpoints.

## Boundaries

- local-only service
- no login / no multi-tenant
- no database / no remote persistence
- no cloud deployment contract
- no file writes from DSL inspect
- no runtime execution from AI draft endpoint
- no runtime execution from Creator Compile Preview
- no artifact file writes from Creator Compile Preview
- no DSL-to-BuilderFormConfig backfill
- no secret value returned to UI
- no real customer API integration
