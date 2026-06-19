export const BEHAVIOR_PRIMITIVE_IDS = [
  "collect",
  "retrieve",
  "evaluate",
  "execute",
  "generate",
  "route",
  "monitor",
  "handoff",
  "audit",
  "feedback"
] as const;

export type BehaviorPrimitiveId = (typeof BEHAVIOR_PRIMITIVE_IDS)[number];

export type RuntimeStructureRef = "action" | "guard" | "transition" | "trace_event" | "policy" | "template" | "test_case";

export type BehaviorPrimitiveDefinition = {
  primitiveId: BehaviorPrimitiveId;
  name: {
    en: string;
    zhCN: string;
  };
  summary: {
    en: string;
    zhCN: string;
  };
  commonRuntimeStructures: RuntimeStructureRef[];
};

export const BUILTIN_BEHAVIOR_PRIMITIVES: BehaviorPrimitiveDefinition[] = [
  {
    primitiveId: "collect",
    name: { en: "Collect", zhCN: "收集" },
    summary: { en: "Gather required information, evidence, or context before work can proceed.", zhCN: "在流程继续前收集必要信息、证据或上下文。" },
    commonRuntimeStructures: ["action", "guard", "transition", "trace_event"]
  },
  {
    primitiveId: "retrieve",
    name: { en: "Retrieve", zhCN: "检索" },
    summary: { en: "Fetch controlled knowledge, records, or business object state.", zhCN: "检索受控知识、记录或业务对象状态。" },
    commonRuntimeStructures: ["action", "policy", "trace_event"]
  },
  {
    primitiveId: "evaluate",
    name: { en: "Evaluate", zhCN: "判断" },
    summary: { en: "Compare context against rules, thresholds, eligibility, or risk.", zhCN: "根据规则、阈值、资格或风险判断上下文。" },
    commonRuntimeStructures: ["guard", "policy", "transition", "trace_event"]
  },
  {
    primitiveId: "execute",
    name: { en: "Execute", zhCN: "执行" },
    summary: { en: "Perform an allowed business action or side-effect through a governed path.", zhCN: "通过受治理路径执行被允许的业务动作或副作用。" },
    commonRuntimeStructures: ["action", "policy", "trace_event"]
  },
  {
    primitiveId: "generate",
    name: { en: "Generate", zhCN: "生成" },
    summary: { en: "Produce a response, document, summary, template output, or structured artifact.", zhCN: "生成回复、文档、摘要、模板输出或结构化产物。" },
    commonRuntimeStructures: ["action", "template", "trace_event"]
  },
  {
    primitiveId: "route",
    name: { en: "Route", zhCN: "路由" },
    summary: { en: "Choose the next state, queue, handler, or escalation path.", zhCN: "选择下一个状态、队列、处理方或升级路径。" },
    commonRuntimeStructures: ["transition", "guard", "policy"]
  },
  {
    primitiveId: "monitor",
    name: { en: "Monitor", zhCN: "监控" },
    summary: { en: "Observe a signal, threshold, event, or condition over time.", zhCN: "持续观察信号、阈值、事件或条件。" },
    commonRuntimeStructures: ["action", "guard", "trace_event", "policy"]
  },
  {
    primitiveId: "handoff",
    name: { en: "Handoff", zhCN: "协同" },
    summary: { en: "Transfer a blocked, risky, or review-required path to a human or external reviewer.", zhCN: "将受阻、高风险或需审核路径交给人工或外部审核方。" },
    commonRuntimeStructures: ["action", "transition", "trace_event", "policy"]
  },
  {
    primitiveId: "audit",
    name: { en: "Audit", zhCN: "记录审计" },
    summary: { en: "Record evidence for replay, review, accountability, and certification.", zhCN: "记录用于回放、审阅、问责和认证的证据。" },
    commonRuntimeStructures: ["trace_event", "policy"]
  },
  {
    primitiveId: "feedback",
    name: { en: "Feedback", zhCN: "复盘优化" },
    summary: { en: "Convert outcomes and review feedback into future rule, template, or test improvements.", zhCN: "将结果和审阅反馈转化为后续规则、模板或测试改进。" },
    commonRuntimeStructures: ["trace_event", "policy", "test_case"]
  }
];

export function isBehaviorPrimitiveId(input: string): input is BehaviorPrimitiveId {
  return (BEHAVIOR_PRIMITIVE_IDS as readonly string[]).includes(input);
}
