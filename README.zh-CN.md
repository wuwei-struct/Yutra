[![English](https://img.shields.io/badge/Language-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red)](./README.zh-CN.md)

# Yutra

Yutra 是一个开源的可治理智能体创建与执行框架。

它通过智能体母型、业务规则配置、Rule Compiler、DSL、Runtime、Trace、Audit 与 Certification，把业务规则转化为可执行、可追踪、可审计的 Agent。

Skill 提供能力，Yutra 让这些能力以结构化、可治理、可追踪、可审计、可认证的方式运行。

当前状态：
Yutra 当前已提供可治理智能体创建与执行框架的开源核心，包括 DSL、Runtime、Trace/Audit/Certification、Skill Runtime、Archetype Core、Pack Config Core、Rule Compiler、CLI 与 Yutra Studio。

下一阶段方向：
Yutra 正在升级为更完整的智能体创建层：
智能体母型库 + 业务规则配置器 + Rule Compiler + Creator Workbench。

Yutra 将行为原语、产物型主母型与场景组合范式分层，避免把每个业务场景都升级成新的母型。

当前状态与下一阶段方向需要明确区分：开源核心已经存在；完整企业 SaaS、Marketplace、托管控制台和真实客户 API 接入并未在本仓库中实现。

## 为什么需要 Yutra

现代智能体越来越多地由 Skill、工具、API 和函数组成。但“有能力”不等于“可控执行”。

Yutra 关注这些问题：

- 哪个 Skill 被调用？
- 在哪个 Agent 状态中调用？
- 受哪个 Guard 或 Policy 约束？
- 输入和输出是什么？
- 调用是被允许、拒绝、重试、转人工，还是进入审计？
- 行为能否复现并通过认证？

## Yutra 提供什么

- DSL：定义 Agent、State、Action、Transition、Guard 和 Context。
- Reference Runtime：确定性执行状态机。
- Skill Core：加载、校验、检查、适配和执行本地 Skill。
- Governance：policy pack、allow / deny / handoff、approval 与 HITL 合同。
- Trace & Audit：回放、context diff、run compare、audit bundle。
- Certification：golden trace 与一致性检查。
- CLI。
- Yutra Studio：本地 Agent Editor Workbench 原型。
- AI Draft。
- DSL Inspect / Run Preview。
- Archetype Core。
- Pack Config Core。
- Rule Compiler Core。
- Rule Compiler CLI。
- Creator Workbench Compile Preview。
- Creator Workbench UI 信息架构整理。
- Creator Workbench taxonomy-aware 母型选择体验。
- Creator Workbench 当前支持三个 demo-enabled 产物型主母型：`request-resolution`、`approval-decision` 与 `knowledge-answering`。
- `@yutra/archetype-core` 中的 Archetype Taxonomy metadata。
- Rule Impact Explanation。
- Certification Readiness Preview。
- Compiled DSL manual bridge。
- Certification Readiness Panel 中的手动 Run Preview Evidence。
- approval-decision 第二母型支持（Pack Config + Rule Compiler + CLI + Creator Workbench demo UI）。
- knowledge-answering 第三母型支持（Pack Config + Rule Impact + Rule Compiler + CLI + Creator Workbench demo UI）。

## 开源边界

### 开源核心底座

当前仓库开源：

- DSL / Canonical IR
- Reference Runtime
- Trace / Replay / Audit
- Governance / Policy / Handoff / Approval 合同
- Skill Core / Skill Runtime
- CLI
- 基础 Viewer / Studio
- 示例 Pack 与 Starter Pack
- Conformance / Certification 测试
- vNext 母型库与 Rule Compiler 方向文档

### 商业 / 实施层

未来商业或私有实施层可能包括：

- 真实客户 Adapter
- 企业级 Policy Pack
- 高级行业 Pack
- 托管 Trace / Audit Dashboard
- 私有化部署模板
- 客户专属 SOP / 模板 / 配置
- UAT / 灰度 / 交付 Playbook
- 企业支持与实施服务

### 原则

Yutra 的执行标准与参考运行时保持透明；商业价值如果后续推进，主要来自真实系统接入、行业包、私有化部署、治理咨询与实施交付。

详见 [Open Source Boundary](docs/open-source-boundary.md)。

公开示例仅为 mock/demo。报价、proposal、UAT、上线计划、客户专属 SOP 与生产接入资产不属于 public core。详见 [Public Demo Boundary](docs/public-demo-boundary.md)。

## 快速开始

```bash
pnpm install
pnpm verify
pnpm certify
pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm exec yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution --dry-run
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution --force
pnpm exec yutra compile examples/approval-decision-basic/pack.config.json --out .tmp/compiled-approval-decision --dry-run
pnpm exec yutra compile examples/knowledge-answering-basic/pack.config.json --out .tmp/compiled-knowledge-answering --dry-run
pnpm builder:runner
pnpm builder:dev
```

## Yutra Studio

Yutra Studio 是本地单用户工作台原型，用于把 Builder Core、AI Draft、DSL Editor、Run Preview、Trace 与 Audit 放到同一个 Agent Editor Workbench 中。

当前支持：

- 左侧导航栏与顶部操作栏
- AI Draft Assistant
- Creator Workbench Compile Preview：基于公开 `request-resolution`、`approval-decision` 与 `knowledge-answering` demo Pack Config 预览编译产物
- Creator Workflow：选择母型 -> 配置业务规则 -> 查看规则影响 -> 编译预览 -> 发送到 DSL 编辑器 -> 手动检查 DSL -> 手动应用 DSL -> 手动运行预览 -> 查看 Trace / Audit
- Rule Impact Explanation：解释公开 `request-resolution`、`approval-decision` 与 `knowledge-answering` demo 字段会影响哪些 Guard / Action / Transition / Policy / Trace Expectation
- Certification Readiness Preview：基于 demo/mock compile output 展示认证准备度；不运行 Runtime，也不声明生产就绪
- 手动 Run Preview Evidence：用户手动运行预览后展示 runId / event count / trace / audit evidence；不让正式认证门禁变为 ready
- 可将编译出的 `agent.yutra.yaml` 手动发送到 DSL 编辑器
- DSL 编辑器：Validate DSL、Inspect DSL、Apply DSL as Run Source
- AgentSpec JSON 预览
- Validation / Normalized / Canonical IR / Overview 检查面板
- Run Preview、Trace 时间线、事件详情、Audit 摘要
- 顶部栏支持 English / 中文 UI 切换

Source Mode：

- Builder Source：`BuilderFormConfig -> AgentSpec -> Runtime Preview`
- DSL Source：`DSL text -> /dsl/inspect -> normalized -> canonical AgentSpec -> Runtime Preview`

当前不支持：

- 真实保存或发布
- 登录、数据库、多租户后台
- Compile Preview 不运行 Runtime、不写 artifacts、不连接真实 adapter
- 编译 DSL 必须先检查并手动应用，才能进入 Run Preview
- DSL 反向完整回填 BuilderFormConfig
- 拖拽式流程编辑器
- 真实客户 API 接入

语言切换只影响 UI 文案。DSL、Trace 事件类型、payload 原始字段和 canonical IR 不会被翻译或改写。

## 下一阶段方向

Yutra vNext 的重点不是继续堆具体场景包，而是增加一层智能体创建层：

```text
智能体母型库
+ 业务规则配置器
+ Rule Compiler
+ Creator Workbench
+ Run Preview / Trace / Certification
```

目标是让客户面对业务规则，而不是直接面对 DSL。DSL 仍然作为系统背后的确定性中间层。

下一阶段仍保持 Runtime execution-first。客户面对业务规则，Yutra 在后台生成 DSL、policy、templates、tests 和 trace expectations。
LLM 可以生成配置草案，但不能绕过 Compiler、Runtime、Trace、Audit 或 Certification 链路。

## vNext Preview 发布说明

- [v0.3.0-vnext-preview.1 发布说明](docs/releases/v0.3.0-vnext-preview.1.md)
- [vNext Preview 发布说明](docs/release-notes-vnext-preview.md)
- [vNext Preview Release Candidate](docs/vnext-preview-release-candidate.md)

入口文档：

- [vNext Charter](docs/vnext-charter.md)
- [Agent Archetype Library](docs/archetype-library.md)
- [Archetype Taxonomy](docs/archetype-taxonomy.md)
- [Scenario Pattern Core](docs/scenario-pattern-core.md)
- [Scenario Composition Contract](docs/scenario-composition-contract.md)
- [Scenario Composition Compile Preview](docs/scenario-composition-compile-preview.md)
- [Creator Archetype Selection](docs/creator-archetype-selection.md)
- [Archetype Core](docs/archetype-core.md)
- [Business Rule Config](docs/business-rule-config.md)
- [Pack Config Core](docs/pack-config-core.md)
- [Rule Compiler Overview](docs/rule-compiler-overview.md)
- [Rule Compiler Core](docs/rule-compiler-core.md)
- [Rule Compiler CLI](docs/rule-compiler-cli.md)
- [Rule Impact Explanation](docs/rule-impact-explanation.md)
- [Certification Readiness Preview](docs/certification-readiness-preview.md)
- [vNext Preview Release Notes](docs/release-notes-vnext-preview.md)
- [Approval Decision Basic Demo](docs/approval-decision-basic.md)
- [Knowledge Answering Basic Demo](docs/knowledge-answering-basic.md)
- [Creator Workbench](docs/creator-workbench.md)
- [Creator Workbench UI](docs/creator-workbench-ui.md)
- [vNext Roadmap](docs/vnext-roadmap.md)

本地 demo/mock artifact 导出：

```bash
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution --dry-run
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution --force
pnpm exec yutra compile examples/approval-decision-basic/pack.config.json --out .tmp/compiled-approval-decision --dry-run
pnpm exec yutra compile examples/knowledge-answering-basic/pack.config.json --out .tmp/compiled-knowledge-answering --dry-run
```

该命令只导出 compiler artifacts，不运行 Runtime，也不发布 Agent。
`approval-decision` 现在已在 Creator Workbench 中 demo-enabled。它仍仅限 mock/demo，不连接真实审批系统，并且仍需手动发送到 DSL Editor、Inspect、Apply 与 Run。
`knowledge-answering` 现在已在 Creator Workbench 中 demo-enabled。它仍仅限 mock/demo，不调用真实 LLM，不连接真实 RAG 或知识库 provider，并且仍需手动发送到 DSL Editor、Inspect、Apply 与 Run。
Creator Workbench UI 已整理为 Header、母型与业务规则、规则解释、编译预览、准备度与证据五个区域。它仍仅限 demo/mock，不会自动运行 Runtime，也不代表生产就绪。

## Skill-based Demo

```bash
pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills
pnpm exec yutra skill validate examples/ecommerce-support/skills/query-shipping
pnpm exec yutra skill inspect examples/ecommerce-support/skills/query-shipping --as-action
pnpm exec yutra run examples/ecommerce-support/agent.skill.yutra.yaml --input examples/ecommerce-support/demo-inputs/shipping-case.json --skills-dir examples/ecommerce-support/skills --trace-file .yutra/traces/skill-based-ecommerce.jsonl
```

## Trace / Audit / Certification

Yutra 会把执行证据记录为 trace events。

你可以：

- 回放一次运行
- 查看上下文变化
- 比较不同运行
- 导出 audit bundle
- 用 golden trace 投影做示例认证

```bash
pnpm certify
```

认证摘要位置：`.yutra/certification/summary.json`。

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

Skill 不是顶层 Agent 或 State 对象。Skill 是 Yutra Action 背后的标准实现单元。

## Examples / Packs

- `examples/it-helpdesk`：基础状态化支持流程。
- `examples/ecommerce-support`：Skill-based 电商售后支持包。
- `examples/approval-decision-basic`：approval-decision compiler 链路的 demo/mock Pack Config。
- `examples/knowledge-answering-basic`：knowledge-answering compiler 链路的 demo/mock Pack Config。
- `examples/approval-agent`：审批与 human-in-the-loop 流程。
- `starters/minimal-agent-pack`：最小起步包。
- `starters/support-pack`：面向支持场景的起步包。

## 非目标

Yutra 当前不是：

- Marketplace
- 远程 Skill Registry
- Install Workflow
- 多租户 SaaS 平台
- 客服后台
- BI / 数据分析平台
- 完整无代码工作流平台
- LLM-first 编排框架
- 真实客户 API 接入包
- 托管企业控制台

## 文档导航

### 入门

- [English README](./README.md)
- [Yutra Studio](docs/yutra-studio.md)
- [DSL Editor Roundtrip / Inspect](docs/dsl-editor-roundtrip.md)
- [Builder UI / Yutra Studio](docs/builder-ui.md)
- [Builder Run + Trace](docs/builder-run-trace.md)
- [Builder Core](docs/builder-core.md)
- [Builder AI Core](docs/builder-ai-core.md)
- [Builder Real LLM Provider](docs/builder-real-llm-provider.md)
- [Skill-based Runtime](docs/skill-based-runtime.md)
- [Skill-based Demo Path](docs/skill-based-demo-path.md)
- [Conformance and Golden Trace](docs/conformance.md)
- [Scenario Packs and Starter Packs](docs/scenario-packs.md)

### vNext

- [vNext Charter](docs/vnext-charter.md)
- [Agent Archetype Library](docs/archetype-library.md)
- [Archetype Taxonomy](docs/archetype-taxonomy.md)
- [Scenario Pattern Core](docs/scenario-pattern-core.md)
- [Scenario Composition Contract](docs/scenario-composition-contract.md)
- [Scenario Composition Compile Preview](docs/scenario-composition-compile-preview.md)
- [Creator Archetype Selection](docs/creator-archetype-selection.md)
- [Archetype Core](docs/archetype-core.md)
- [Business Rule Configuration](docs/business-rule-config.md)
- [Pack Config Core](docs/pack-config-core.md)
- [Rule Compiler Overview](docs/rule-compiler-overview.md)
- [Rule Compiler Core](docs/rule-compiler-core.md)
- [Rule Compiler CLI](docs/rule-compiler-cli.md)
- [Rule Impact Explanation](docs/rule-impact-explanation.md)
- [Certification Readiness Preview](docs/certification-readiness-preview.md)
- [vNext Preview Release Notes](docs/release-notes-vnext-preview.md)
- [Approval Decision Basic Demo](docs/approval-decision-basic.md)
- [Knowledge Answering Basic Demo](docs/knowledge-answering-basic.md)
- [Creator Workbench](docs/creator-workbench.md)
- [Creator Workbench UI](docs/creator-workbench-ui.md)
- [vNext Roadmap](docs/vnext-roadmap.md)

### E-commerce Pack

- [E-commerce Skill Pack](docs/ecommerce-skill-pack.md)
- [E-commerce Demo Path](docs/ecommerce-demo-path.md)

详细报价、提案、UAT、灰度和客户交付 Playbook 不作为公开入口。客户专属或可直接商业复用的实施资产应放入私有交付仓库。

### 开源与商业边界

- [Open Source Boundary](docs/open-source-boundary.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)
- [License](LICENSE)

## License

MIT，见 [LICENSE](LICENSE)。
