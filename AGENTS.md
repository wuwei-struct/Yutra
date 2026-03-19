# AGENTS

## Repository Contract for AI/IDE Agents

### Project Positioning

Yutra is an Agent Execution Standard and Reference Runtime.

### Core Discipline (historical order)

1. Standard first (`@yutra/spec`)
2. Runtime second (`@yutra/runtime`)
3. Examples third (`examples/*`)
4. Viewer last (`@yutra/viewer`)

### Do Not Cross These Boundaries

- Do not add chat UI, admin backend, multi-tenant platform features.
- Do not add new CLI command surface in packaging-only stages.
- Do not add new trace event types without explicit design iteration.
- Do not convert runtime into prompt-first/LLM-first control flow.
- Do not add remote trace server or observability platform scope.

### Current Stage Prohibitions

For OSS/packaging iterations, only do release-readiness, docs, scripts,
metadata, and demo artifacts. No new core product capability.

### Quality Gate

Before claiming completion, run real commands:

```bash
pnpm verify
```
