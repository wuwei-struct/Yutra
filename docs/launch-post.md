# Yutra Launch Post Draft

## 100 字版

Yutra is an Agent Execution Standard and Reference Runtime。它把 Agent 执行过程明确建模为 State / Guard / Action / Transition，并提供可追踪 trace。你可以直接运行 it-helpdesk、ecommerce-support、approval-agent 三个示例，并在最小 Trace Viewer 里查看 completed 与 handoff 的完整执行时间线。

## 300 字版

Yutra is an Agent Execution Standard and Reference Runtime。
这个项目解决的是“Agent 能说很多，但执行不可控”的问题。Yutra 不走 prompt-first 路线，而是先定义执行标准，再用参考运行时按状态机闭环执行。每一步包含 guard 判断、action 执行、transition 跳转，并记录结构化 trace，方便排错和复盘。

当前版本包含：Execution Standard v0.1、DSL loader/validator、Runtime、Trace Core、最小 CLI、tool/knowledge/llm interfaces、三个可运行示例，以及一个三栏 Trace Viewer（Run List / Timeline / Event Detail，支持中英切换）。

Yutra 不是可视化流程平台，不是聊天 SaaS，也不是多租户后台，更不是让 LLM 接管主流程的编排系统。它是一套 execution-first 的标准和参考实现，目标是让开发者第一次 clone 就能跑起来、看得懂、改得动。

## 800 字版

Yutra is an Agent Execution Standard and Reference Runtime。

我们把它定义成“标准 + 运行时”的组合，而不是一个泛化平台。原因很直接：很多 Agent 项目在 demo 阶段看起来强，但一到真实流程就会遇到可控性、可追踪性和可维护性问题。Yutra 的取舍是先收敛，再扩展。

在执行模型上，Yutra 明确以 State / Guard / Action / Transition 为主轴。输入进入后，先做意图解析与初始状态选择，再按状态执行动作、更新上下文、解析转移条件，直到进入 final、handoff 或 failed。这个过程不是“让大模型临场发挥”，而是可预测、可验证、可复盘的执行闭环。

在工程层面，当前版本已经形成一条完整链路：
- `@yutra/spec` 提供执行标准最小类型与 schema
- `@yutra/dsl` 负责 YAML/JSON 加载、规范化和合法性校验
- `@yutra/runtime` 负责闭环执行
- `@yutra/trace` 负责事件记录与读取
- `@yutra/cli` 提供 `validate / run / trace list / trace show`
- `@yutra/viewer` 提供本地最小可视化（Run 列表、时间线、事件详情）

示例矩阵也有明确分工：
- IT Helpdesk：状态机 + 工具 + 分支
- E-commerce Support：SOP + knowledge + tool
- Approval Agent：guard + handoff + 审批链

这三个示例都可以用同一套 CLI 直接运行，并产出可查看的 trace JSONL。你既可以从命令行看结构化结果，也可以在 Viewer 里逐步点击事件，观察一次执行是如何从 `state.entered` 到 `action.succeeded`，再到 `transition.resolved` 和最终 `run.completed` 或 `handoff.requested`。

当前版本仍有明确边界：本地优先、无远程 trace server、无生产级 connector 生态，approval/ticket/vector adapter 仍保留 stub 成分。我们没有把这些限制包装成“即将支持的一切平台能力”，而是明确告诉你：这是一套 execution-first 的参考实现，用于建立稳定基线。

如果你希望快速判断 Yutra 是否值得继续投入，最好的方式不是看口号，而是本地跑三个示例，再打开 Viewer 看两条 trace：一条 completed，一条 handoff。看完这两条，你会很快知道它是不是你要的那类 Agent 基础设施。
