import type { PackConfig } from "@yutra/pack-config-core";
import { useI18n } from "../../i18n";
import { fieldValue, fullRulePath, updateCapability, updateRule } from "./creator-ui-helpers";
import { ImpactCheckbox, ImpactField } from "./CreatorFieldControls";

export function KnowledgeAnsweringConfigEditor(props: {
  config: PackConfig;
  onChange: (config: PackConfig) => void;
  onSelectImpact: (fieldPath: string) => void;
}) {
  const { config, onChange, onSelectImpact } = props;
  const { t } = useI18n();
  const capabilityIds = [
    "questionIntake",
    "knowledgeRetrieval",
    "confidenceEvaluation",
    "sourceCitation",
    "answerGeneration",
    "clarification",
    "handoff"
  ];

  return (
    <section className="creator-section knowledge-answering-editor" aria-label="Knowledge Answering Config Editor">
      <h3>{t("creator.knowledge.title")} Config</h3>
      <p className="hint">
        Public demo/mock only. Adapter mode is fixed to mock; no LLM, RAG provider, vector DB, endpoint, API key, knowledge base path,
        documentId, sourceUrl, or real FAQ input is exposed.
      </p>

      <h4>Capabilities</h4>
      <div className="list">
        {capabilityIds.map((id) => (
          <ImpactCheckbox
            key={id}
            config={config}
            fieldPath={`capabilities.${id}`}
            label={id}
            checked={Boolean(config.capabilities[id]?.value)}
            onChange={(checked) => onChange(updateCapability(config, id, checked))}
            onSelectImpact={onSelectImpact}
          />
        ))}
      </div>

      <h4>{t("creator.knowledge.policy")}</h4>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("knowledgePolicy.minConfidence")}
        label="minConfidence"
        onSelectImpact={onSelectImpact}
      >
        <input
          aria-label="minConfidence"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={fieldValue(config, "knowledgePolicy.minConfidence", 0.72)}
          onChange={(event) => onChange(updateRule(config, "knowledgePolicy.minConfidence", Number(event.target.value)))}
        />
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("knowledgePolicy.lowConfidenceStrategy")}
        label="lowConfidenceStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "knowledgePolicy.lowConfidenceStrategy", "ask_clarification")}
          onChange={(event) => onChange(updateRule(config, "knowledgePolicy.lowConfidenceStrategy", event.target.value))}
        >
          <option value="ask_clarification">ask_clarification</option>
          <option value="handoff">handoff</option>
          <option value="no_answer_with_reason">no_answer_with_reason</option>
        </select>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("knowledgePolicy.noAnswerStrategy")}
        label="noAnswerStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "knowledgePolicy.noAnswerStrategy", "no_answer_with_reason")}
          onChange={(event) => onChange(updateRule(config, "knowledgePolicy.noAnswerStrategy", event.target.value))}
        >
          <option value="ask_clarification">ask_clarification</option>
          <option value="handoff">handoff</option>
          <option value="no_answer_with_reason">no_answer_with_reason</option>
        </select>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("knowledgePolicy.staleKnowledgeStrategy")}
        label="staleKnowledgeStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "knowledgePolicy.staleKnowledgeStrategy", "warn_user")}
          onChange={(event) => onChange(updateRule(config, "knowledgePolicy.staleKnowledgeStrategy", event.target.value))}
        >
          <option value="warn_user">warn_user</option>
          <option value="handoff">handoff</option>
          <option value="no_answer_with_reason">no_answer_with_reason</option>
        </select>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("knowledgePolicy.sensitiveQuestionStrategy")}
        label="sensitiveQuestionStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "knowledgePolicy.sensitiveQuestionStrategy", "handoff")}
          onChange={(event) => onChange(updateRule(config, "knowledgePolicy.sensitiveQuestionStrategy", event.target.value))}
        >
          <option value="handoff">handoff</option>
          <option value="no_answer_with_reason">no_answer_with_reason</option>
          <option value="safe_general_answer">safe_general_answer</option>
        </select>
      </ImpactField>

      <h4>{t("creator.knowledge.sourcePolicy")}</h4>
      <ImpactCheckbox
        config={config}
        fieldPath={fullRulePath("sourcePolicy.requireSourceCitation")}
        label="requireSourceCitation"
        checked={fieldValue(config, "sourcePolicy.requireSourceCitation", true)}
        onChange={(checked) => onChange(updateRule(config, "sourcePolicy.requireSourceCitation", checked))}
        onSelectImpact={onSelectImpact}
      />
      <ImpactField
        config={config}
        fieldPath={fullRulePath("sourcePolicy.minSourceCount")}
        label="minSourceCount"
        onSelectImpact={onSelectImpact}
      >
        <input
          aria-label="minSourceCount"
          type="number"
          min="0"
          max="5"
          value={fieldValue(config, "sourcePolicy.minSourceCount", 1)}
          onChange={(event) => onChange(updateRule(config, "sourcePolicy.minSourceCount", Number(event.target.value)))}
        />
      </ImpactField>
      <ImpactCheckbox
        config={config}
        fieldPath={fullRulePath("sourcePolicy.allowUnverifiedAnswer")}
        label="allowUnverifiedAnswer"
        checked={fieldValue(config, "sourcePolicy.allowUnverifiedAnswer", false)}
        onChange={(checked) => onChange(updateRule(config, "sourcePolicy.allowUnverifiedAnswer", checked))}
        onSelectImpact={onSelectImpact}
      />
      <ImpactCheckbox
        config={config}
        fieldPath={fullRulePath("sourcePolicy.showSourceSummary")}
        label="showSourceSummary"
        checked={fieldValue(config, "sourcePolicy.showSourceSummary", true)}
        onChange={(checked) => onChange(updateRule(config, "sourcePolicy.showSourceSummary", checked))}
        onSelectImpact={onSelectImpact}
      />

      <h4>Response Style</h4>
      <ImpactField config={config} fieldPath={fullRulePath("responseStyle.tone")} label="tone" onSelectImpact={onSelectImpact}>
        <select
          value={fieldValue(config, "responseStyle.tone", "neutral")}
          onChange={(event) => onChange(updateRule(config, "responseStyle.tone", event.target.value))}
        >
          <option value="neutral">neutral</option>
          <option value="warm_professional">warm_professional</option>
          <option value="concise">concise</option>
        </select>
      </ImpactField>
      {["includeSources", "includeUncertainty", "includeNextSteps"].map((name) => (
        <ImpactCheckbox
          key={name}
          config={config}
          fieldPath={fullRulePath(`responseStyle.${name}`)}
          label={name}
          checked={fieldValue(config, `responseStyle.${name}`, false)}
          onChange={(checked) => onChange(updateRule(config, `responseStyle.${name}`, checked))}
          onSelectImpact={onSelectImpact}
        />
      ))}

      <div className="creator-adapter-summary" aria-label="Adapter Mode Summary">
        <strong>Adapters: mock only</strong>
        <span>containsRealEndpoint=false / containsSecret=false / no real LLM, RAG provider, vector DB, sourceUrl, or documentId</span>
      </div>
    </section>
  );
}
