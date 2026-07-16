import type { PackConfig } from "@yutra/pack-config-core";
import type { RuleCompilerArtifacts } from "./artifacts";
import { compileAdapterConfigArtifact } from "./adapter-config-compiler";
import { compilerVersion } from "./compiler-version";
import { createPackConfigFingerprint } from "@yutra/pack-config-core";
import { createJsonArtifact, createYamlArtifact, createYamlTextArtifact } from "./serialize-artifacts";

function ruleValue<T>(config: PackConfig, key: string, fallback: T): T {
  const value = config.rules[key]?.value;
  return value === undefined ? fallback : (value as T);
}

function buildAgentSpec(config: PackConfig, configHash: string): Record<string, unknown> {
  const minConfidence = ruleValue<number>(config, "knowledgePolicy.minConfidence", 0.72);
  const lowConfidenceStrategy = ruleValue<string>(
    config,
    "knowledgePolicy.lowConfidenceStrategy",
    "ask_clarification"
  );
  const noAnswerStrategy = ruleValue<string>(config, "knowledgePolicy.noAnswerStrategy", "no_answer_with_reason");
  const sensitiveQuestionStrategy = ruleValue<string>(config, "knowledgePolicy.sensitiveQuestionStrategy", "handoff");
  const requireSourceCitation = ruleValue<boolean>(config, "sourcePolicy.requireSourceCitation", true);
  const allowUnverifiedAnswer = ruleValue<boolean>(config, "sourcePolicy.allowUnverifiedAnswer", false);

  return {
    agent: "knowledge-answering-basic",
    version: "0.1.0",
    description: "Public demo knowledge-answering agent compiled from Pack Config.",
    intents: [
      { name: "answer_demo_question", entry_state: "classify_question" },
      { name: "clarify_question", entry_state: "collect_question_context" },
      { name: "handoff_sensitive_question", entry_state: "handoff" }
    ],
    context: {
      fields: {
        question_id: { type: "string", required: true },
        question_text: { type: "string", required: true },
        confidence_score: { type: "number", required: false },
        demo_source_count: { type: "number", required: false },
        knowledge_hit: { type: "boolean", required: false },
        sensitive_question: { type: "boolean", required: false },
        source_verified: { type: "boolean", required: false },
        requires_handoff: { type: "boolean", required: false },
        clarification_needed: { type: "boolean", required: false }
      }
    },
    initial_state: "classify_question",
    actions: [
      { name: "classify_question_intent", sideEffect: "read", riskLevel: "low", requiresApproval: false },
      { name: "collect_question_context", sideEffect: "read", riskLevel: "low", requiresApproval: false },
      { name: "retrieve_demo_knowledge", sideEffect: "read", riskLevel: "low", requiresApproval: false },
      { name: "evaluate_answer_confidence", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "check_source_policy", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "render_answer_with_sources", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "ask_clarifying_question", sideEffect: "none", riskLevel: "low", requiresApproval: false },
      { name: "escalate_human", sideEffect: "external", riskLevel: "medium", requiresApproval: true },
      { name: "render_no_answer_response", sideEffect: "none", riskLevel: "low", requiresApproval: false }
    ],
    states: {
      classify_question: {
        actions: ["classify_question_intent"],
        transitions: [
          {
            when: "ctx.sensitive_question == true",
            to: sensitiveQuestionStrategy === "handoff" ? "handoff" : "no_answer"
          },
          { to: "collect_question_context" }
        ]
      },
      collect_question_context: {
        actions: ["collect_question_context"],
        transitions: [{ to: "retrieve_knowledge" }]
      },
      retrieve_knowledge: {
        actions: ["retrieve_demo_knowledge"],
        transitions: [
          {
            when: "ctx.knowledge_hit == false",
            to:
              noAnswerStrategy === "ask_clarification"
                ? "ask_clarification"
                : noAnswerStrategy === "handoff"
                  ? "handoff"
                  : "no_answer"
          },
          { to: "evaluate_confidence" }
        ]
      },
      evaluate_confidence: {
        actions: ["evaluate_answer_confidence"],
        transitions: [
          {
            when: `ctx.confidence_score < ${minConfidence}`,
            to:
              lowConfidenceStrategy === "ask_clarification"
                ? "ask_clarification"
                : lowConfidenceStrategy === "handoff"
                  ? "handoff"
                  : "no_answer"
          },
          { to: "check_source_policy" }
        ]
      },
      check_source_policy: {
        actions: ["check_source_policy"],
        transitions: [
          { when: `${allowUnverifiedAnswer ? "false" : "ctx.source_verified == false"}`, to: "no_answer" },
          { when: `${requireSourceCitation ? "ctx.demo_source_count < 1" : "false"}`, to: "no_answer" },
          { to: "generate_answer" }
        ]
      },
      generate_answer: {
        actions: ["render_answer_with_sources"],
        transitions: [{ to: "done" }]
      },
      ask_clarification: {
        actions: ["ask_clarifying_question"],
        transitions: [{ to: "done" }]
      },
      no_answer: {
        actions: ["render_no_answer_response"],
        transitions: [{ to: "done" }]
      },
      handoff: {
        actions: ["escalate_human"],
        handoff: true,
        transitions: [{ to: "done" }]
      },
      done: {
        final: true
      }
    },
    metadata: {
      generatedBy: "yutra-rule-compiler",
      compilerVersion,
      configHash,
      publicDemo: true,
      noRealProvider: true,
      noRealAnswerGeneration: true
    }
  };
}

function buildPolicy(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    generatedFrom: {
      packConfigId: config.packConfigId,
      archetypeId: config.archetypeId,
      configHash,
      compilerVersion
    },
    environment: config.governance.environment,
    failClosedPolicy: "enabled",
    sideEffectPolicy: config.governance.sideEffectPolicy,
    knowledgePolicy: {
      minConfidence: ruleValue<number>(config, "knowledgePolicy.minConfidence", 0.72),
      lowConfidenceStrategy: ruleValue<string>(config, "knowledgePolicy.lowConfidenceStrategy", "ask_clarification"),
      noAnswerStrategy: ruleValue<string>(config, "knowledgePolicy.noAnswerStrategy", "no_answer_with_reason"),
      staleKnowledgeStrategy: ruleValue<string>(config, "knowledgePolicy.staleKnowledgeStrategy", "warn_user"),
      sensitiveQuestionStrategy: ruleValue<string>(config, "knowledgePolicy.sensitiveQuestionStrategy", "handoff")
    },
    sourcePolicy: {
      requireSourceCitation: ruleValue<boolean>(config, "sourcePolicy.requireSourceCitation", true),
      minSourceCount: ruleValue<number>(config, "sourcePolicy.minSourceCount", 1),
      allowUnverifiedAnswer: ruleValue<boolean>(config, "sourcePolicy.allowUnverifiedAnswer", false),
      showSourceSummary: ruleValue<boolean>(config, "sourcePolicy.showSourceSummary", true)
    },
    adapterSafety: {
      allAdaptersMock: config.adapters.every((adapter) => adapter.mode === "mock"),
      containsRealEndpoint: false,
      containsSecret: false,
      noRealProvider: true
    }
  };
}

function buildTemplates(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    generatedFrom: {
      packConfigId: config.packConfigId,
      configHash
    },
    ask_missing_info: {
      purpose: "Generic fallback clarification template used by compile output validation."
    },
    templates: {
      answer_with_sources: {
        purpose: "Return a generic demo answer with source placeholders.",
        tone: ruleValue<string>(config, "responseStyle.tone", "neutral"),
        includeSources: ruleValue<boolean>(config, "responseStyle.includeSources", true),
        includeUncertainty: ruleValue<boolean>(config, "responseStyle.includeUncertainty", true)
      },
      low_confidence_clarification: {
        purpose: "Ask a generic clarification when confidence is below threshold."
      },
      no_answer_with_reason: {
        purpose: "Explain that the demo flow cannot answer safely."
      },
      sensitive_question_handoff: {
        purpose: "Route sensitive questions to human review."
      },
      source_required: {
        purpose: "Explain that a source reference is required before answering."
      },
      action_failed: {
        purpose: "Generic fail-closed action failure response."
      }
    },
    noRealAnswers: true
  };
}

function buildTestCases(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    generatedFrom: {
      packConfigId: config.packConfigId,
      configHash
    },
    testCases: [
      {
        id: "known_question_answer_with_sources",
        scenario: "known question -> answer with sources",
        input: {
          question_id: "DEMO-Q-KNOWN",
          question_text: "demo governed question",
          knowledge_hit: true,
          confidence_score: 0.86,
          demo_source_count: 1,
          source_verified: true
        },
        expectedOutcome: "answer_with_sources",
        expectedTrace: ["guard.evaluated", "transition.resolved", "run.completed"]
      },
      {
        id: "low_confidence_asks_clarification",
        scenario: "low confidence -> ask clarification",
        input: {
          question_id: "DEMO-Q-LOW",
          question_text: "demo ambiguous question",
          knowledge_hit: true,
          confidence_score: 0.41,
          demo_source_count: 1,
          source_verified: true
        },
        expectedOutcome: "ask_clarification",
        expectedTrace: ["guard.evaluated", "clarification.requested"]
      },
      {
        id: "no_answer_with_reason",
        scenario: "no answer -> no answer with reason",
        input: {
          question_id: "DEMO-Q-NONE",
          question_text: "demo unsupported question",
          knowledge_hit: false,
          confidence_score: 0,
          demo_source_count: 0,
          source_verified: false
        },
        expectedOutcome: "no_answer_with_reason",
        expectedTrace: ["transition.resolved", "run.completed"]
      },
      {
        id: "sensitive_question_handoff",
        scenario: "sensitive question -> handoff",
        input: {
          question_id: "DEMO-Q-SENSITIVE",
          question_text: "demo sensitive question",
          sensitive_question: true,
          knowledge_hit: false
        },
        expectedOutcome: "handoff",
        expectedTrace: ["guard.evaluated", "handoff.requested"]
      },
      {
        id: "missing_source_citation_fail_closed",
        scenario: "missing source citation -> fail closed or warning",
        input: {
          question_id: "DEMO-Q-SOURCE",
          question_text: "demo sourced answer question",
          knowledge_hit: true,
          confidence_score: 0.84,
          demo_source_count: 0,
          source_verified: false
        },
        expectedOutcome: "fail_closed_source_required",
        expectedTrace: ["guard.evaluated", "transition.resolved"]
      }
    ]
  };
}

function buildTraceExpectation(config: PackConfig, configHash: string): Record<string, unknown> {
  return {
    generatedFrom: {
      packConfigId: config.packConfigId,
      configHash,
      compilerVersion
    },
    expectedEventTypes: [
      "run.started",
      "intent.resolved",
      "state.entered",
      "guard.evaluated",
      "action.started",
      "action.succeeded",
      "action.failed",
      "transition.resolved",
      "handoff.requested",
      "run.completed",
      "run.failed"
    ],
    expectedMarkers: {
      confidenceGuard: "confidence_threshold",
      sourcePolicy: "source_policy_checked",
      sourceVerificationGuard: "source_verification",
      failClosed: true,
      noRealProvider: true
    },
    expectedPaths: [
      {
        id: "low_confidence_path",
        events: ["guard.evaluated", "transition.resolved", "clarification.requested"]
      },
      {
        id: "sensitive_handoff_path",
        events: ["guard.evaluated", "handoff.requested"]
      },
      {
        id: "source_policy_fail_closed_path",
        events: ["guard.evaluated", "transition.resolved", "run.completed"]
      }
    ],
    configHash,
    compilerVersion
  };
}

export function knowledgeAnsweringCompiler(config: PackConfig): RuleCompilerArtifacts {
  const configHash = createPackConfigFingerprint(config);
  const agentSpec = buildAgentSpec(config, configHash);
  const policy = buildPolicy(config, configHash);
  const adapterConfig = compileAdapterConfigArtifact(config, configHash);
  const templates = buildTemplates(config, configHash);
  const testCases = buildTestCases(config, configHash);
  const traceExpectation = buildTraceExpectation(config, configHash);

  return {
    agent: createYamlTextArtifact("agent.yutra.yaml", "agent", agentSpec),
    policy: createYamlArtifact("policy.yaml", "policy", policy),
    adapterConfig: createJsonArtifact("adapter.config.json", "adapter_config", adapterConfig),
    templates: createJsonArtifact("templates.json", "templates", templates),
    testCases: createJsonArtifact("test-cases.json", "test_cases", testCases),
    traceExpectation: createJsonArtifact("trace.expectation.json", "trace_expectation", traceExpectation)
  };
}
