[![English](https://img.shields.io/badge/Language-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red)](./README.zh-CN.md)

# Yutra

Yutra 是面向 Skill 型智能体的执行标准与参考运行时。

## 为什么是 Yutra

- Agent workflow 需要可控、可复现的执行边界。
- 纯 Prompt 编排难以治理与审计。
- 团队需要证据链来回答“什么能力在什么状态下被调用”。

## 快速开始

```bash
pnpm install
pnpm verify
pnpm certify
pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm exec yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
```

## Skill-based Demo

```bash
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra skill validate examples/ecommerce-support/skills/query-shipping
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/handoff-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
pnpm exec yutra trace export <runId> --trace-file .yutra/traces/skill-based-ecommerce.jsonl --out demo-artifacts/skill-based-ecommerce-handoff.json
```

## 核心概念

- `Skill`：能力单元与实现来源。
- `Action`：标准化调用契约。
- `State`：执行场景与转移边界。
- `Runtime`：确定性调度与执行器。
- `Trace/Audit/Certification`：可验证证据链。

Skill 不是 Agent/State 的平级对象。

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

## Examples / Packs

- `examples/it-helpdesk`
- `examples/ecommerce-support`
- `examples/approval-agent`
- `starters/minimal-agent-pack`
- `starters/support-pack`

## Trace / Audit / Certification

```bash
pnpm certify
```

- 认证采用稳定投影比对，不依赖逐字节 trace 一致。
- 认证摘要输出在 `.yutra/certification/summary.json`。

## 非目标

Yutra 当前不是：
- marketplace
- remote registry
- install workflow
- SaaS 平台 UI / 管理后台
- LLM-first 控制逻辑重写

## Contributing

- 先阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [AGENTS.md](AGENTS.md)。
- 提交 PR 前请执行 `pnpm verify`。

## License

MIT，见 [LICENSE](LICENSE)。

## 文档导航

- [English README](./README.md)
- [Conformance 与 Golden Trace](docs/conformance.md)
- [Scenario Packs 与 Starter Packs](docs/scenario-packs.md)
- [Skill-based Runtime 说明](docs/skill-based-runtime.md)
- [Skill-based Demo Path](docs/skill-based-demo-path.md)
- [Skill 认证汇总](docs/skill-certification-summary.md)
- [Release Notes v0.2.0-rc.1](docs/release-notes-v0.2.0-rc.1.md)
- [GitHub 仓库设置建议](docs/github-repo-settings.md)
- [E-commerce Skill Pack](docs/ecommerce-skill-pack.md)
- [E-commerce Demo Path](docs/ecommerce-demo-path.md)
- [E-commerce 提案骨架](docs/ecommerce-proposal-outline.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)
