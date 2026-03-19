# Yutra Trace Viewer

Language docs: [English](../../README.md) | [简体中文](../../README.zh-CN.md)

Minimal three-column trace viewer for local JSONL traces.

## Layout

- Left: run list
- Middle: state/transition timeline
- Right: selected event detail

## Localization

Localization:
- Supports English and 中文（简体） UI switching.
- Switching locale only changes UI labels.
- Trace event type strings and payload raw fields remain unchanged.

Implementation details:
- Default locale is inferred from browser language (`zh*` -> `zh-CN`, otherwise `en`).
- Manual language switch is persisted in `localStorage` key `yutra.viewer.locale`.

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
