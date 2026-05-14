[![English](https://img.shields.io/badge/Language-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red)](./README.zh-CN.md)

# Yutra

Yutra 是面向 Skill 型智能体的执行标准与参考运行时。

Skill 让 AI 有能力，Yutra 让这些能力按规则执行、可追踪、可治理、可审计、可认证。

Builder Core 已提供 `@yutra/builder-core`，用于把表单配置生成 AgentSpec 与中文 DSL 草案。
Basic Builder UI 已提供本地原型 `apps/builder`（非 SaaS、非多租户）。
Basic Builder UI 现已支持通过 `apps/builder-runner` 做本地 Run Preview + Trace。
AI Draft Core 已提供 `@yutra/builder-ai-core`，当前仅支持本地 mock provider（尚未接入真实 LLM）。
Builder UI 现已支持 AI Draft Assistant（需人工确认 Apply，Runtime 仍需手动 Run Preview）。
Builder Runner 现已支持可选 real provider 草案预览接口（`/ai-draft-preview`），并保持 FlowDraft-only 边界。

## 为什么是 Yutra

现代智能体越来越多地由 Skill、工具、API、函数组合而成。  
但只有能力本身还不够。

团队仍然需要回答：

- 调用了哪个 Skill？
- 在 Agent 的哪个 State 中调用？
- 受哪个 Guard 或 Policy 约束？
- 输入和输出分别是什么？
- 这次调用是被允许、拒绝、重试、移交还是审计？
- 这次行为能否复现并通过认证？

Yutra 提供的是 Skill 之上的执行层。

## Yutra 提供什么

- 用 DSL 定义 agent、state、action、transition、guard 与 context。
- 提供确定性执行的 Reference Runtime。
- 提供 Skill Core，用于本地 Skill 的加载、校验、检视、适配与执行。
- 提供治理能力，包括 policy packs、allow / deny / handoff、审批与 HITL 契约。
- 提供 Trace & Audit，支持回放、上下文差异、运行对比与审计包导出。
- 提供认证能力，支持 golden traces 与一致性检查。
- 提供场景 Packs，包括 IT Helpdesk、Approval Agent、Skill-based E-commerce Support。

## 快速开始

```bash
pnpm install
pnpm verify
pnpm certify
pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm exec yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
```

## Skill-based Demo

这个 Demo 展示了如何把本地 Skill 适配为 Yutra Action，并在 trace / audit 约束下执行。

```bash
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra skill validate examples/ecommerce-support/skills/query-shipping
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/handoff-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
pnpm exec yutra trace export <runId> --trace-file .yutra/traces/skill-based-ecommerce.jsonl --out demo-artifacts/skill-based-ecommerce-handoff.json
```

## 核心概念

| 概念 | 含义 |
|---|---|
| Skill | 能力单元与实现来源 |
| Action | 标准化调用契约 |
| State | 执行上下文与状态转移边界 |
| Guard | 运行时条件与决策门 |
| Policy | 治理层，负责 allow / deny / handoff |
| Runtime | 确定性执行引擎 |
| Trace | 执行证据 |
| Audit Bundle | 可移植的审阅产物 |
| Certification | 稳定行为校验 |

## 架构

```text
Skill / Tool / API / Function
  -> Action Adapter
  -> Yutra Action
  -> State
  -> Agent
  -> Runtime
  -> Trace / Audit / Certification
```

Skill 不是顶层的 Agent 或 State 对象。  
Skill 是 Yutra Action 背后的实现单元。

## Examples / Packs

- `examples/it-helpdesk` - 基础的有状态支持流程。
- `examples/ecommerce-support` - Skill-based 电商支持包。
- `examples/approval-agent` - 审批与人机协同流程。
- `starters/minimal-agent-pack` - 最小起步包。
- `starters/support-pack` - 面向支持场景的起步包。

## Trace / Audit / Certification

Yutra 会把执行证据记录为 trace events。

你可以：

- 回放一次运行
- 查看上下文差异
- 比较不同运行
- 导出审计包
- 用稳定 golden 投影做示例认证

```bash
pnpm certify
```

认证摘要位置：`.yutra/certification/summary.json`。

## 非目标

Yutra 当前不是：
- Skill marketplace
- remote registry
- install workflow
- SaaS dashboard
- 客服后端系统
- BI / analytics 平台
- LLM-first 编排框架
- 真实客户 API 集成层

## 文档导航

### Start Here

- [English README](./README.md)
- [Builder Core](docs/builder-core.md)
- [Builder UI（本地原型）](docs/builder-ui.md)
- [Builder Run + Trace](docs/builder-run-trace.md)
- [Builder AI Core](docs/builder-ai-core.md)
- [Builder Real LLM Provider](docs/builder-real-llm-provider.md)
- [Skill-based Runtime](docs/skill-based-runtime.md)
- [Skill-based Demo Path](docs/skill-based-demo-path.md)
- [Release Notes v0.2.0-rc.1](docs/release-notes-v0.2.0-rc.1.md)

### Concepts

- [Conformance and Golden Trace](docs/conformance.md)
- [Scenario Packs and Starter Packs](docs/scenario-packs.md)
- [Skill Certification Summary](docs/skill-certification-summary.md)

### E-commerce Pack

- [E-commerce Skill Pack](docs/ecommerce-skill-pack.md)
- [E-commerce Demo Path](docs/ecommerce-demo-path.md)
- [E-commerce Proposal Outline](docs/ecommerce-proposal-outline.md)

### Project

- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)

## Contributing

- 先阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [AGENTS.md](AGENTS.md)。
- 提交 PR 前请执行 `pnpm verify`。

## License

MIT，见 [LICENSE](LICENSE)。
