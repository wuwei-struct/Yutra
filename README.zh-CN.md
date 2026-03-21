[![English](https://img.shields.io/badge/Language-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red)](./README.zh-CN.md)

# Yutra

Yutra 是一个 Agent 执行标准与参考运行时。

## Yutra 是什么

Yutra 提供一套 execution-first 的工程闭环：
- 用标准定义可维护的执行结构；
- 用 DSL 做加载与校验；
- 用参考运行时执行状态机；
- 用 Trace 输出结构化执行过程。

## 为什么存在

- Agent workflow 太复杂。
- Prompt-only agent 不可控。
- 企业需要可追踪执行。

## 用户可以这样写（中文）

下面示例展示“用户视角”中文 DSL 写法：

```yaml
智能体: IT支持
意图:
  - name: vpn问题
    entry_state: 诊断
上下文:
  fields:
    用户ID:
      type: string
      required: true
    设备类型:
      type: string
    错误码:
      type: string
初始状态: 诊断
状态集:
  诊断:
    动作:
      - 检查网络
      - 检查账户
      - 检查证书
    转移:
      - 条件: ctx.证书过期 == true
        到: 更新证书
      - 条件: ctx.账户锁定 == true
        到: 解锁账户
      - 条件: true
        到: 通知用户
  更新证书:
    final: true
  解锁账户:
    final: true
  通知用户:
    final: true
动作:
  - name: 检查网络
  - name: 检查账户
  - name: 检查证书
```

## parser 最终会转成统一 IR

parser/normalizer 会把中文字段 alias 映射到统一 canonical schema（英文键）：

```yaml
agent: IT支持
intents:
  - name: vpn问题
    entry_state: 诊断
context:
  fields:
    用户ID:
      type: string
      required: true
    设备类型:
      type: string
    错误码:
      type: string
initial_state: 诊断
states:
  诊断:
    actions:
      - 检查网络
      - 检查账户
      - 检查证书
    transitions:
      - when: ctx.证书过期 == true
        to: 更新证书
      - when: ctx.账户锁定 == true
        to: 解锁账户
      - when: true
        to: 通知用户
  更新证书:
    final: true
  解锁账户:
    final: true
  通知用户:
    final: true
actions:
  - name: 检查网络
  - name: 检查账户
  - name: 检查证书
```

## 当前实现支持级别（设计目标 vs 当前实现）

- 设计目标：用户可写中文 DSL，底层统一为 canonical IR。
- 当前实现：
  - 已支持：字段 alias 显式映射（如 `智能体 -> agent`、`状态集 -> states`、`到 -> to`、`条件 -> when`）。
  - 已支持：中文名称可做确定性 canonicalization（agent/intents/context fields/states/actions/guards）。
  - 未实现：任意中文“值语义”自动翻译/归一化（不会对自由文本做智能翻译）。

可调试命令：

```bash
pnpm exec yutra dsl explain examples/it-helpdesk/agent.zh-CN.yutra.yaml
pnpm exec yutra dsl inspect examples/it-helpdesk/agent.zh-CN.yutra.yaml --json
```

## English DSL Example

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

## 中文 DSL 示例（可校验/可运行的 it-helpdesk 版本）

```yaml
智能体: IT支持
版本: 0.1.0
意图:
  - name: 处理工单
    entry_state: 诊断
初始状态: 诊断
状态集:
  诊断:
    动作:
      - lookup_ticket
    转移:
      - 到: 已解决
        条件: ctx.ticket_has_solution == true
  已解决:
    动作:
      - close_ticket
    final: true
动作:
  - name: lookup_ticket
  - name: close_ticket
```

## 快速开始

```bash
pnpm install
pnpm verify
pnpm certify
pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm exec yutra validate examples/it-helpdesk/agent.zh-CN.yutra.yaml
pnpm exec yutra dsl explain examples/it-helpdesk/agent.zh-CN.yutra.yaml
pnpm exec yutra dsl inspect examples/it-helpdesk/agent.zh-CN.yutra.yaml --json
pnpm exec yutra run examples/it-helpdesk/agent.zh-CN.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
pnpm exec yutra trace list --trace-file .yutra/traces/events.jsonl
pnpm --filter @yutra/viewer dev
```

## 一致性与 Golden Trace

Yutra 提供本地一致性认证与 golden trace 投影比对：

```bash
pnpm certify
```

认证结果输出到：
- `.yutra/certification/summary.json`

## 示例矩阵

- IT Helpdesk：状态机 + 工具调用 + 分支转移。
- E-commerce Support：客服 SOP + knowledge + tool。
- Approval Agent：guard + 审批链 + handoff。

## 已认证 Scenario Packs

- `examples/it-helpdesk`（`it-helpdesk-pack`）
- `examples/ecommerce-support`（`ecommerce-support-pack`）
- `examples/approval-agent`（`approval-agent-pack`）

每个 pack 都包含 `pack.manifest.json`，用于描述入口 DSL、包含资源与认证场景引用。

## Starter Packs

- `starters/minimal-agent-pack`：最小可复制起步模板
- `starters/support-pack`：支持类流程起步模板（含可选 policy 占位）

详见：[docs/scenario-packs.md](docs/scenario-packs.md)

## Trace Viewer

Viewer 保持最小三栏结构：
- 左：Run list
- 中：Timeline
- 右：Event detail

本地化说明：
- Viewer supports English / 中文 UI switching.
- Switching locale only changes UI labels.
- Trace event type strings and payload raw fields remain unchanged.

## 非目标

Yutra 当前不是：
- 可视化工作流平台
- 聊天 SaaS 壳子
- 多租户后台
- LLM-first orchestration system

## 文档导航

- [English README](./README.md)
- [DSL Authoring 指南](docs/dsl-authoring.md)
- [Conformance 与 Golden Trace](docs/conformance.md)
- [Scenario Packs 与 Starter Packs](docs/scenario-packs.md)
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
