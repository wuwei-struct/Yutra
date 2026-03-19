# Knowledge Interface v0.1

## 接口目的

定义知识查询组件如何向 runtime 提供检索结果，不把知识层变成执行控制层。

## 最小类型定义

- `KnowledgeProvider`
- `KnowledgeContext`
- `KnowledgeQueryInput`
- `KnowledgeResult`

核心入口：

- `provider.query({ query, topK, filters }, ctx)`

## 官方参考实现

- `memory_kb`（可用）
- `file_kb`（可用）
- `vector_adapter_stub`（stub）

## 与 Runtime 的边界

- Knowledge provider 只返回结果，不推进状态。
- Runtime 决定何时查询与如何消费结果。

## 极小示例

```ts
import { MemoryKnowledgeProvider } from "@yutra/knowledge-core";

const kb = new MemoryKnowledgeProvider([
  { id: "k1", content: "Reset password SOP" }
]);

const results = await kb.query({ query: "password" }, {
  runId: "run-1",
  agent: "helpdesk-agent",
  context: {}
});
```
