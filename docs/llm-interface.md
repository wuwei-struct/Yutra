# LLM Interface v0.1

## 接口目的

定义 LLM 作为可插拔文本生成组件的最小契约，不让 LLM 接管执行主流程。

## 最小类型定义

- `LLMProvider`
- `LLMRequest`
- `LLMResponse`

核心入口：

- `provider.generate({ prompt, system, metadata })`

## 官方参考实现

- `mock_llm_provider`（可用，确定性返回）
- `noop_llm_provider`（可选，明确禁用）

## 与 Runtime 的边界

- LLM 仅提供文本输出。
- Runtime 的状态推进不由 LLM 决策。
- 不存在 prompt-first 控制链。

## 极小示例

```ts
import { MockLLMProvider } from "@yutra/llm-core";

const llm = new MockLLMProvider({
  rules: [{ contains: "resolve", response: "intent:resolve_ticket" }],
  fallback: "intent:unknown"
});

const res = await llm.generate({ prompt: "please resolve ticket" });
```
