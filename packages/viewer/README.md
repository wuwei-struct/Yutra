# Yutra Trace Viewer

Minimal three-column trace viewer for local JSONL traces.

## Layout

- Left: run list
- Middle: state/transition timeline
- Right: selected event detail

## Localization

- Supports `English` and `中文（简体）` UI labels.
- Default locale is inferred from browser language (`zh*` -> `zh-CN`, otherwise `en`).
- Manual language switch is persisted in `localStorage` key `yutra.viewer.locale`.
- Localization affects UI labels only.
- Trace event types and payload raw values are not translated or mutated.

## Features

- Load built-in sample JSONL
- Upload local JSONL file
- Switch run and inspect event payload
- Switch UI language between English and 中文

## Commands

```bash
pnpm --filter @yutra/viewer dev
pnpm --filter @yutra/viewer build
pnpm --filter @yutra/viewer test
```
