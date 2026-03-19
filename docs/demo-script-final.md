# Demo Script (Final)

## 1) 20~30s: 项目定位

Yutra is an Agent Execution Standard and Reference Runtime.
它不是 prompt 脚本集合，而是一个 execution-first 的状态机执行器。

## 2) 40~60s: 跑 it-helpdesk

```bash
pnpm yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json --trace-file demo-artifacts/it-helpdesk.jsonl
```

讲解点：
- 输入进入 `initial_state`
- 动作执行后更新 context
- 按 transition 进入下一状态并完成

## 3) 40~60s: 打开 viewer 看 completed run

```bash
pnpm --filter @yutra/viewer dev
```

在 Viewer 中加载 `demo-artifacts/it-helpdesk.jsonl`，按顺序点：
- `state.entered`
- `action.succeeded`
- `transition.resolved`
- `run.completed`

## 4) 30~40s: 跑 approval-agent case2

```bash
pnpm yutra run examples/approval-agent/agent.yutra.yaml --input examples/approval-agent/demo-inputs/case2.json --trace-file demo-artifacts/approval-agent-handoff.jsonl
```

讲解点：
- 风险 guard 触发
- 流程进入 handoff，不继续自动执行

## 5) 20~30s: 展示 handoff trace

在 Viewer 中加载 `demo-artifacts/approval-agent-handoff.jsonl`，定位：
- `guard.evaluated`
- `handoff.requested`

## 6) 15~20s: 总结

这不是让 LLM 自由接管流程的系统。
Yutra 把执行路径固定在 State / Guard / Action / Transition 上，trace 可审计、可复盘。
