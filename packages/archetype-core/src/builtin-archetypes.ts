import type { CapabilityAtom } from "./capability-atom";
import {
  DEFAULT_CONTEXT_POLICY,
  DEFAULT_FAILURE_POLICY,
  DEFAULT_GUARD_POLICY,
  DEFAULT_SIDE_EFFECT_POLICY,
  DEFAULT_TRACE_POLICY,
  type CompositionMode
} from "./composition-contract";
import type { CrossCuttingArchetypeId } from "./ids";
import type { ArchetypeKind, ArchetypeManifest } from "./types";

type BuiltinInput = {
  id: ArchetypeManifest["archetypeId"];
  kind: ArchetypeKind;
  name: ArchetypeManifest["name"];
  summary: ArchetypeManifest["summary"];
  coreFlow: string[];
  commonScenarios: string[];
  commonRules: string[];
  compatibleCrossCutting?: CrossCuttingArchetypeId[];
  recommendedCompositions?: CompositionMode[];
  capability: CapabilityAtom;
};

function governance(): ArchetypeManifest["defaultGovernance"] {
  return {
    contextPolicy: { ...DEFAULT_CONTEXT_POLICY },
    guardPolicy: { ...DEFAULT_GUARD_POLICY, priority: [...DEFAULT_GUARD_POLICY.priority] },
    failurePolicy: DEFAULT_FAILURE_POLICY,
    tracePolicy: DEFAULT_TRACE_POLICY,
    sideEffectPolicy: { ...DEFAULT_SIDE_EFFECT_POLICY }
  };
}

function manifest(input: BuiltinInput): ArchetypeManifest {
  return {
    archetypeId: input.id,
    archetypeVersion: "0.1.0",
    kind: input.kind,
    name: input.name,
    summary: input.summary,
    coreFlow: input.coreFlow,
    commonScenarios: input.commonScenarios,
    commonRules: input.commonRules,
    capabilities: [input.capability],
    inputs: ["business_context", "user_or_system_request"],
    outputs: ["structured_outcome", "traceable_evidence"],
    compatibleCrossCutting: input.compatibleCrossCutting,
    recommendedCompositions: input.recommendedCompositions ?? ["sequence", "routing"],
    defaultGovernance: governance(),
    publicExposure: {
      level: "base",
      containsCustomerAssets: false,
      containsRealEndpoints: false,
      containsCommercialSop: false
    }
  };
}

function capability(id: string, en: string, zhCN: string, sideEffectLevel: CapabilityAtom["sideEffectLevel"] = "read"): CapabilityAtom {
  return {
    id,
    label: { en, zhCN },
    businessObjects: ["generic_record"],
    inputs: ["context"],
    outputs: ["decision_or_result"],
    commonActions: ["inspect", "classify", "respond"],
    commonGuards: ["required_fields_present", "policy_allowed"],
    sideEffectLevel,
    requiresPolicyGuard: sideEffectLevel !== "none" && sideEffectLevel !== "read",
    requiresAudit: true
  };
}

export const BUILTIN_ARCHETYPE_MANIFESTS: ArchetypeManifest[] = [
  manifest({
    id: "intake-collector",
    kind: "main",
    name: { en: "Intake Collector", zhCN: "信息采集型" },
    summary: { en: "Collect required information before work proceeds.", zhCN: "在流程继续前采集必要信息。" },
    coreFlow: ["start intake", "validate required fields", "request missing information", "confirm completeness"],
    commonScenarios: ["onboarding intake", "support request intake", "pre-check collection"],
    commonRules: ["required fields", "retry count", "missing-field strategy", "validation failure strategy"],
    compatibleCrossCutting: ["human-handoff", "policy-guard", "adapter-connector"],
    capability: capability("collect-required-fields", "Collect required fields", "采集必要字段", "none")
  }),
  manifest({
    id: "knowledge-answering",
    kind: "main",
    name: { en: "Knowledge Answering", zhCN: "知识问答型" },
    summary: { en: "Answer questions from controlled knowledge sources.", zhCN: "基于受控知识源回答问题。" },
    coreFlow: ["classify question", "retrieve knowledge", "select response template", "escalate if confidence or policy fails"],
    commonScenarios: ["FAQ answer", "policy explanation", "internal knowledge lookup"],
    commonRules: ["allowed sources", "confidence threshold", "no-answer behavior", "citation requirement"],
    compatibleCrossCutting: ["human-handoff", "policy-guard", "feedback-optimization"],
    capability: capability("retrieve-controlled-knowledge", "Retrieve controlled knowledge", "检索受控知识", "read")
  }),
  manifest({
    id: "request-resolution",
    kind: "main",
    name: { en: "Request Resolution", zhCN: "请求处理型" },
    summary: { en: "Resolve a request through rules, adapters, actions, and response.", zhCN: "通过规则、接入、动作和回复处理请求。" },
    coreFlow: ["triage request", "fetch business object", "evaluate eligibility", "execute allowed action", "respond or hand off"],
    commonScenarios: ["refund overview", "return overview", "address change", "invoice request", "appointment reschedule"],
    commonRules: ["object status", "time window", "amount threshold", "adapter failure strategy", "exception handoff"],
    compatibleCrossCutting: ["human-handoff", "policy-guard", "adapter-connector"],
    capability: capability("resolve-business-request", "Resolve business request", "处理业务请求", "write")
  }),
  manifest({
    id: "approval-decision",
    kind: "main",
    name: { en: "Approval Decision", zhCN: "审批裁决型" },
    summary: { en: "Decide whether a requested action can proceed.", zhCN: "判断请求动作是否可以继续。" },
    coreFlow: ["intake request", "validate risk", "check policy", "request approval if needed", "approve deny or escalate"],
    commonScenarios: ["access approval", "discount approval", "configuration change approval"],
    commonRules: ["risk level", "approval threshold", "approver requirement", "expiry", "escalation rule"],
    compatibleCrossCutting: ["human-handoff", "policy-guard", "adapter-connector"],
    capability: capability("evaluate-approval", "Evaluate approval decision", "评估审批决策", "approval")
  }),
  manifest({
    id: "diagnostic-resolution",
    kind: "main",
    name: { en: "Diagnostic Resolution", zhCN: "诊断排障型" },
    summary: { en: "Diagnose a problem through checks and resolution steps.", zhCN: "通过检查和处理步骤诊断问题。" },
    coreFlow: ["collect symptoms", "run checks", "classify cause", "apply recommendation", "escalate if unresolved"],
    commonScenarios: ["IT helpdesk", "device troubleshooting", "incident triage"],
    commonRules: ["diagnostic tree", "check order", "max attempts", "critical issue handoff"],
    compatibleCrossCutting: ["human-handoff", "policy-guard", "adapter-connector"],
    capability: capability("run-diagnostic-checks", "Run diagnostic checks", "执行诊断检查", "read")
  }),
  manifest({
    id: "process-orchestration",
    kind: "main",
    name: { en: "Process Orchestration", zhCN: "流程编排型" },
    summary: { en: "Coordinate controlled steps across systems or roles.", zhCN: "协调跨系统或角色的受控步骤。" },
    coreFlow: ["create process context", "execute step sequence", "wait for external input", "validate each step", "complete or hand off"],
    commonScenarios: ["employee onboarding", "procurement workflow", "claim processing"],
    commonRules: ["step dependency", "retry policy", "SLA boundary", "required evidence", "blocked-step handoff"],
    compatibleCrossCutting: ["human-handoff", "policy-guard", "adapter-connector", "feedback-optimization"],
    capability: capability("coordinate-process-steps", "Coordinate process steps", "协调流程步骤", "write")
  }),
  manifest({
    id: "content-production",
    kind: "main",
    name: { en: "Content Production", zhCN: "内容生成型" },
    summary: { en: "Produce content from structured requirements and constraints.", zhCN: "基于结构化需求和约束生成内容。" },
    coreFlow: ["collect brief", "validate constraints", "draft content", "inspect or review", "export approved result"],
    commonScenarios: ["support reply draft", "policy-compliant message", "internal summary"],
    commonRules: ["tone", "forbidden claims", "required sections", "review threshold"],
    compatibleCrossCutting: ["human-handoff", "policy-guard", "feedback-optimization"],
    capability: capability("draft-constrained-content", "Draft constrained content", "生成受约束内容", "none")
  }),
  manifest({
    id: "data-insight",
    kind: "main",
    name: { en: "Data Insight", zhCN: "数据洞察型" },
    summary: { en: "Produce structured insight from data with traceable assumptions.", zhCN: "基于数据和可追踪假设生成结构化洞察。" },
    coreFlow: ["define question", "fetch data", "validate quality", "compute or inspect", "summarize uncertainty"],
    commonScenarios: ["sales summary", "support trend analysis", "operations report"],
    commonRules: ["allowed data sources", "freshness requirement", "aggregation level", "privacy boundary"],
    compatibleCrossCutting: ["policy-guard", "adapter-connector", "feedback-optimization"],
    capability: capability("summarize-data-insight", "Summarize data insight", "总结数据洞察", "read")
  }),
  manifest({
    id: "lead-engagement",
    kind: "main",
    name: { en: "Lead Engagement", zhCN: "线索跟进型" },
    summary: { en: "Engage and qualify leads according to rules and stage.", zhCN: "按规则和阶段跟进并判断线索。" },
    coreFlow: ["identify lead context", "qualify", "choose next action", "send approved response or task", "update status or hand off"],
    commonScenarios: ["inbound lead qualification", "trial follow-up", "partner inquiry triage"],
    commonRules: ["qualification criteria", "outreach frequency", "channel rules", "opt-out rule", "high-value handoff"],
    compatibleCrossCutting: ["human-handoff", "policy-guard", "adapter-connector"],
    capability: capability("qualify-lead", "Qualify lead", "判断线索", "notification")
  }),
  manifest({
    id: "monitoring-response",
    kind: "main",
    name: { en: "Monitoring Response", zhCN: "监控预警型" },
    summary: { en: "Respond to system or business signals with controlled triage.", zhCN: "对系统或业务信号做受控分诊和响应。" },
    coreFlow: ["receive signal", "classify severity", "enrich context", "run allowed response", "notify or hand off"],
    commonScenarios: ["incident alert response", "fraud signal triage", "SLA breach alert"],
    commonRules: ["severity threshold", "notification routing", "allowed automated response", "duplicate suppression"],
    compatibleCrossCutting: ["human-handoff", "policy-guard", "adapter-connector", "feedback-optimization"],
    capability: capability("respond-to-signal", "Respond to signal", "响应信号", "notification")
  }),
  manifest({
    id: "human-handoff",
    kind: "cross_cutting",
    name: { en: "Human Handoff", zhCN: "人工协同型" },
    summary: { en: "Convert risky or blocked paths into structured human review.", zhCN: "将高风险或受阻路径转为结构化人工审阅。" },
    coreFlow: ["detect handoff condition", "build review request", "summarize evidence", "route to human"],
    commonScenarios: ["missing information", "policy exception", "uncertain answer", "escalated approval"],
    commonRules: ["reason code", "severity", "required fields", "recommended actions", "target queue type"],
    capability: capability("request-human-review", "Request human review", "请求人工审阅", "approval")
  }),
  manifest({
    id: "policy-guard",
    kind: "cross_cutting",
    name: { en: "Policy Guard", zhCN: "策略守卫型" },
    summary: { en: "Apply allow, deny, or require-handoff rules before action.", zhCN: "在动作执行前应用允许、拒绝或转人工规则。" },
    coreFlow: ["evaluate policy", "allow deny or require handoff", "attach policy evidence", "return governed decision"],
    commonScenarios: ["action permission", "side-effect control", "risk gating", "regulated workflow"],
    commonRules: ["environment profile", "side effect level", "risk level", "approval requirement"],
    capability: capability("enforce-policy", "Enforce policy", "执行策略约束", "none")
  }),
  manifest({
    id: "adapter-connector",
    kind: "cross_cutting",
    name: { en: "Adapter Connector", zhCN: "系统接入型" },
    summary: { en: "Connect an archetype to systems through stable adapter contracts.", zhCN: "通过稳定接入合同连接外部系统。" },
    coreFlow: ["map input", "call adapter", "normalize response", "classify errors", "return contract-shaped result"],
    commonScenarios: ["record lookup", "ticket creation", "status query", "case update"],
    commonRules: ["required fields", "timeout", "retry", "rate limit", "error mapping", "idempotency key"],
    capability: capability("connect-adapter-contract", "Connect adapter contract", "连接适配器合同", "external")
  }),
  manifest({
    id: "feedback-optimization",
    kind: "cross_cutting",
    name: { en: "Feedback Optimization", zhCN: "复盘优化型" },
    summary: { en: "Use trace, audit, and feedback to propose future configuration improvements.", zhCN: "基于 trace、audit 和反馈提出后续配置改进。" },
    coreFlow: ["collect outcome", "compare expectation", "identify drift", "propose update", "review before adoption"],
    commonScenarios: ["template refinement", "policy threshold review", "missed handoff review", "certification update"],
    commonRules: ["feedback source", "review requirement", "change approval", "regression test requirement"],
    capability: capability("propose-reviewed-improvement", "Propose reviewed improvement", "提出经审阅的改进", "none")
  })
];
