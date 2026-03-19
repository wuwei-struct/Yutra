# Tool Interface v0.1

## 接口目的

定义工具如何以稳定方式接入 Yutra 执行链，保持 runtime 的 state/action/transition 主导。

## 最小类型定义

- `Tool<Input, Output>`
- `ToolRunContext`
- `ToolResult<T>`
- `ToolRegistry`

核心入口：

- `tool.run(input, ctx)`
- `registry.register/get/list/has`

## 官方参考实现

- `function_tool`（可用）
- `http_tool`（最小 fetch 封装）
- `approval_tool`（stub）
- `ticket_tool`（stub）

## 与 Runtime 的边界

- Runtime 仍由状态机驱动。
- Tool 仅在 action 执行时被调用。
- Tool 不决定状态推进。

## 极小示例

```ts
import { createFunctionTool } from "@yutra/tool-core";

const sumTool = createFunctionTool<{ a: number; b: number }, { total: number }>({
  name: "sum",
  handler: async (input) => ({ ok: true, data: { total: input.a + input.b } })
});
```
