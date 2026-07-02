import type { FieldDefinition } from "./field-types";

function enumOption(value: string, en: string, zhCN: string) {
  return {
    value,
    label: { en, zhCN }
  };
}

export const KNOWLEDGE_ANSWERING_FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    fieldId: "capabilities.questionIntake",
    type: "boolean",
    label: { en: "Question intake", zhCN: "问题接收" },
    description: {
      en: "Accepts a user question into the governed answering flow.",
      zhCN: "将用户问题接入受治理的回答流程。"
    },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.knowledgeRetrieval",
    type: "boolean",
    label: { en: "Knowledge retrieval", zhCN: "知识检索" },
    description: {
      en: "Uses a mock/demo retrieval step before answering.",
      zhCN: "在回答前使用 mock/demo 检索步骤。"
    },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.confidenceEvaluation",
    type: "boolean",
    label: { en: "Confidence evaluation", zhCN: "置信度判断" },
    description: {
      en: "Evaluates whether a demo answer is confident enough to return.",
      zhCN: "判断 demo 回答是否达到可返回的置信度。"
    },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.sourceCitation",
    type: "boolean",
    label: { en: "Source citation", zhCN: "来源引用" },
    description: {
      en: "Requires generic demo source references when answers are returned.",
      zhCN: "返回回答时要求附带通用 demo 来源引用。"
    },
    defaultValue: true
  },
  {
    fieldId: "capabilities.answerGeneration",
    type: "boolean",
    label: { en: "Answer generation", zhCN: "回答生成" },
    description: {
      en: "Renders a governed demo answer from retrieved mock evidence.",
      zhCN: "基于 mock 证据渲染受治理的 demo 回答。"
    },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "capabilities.clarification",
    type: "boolean",
    label: { en: "Clarification", zhCN: "澄清追问" },
    description: {
      en: "Asks for more information when the question cannot be answered safely.",
      zhCN: "当问题无法安全回答时请求补充信息。"
    },
    defaultValue: true
  },
  {
    fieldId: "capabilities.handoff",
    type: "boolean",
    label: { en: "Handoff", zhCN: "人工协同" },
    description: {
      en: "Routes sensitive or unsafe answer paths to human review.",
      zhCN: "将敏感或不安全回答路径转入人工审核。"
    },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "rules.knowledgePolicy.minConfidence",
    type: "number",
    label: { en: "Minimum confidence", zhCN: "最低置信度" },
    description: {
      en: "Demo threshold below which the answer must ask clarification, hand off, or refuse with reason.",
      zhCN: "低于该 demo 阈值时，回答必须澄清、转人工或说明无法回答。"
    },
    required: true,
    defaultValue: 0.72,
    min: 0,
    max: 1
  },
  {
    fieldId: "rules.knowledgePolicy.lowConfidenceStrategy",
    type: "enum",
    label: { en: "Low confidence strategy", zhCN: "低置信度策略" },
    description: {
      en: "Determines the fail-closed path when answer confidence is too low.",
      zhCN: "决定回答置信度过低时的 fail-closed 路径。"
    },
    required: true,
    defaultValue: "ask_clarification",
    enumOptions: [
      enumOption("ask_clarification", "Ask clarification", "请求澄清"),
      enumOption("handoff", "Handoff", "转人工"),
      enumOption("no_answer_with_reason", "No answer with reason", "说明无法回答")
    ]
  },
  {
    fieldId: "rules.knowledgePolicy.noAnswerStrategy",
    type: "enum",
    label: { en: "No answer strategy", zhCN: "无答案策略" },
    description: {
      en: "Determines the path when the demo retrieval step cannot produce usable evidence.",
      zhCN: "决定 demo 检索无法产生可用证据时的处理路径。"
    },
    required: true,
    defaultValue: "no_answer_with_reason",
    enumOptions: [
      enumOption("ask_clarification", "Ask clarification", "请求澄清"),
      enumOption("handoff", "Handoff", "转人工"),
      enumOption("no_answer_with_reason", "No answer with reason", "说明无法回答")
    ]
  },
  {
    fieldId: "rules.knowledgePolicy.staleKnowledgeStrategy",
    type: "enum",
    label: { en: "Stale knowledge strategy", zhCN: "过期知识策略" },
    description: {
      en: "Determines how stale demo evidence is handled before answering.",
      zhCN: "决定在回答前如何处理过期 demo 证据。"
    },
    required: true,
    defaultValue: "warn_user",
    enumOptions: [
      enumOption("warn_user", "Warn user", "提示用户"),
      enumOption("handoff", "Handoff", "转人工"),
      enumOption("no_answer_with_reason", "No answer with reason", "说明无法回答")
    ]
  },
  {
    fieldId: "rules.knowledgePolicy.sensitiveQuestionStrategy",
    type: "enum",
    label: { en: "Sensitive question strategy", zhCN: "敏感问题策略" },
    description: {
      en: "Determines the governed path for sensitive or unsafe questions.",
      zhCN: "决定敏感或不安全问题的受治理处理路径。"
    },
    required: true,
    defaultValue: "handoff",
    enumOptions: [
      enumOption("handoff", "Handoff", "转人工"),
      enumOption("no_answer_with_reason", "No answer with reason", "说明无法回答"),
      enumOption("safe_general_answer", "Safe general answer", "安全通用回答")
    ]
  },
  {
    fieldId: "rules.sourcePolicy.requireSourceCitation",
    type: "boolean",
    label: { en: "Require source citation", zhCN: "要求来源引用" },
    description: {
      en: "Requires a generic demo source reference when an answer is returned.",
      zhCN: "返回回答时要求附带通用 demo 来源引用。"
    },
    required: true,
    defaultValue: true
  },
  {
    fieldId: "rules.sourcePolicy.minSourceCount",
    type: "number",
    label: { en: "Minimum source count", zhCN: "最低来源数量" },
    description: {
      en: "Minimum number of demo source references required before answering.",
      zhCN: "回答前要求的最低 demo 来源引用数量。"
    },
    required: true,
    defaultValue: 1,
    min: 0,
    max: 5
  },
  {
    fieldId: "rules.sourcePolicy.allowUnverifiedAnswer",
    type: "boolean",
    label: { en: "Allow unverified answer", zhCN: "允许未验证回答" },
    description: {
      en: "Allows or blocks answers that do not pass demo source verification.",
      zhCN: "允许或阻断未通过 demo 来源验证的回答。"
    },
    required: true,
    defaultValue: false
  },
  {
    fieldId: "rules.sourcePolicy.showSourceSummary",
    type: "boolean",
    label: { en: "Show source summary", zhCN: "显示来源摘要" },
    description: {
      en: "Controls whether generic demo source summaries are included.",
      zhCN: "控制是否包含通用 demo 来源摘要。"
    },
    defaultValue: true
  },
  {
    fieldId: "rules.responseStyle.tone",
    type: "enum",
    label: { en: "Response tone", zhCN: "回答语气" },
    description: {
      en: "Controls the generic demo answer tone.",
      zhCN: "控制通用 demo 回答语气。"
    },
    required: true,
    defaultValue: "neutral",
    enumOptions: [
      enumOption("neutral", "Neutral", "中性"),
      enumOption("warm_professional", "Warm professional", "温和专业"),
      enumOption("concise", "Concise", "简洁")
    ]
  },
  {
    fieldId: "rules.responseStyle.includeSources",
    type: "boolean",
    label: { en: "Include sources", zhCN: "包含来源" },
    description: {
      en: "Controls whether source references appear in the generic demo answer.",
      zhCN: "控制通用 demo 回答中是否展示来源引用。"
    },
    defaultValue: true
  },
  {
    fieldId: "rules.responseStyle.includeUncertainty",
    type: "boolean",
    label: { en: "Include uncertainty", zhCN: "包含不确定性说明" },
    description: {
      en: "Shows uncertainty when confidence or sources are limited.",
      zhCN: "当置信度或来源有限时展示不确定性说明。"
    },
    defaultValue: true
  },
  {
    fieldId: "rules.responseStyle.includeNextSteps",
    type: "boolean",
    label: { en: "Include next steps", zhCN: "包含下一步" },
    description: {
      en: "Shows generic next steps such as clarification or human review.",
      zhCN: "展示澄清或人工审核等通用下一步。"
    },
    defaultValue: true
  }
];

export const KNOWLEDGE_ANSWERING_FIELD_IDS = KNOWLEDGE_ANSWERING_FIELD_DEFINITIONS.map((field) => field.fieldId);
