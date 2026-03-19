# Yutra

Yutra 是一个 Agent 执行标准与参考运行时。

Yutra is an Agent Execution Standard and Reference Runtime.

## 中文说明

### Yutra 是什么

Yutra 提供一套 execution-first 的最小闭环：
- 用标准定义 Agent 的结构边界；
- 用 DSL 加载与校验保证输入可验证；
- 用运行时按状态机执行；
- 用 Trace 记录可审计执行过程。

### 为什么存在

- Agent workflow 太复杂。
- Prompt-only agent 不可控。
- 企业需要可追踪执行。

### 最小例子

```yaml
agent: it-helpdesk-agent
initial_state: triage
states:
  triage:
    actions:
      - lookup_ticket
    transitions:
      - to: resolved
        when: ctx.ticket_has_solution == true
  resolved:
    actions:
      - close_ticket
    final: true
actions:
  - name: lookup_ticket
  - name: close_ticket
```

### 快速开始

```bash
pnpm install
pnpm verify
pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm exec yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
pnpm exec yutra trace list --trace-file .yutra/traces/events.jsonl
pnpm --filter @yutra/viewer dev
```

### Examples Matrix

- IT Helpdesk：状态机 + 工具调用 + 分支转移。
- E-commerce Support：客服 SOP + knowledge + tool。
- Approval Agent：guard + 审批链 + handoff。

### Trace Viewer

Viewer 保持最小三栏结构：
- 左：Run list
- 中：Timeline
- 右：Event detail

本地化说明：
- Viewer supports English / 中文 UI switching.
- Switching locale only changes UI labels.
- Trace event type strings and payload raw fields remain unchanged.

### 非目标

Yutra 当前不是：
- 可视化工作流平台
- 聊天 SaaS 壳子
- 多租户后台
- LLM-first orchestration system

### Documentation Map

- [Execution Standard](docs/execution-standard.md)
- [Tool Interface](docs/tool-interface.md)
- [Knowledge Interface](docs/knowledge-interface.md)
- [LLM Interface](docs/llm-interface.md)
- [Example Walkthrough](docs/example-walkthrough.md)
- [Demo Script](docs/demo-script.md)
- [Release Checklist](docs/release-checklist.md)
- [Contributing](CONTRIBUTING.md)
- [Agent Collaboration Rules](AGENTS.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)

## English

### What Yutra Is

Yutra provides an execution-first minimal loop:
- define agent boundaries with a standard,
- load and validate DSL as machine-checkable input,
- execute with a state-machine runtime,
- record auditable traces.

### Why It Exists

- Agent workflows are complex.
- Prompt-only agents are hard to control.
- Enterprises need traceable execution.

### Minimal Example

```yaml
agent: it-helpdesk-agent
initial_state: triage
states:
  triage:
    actions:
      - lookup_ticket
    transitions:
      - to: resolved
        when: ctx.ticket_has_solution == true
  resolved:
    actions:
      - close_ticket
    final: true
actions:
  - name: lookup_ticket
  - name: close_ticket
```

### Quick Start

Use the commands in the Chinese "快速开始" section above.

### Examples Matrix

- IT Helpdesk: state machine + tools + branching transitions.
- E-commerce Support: SOP + knowledge + tool integration.
- Approval Agent: guards + approval chain + handoff.

### Trace Viewer

The viewer keeps a strict three-column layout:
- Left: Run list
- Middle: Timeline
- Right: Event detail

Localization:
- Viewer supports English / 中文 UI switching.
- Switching locale only changes UI labels.
- Trace event type strings and payload raw fields remain unchanged.

### Non-goals

Yutra is currently not:
- a visual workflow platform,
- a chat SaaS shell,
- a multi-tenant admin backend,
- an LLM-first orchestration system.

### Documentation Map

- [Execution Standard](docs/execution-standard.md)
- [Tool Interface](docs/tool-interface.md)
- [Knowledge Interface](docs/knowledge-interface.md)
- [LLM Interface](docs/llm-interface.md)
- [Example Walkthrough](docs/example-walkthrough.md)
- [Demo Script](docs/demo-script.md)
- [Release Checklist](docs/release-checklist.md)
- [Contributing](CONTRIBUTING.md)
- [Agent Collaboration Rules](AGENTS.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)
