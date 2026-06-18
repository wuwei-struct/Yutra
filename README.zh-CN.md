[![English](https://img.shields.io/badge/Language-English-blue)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red)](./README.zh-CN.md)

# Yutra

Yutra 是面向 Skill 型智能体的执行标准、运行时与构建器。

Yutra 下一阶段将升级为智能体创建层：
智能体母型库 + 业务规则配置器 + Rule Compiler + Creator Workbench。

当前状态与下一阶段方向需要明确区分：Skill-based Runtime 与 Studio 是当前已存在能力；智能体创建层是本仓库文档化的下一阶段方向。

Skill 提供能力。Yutra 让这些能力以标准方式执行、治理、追踪、审计和认证。

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
- Yutra Studio：本地 Agent Editor Workbench 原型。

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

## 快速开始

```bash
pnpm install
pnpm verify
pnpm certify
pnpm exec yutra validate examples/it-helpdesk/agent.yutra.yaml
pnpm exec yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json
pnpm builder:runner
pnpm builder:dev
```

## Yutra Studio

Yutra Studio 是本地单用户工作台原型，用于把 Builder Core、AI Draft、DSL Editor、Run Preview、Trace 与 Audit 放到同一个 Agent Editor Workbench 中。

当前支持：

- 左侧导航栏与顶部操作栏
- AI Draft Assistant
- Creator Workbench Compile Preview：基于公开 `request-resolution` demo Pack Config 预览编译产物
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

入口文档：

- [vNext Charter](docs/vnext-charter.md)
- [Agent Archetype Library](docs/archetype-library.md)
- [Archetype Core](docs/archetype-core.md)
- [Business Rule Config](docs/business-rule-config.md)
- [Pack Config Core](docs/pack-config-core.md)
- [Rule Compiler Overview](docs/rule-compiler-overview.md)
- [Rule Compiler Core](docs/rule-compiler-core.md)
- [Rule Compiler CLI](docs/rule-compiler-cli.md)
- [Creator Workbench](docs/creator-workbench.md)
- [vNext Roadmap](docs/vnext-roadmap.md)

本地 demo/mock artifact 导出：

```bash
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution
```

该命令只导出 compiler artifacts，不运行 Runtime，也不发布 Agent。

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
- [Archetype Core](docs/archetype-core.md)
- [Business Rule Configuration](docs/business-rule-config.md)
- [Pack Config Core](docs/pack-config-core.md)
- [Rule Compiler Overview](docs/rule-compiler-overview.md)
- [Rule Compiler Core](docs/rule-compiler-core.md)
- [Rule Compiler CLI](docs/rule-compiler-cli.md)
- [Creator Workbench](docs/creator-workbench.md)
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
