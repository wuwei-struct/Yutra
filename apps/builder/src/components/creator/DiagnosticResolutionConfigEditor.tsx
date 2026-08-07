import type { PackConfig } from "@yutra/pack-config-core";
import { DIAGNOSTIC_RESOLUTION_DEMO_SIGNAL_IDS } from "../../../../../packages/pack-config-core/src/diagnostic-resolution-config";
import { useI18n } from "../../i18n";
import { fieldValue, fullRulePath, updateCapability, updateRule } from "./creator-ui-helpers";
import { ImpactCheckbox, ImpactField } from "./CreatorFieldControls";

const capabilityIds = [
  "signalCollection",
  "diagnosticChecks",
  "branchDiagnosis",
  "remediationSuggestion",
  "safeMockRemediation",
  "resolutionVerification",
  "handoff"
] as const;

export function DiagnosticResolutionConfigEditor(props: {
  config: PackConfig;
  onChange: (config: PackConfig) => void;
  onSelectImpact: (fieldPath: string) => void;
}) {
  const { config, onChange, onSelectImpact } = props;
  const { t } = useI18n();
  const requiredSignals = fieldValue<string[]>(config, "diagnosticPolicy.requiredSignals", [
    "symptom_summary",
    "observed_behavior"
  ]);

  const toggleRequiredSignal = (signalId: string, checked: boolean) => {
    const next = checked
      ? [...new Set([...requiredSignals, signalId])]
      : requiredSignals.filter((item) => item !== signalId);
    onChange(updateRule(config, "diagnosticPolicy.requiredSignals", next));
  };

  return (
    <section className="creator-section diagnostic-resolution-editor" aria-label="Diagnostic Resolution Config Editor">
      <h3>{t("creator.diagnostic.title")} Config</h3>
      <p className="hint">{t("creator.diagnostic.boundary")}</p>

      <h4>Capabilities</h4>
      <div className="list">
        {capabilityIds.map((id) => (
          <ImpactCheckbox
            key={id}
            config={config}
            fieldPath={`capabilities.${id}`}
            label={t(`creator.diagnostic.${id}`)}
            checked={Boolean(config.capabilities[id]?.value)}
            onChange={(checked) => onChange(updateCapability(config, id, checked))}
            onSelectImpact={onSelectImpact}
          />
        ))}
      </div>

      <h4>{t("creator.diagnostic.policy")}</h4>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("diagnosticPolicy.requiredSignals")}
        label={t("creator.diagnostic.requiredSignals")}
        onSelectImpact={onSelectImpact}
      >
        <span className="generic-field-options" aria-label="Required Signals">
          {DIAGNOSTIC_RESOLUTION_DEMO_SIGNAL_IDS.map((signalId) => (
            <label className="checkbox-item" key={signalId}>
              <input
                type="checkbox"
                checked={requiredSignals.includes(signalId)}
                onChange={(event) => toggleRequiredSignal(signalId, event.target.checked)}
              />
              <span>{signalId}</span>
            </label>
          ))}
        </span>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("diagnosticPolicy.maxDiagnosticRounds")}
        label={t("creator.diagnostic.maxDiagnosticRounds")}
        onSelectImpact={onSelectImpact}
      >
        <input
          aria-label="Maximum Diagnostic Rounds"
          type="number"
          min="1"
          max="8"
          value={fieldValue(config, "diagnosticPolicy.maxDiagnosticRounds", 3)}
          onChange={(event) => onChange(updateRule(config, "diagnosticPolicy.maxDiagnosticRounds", Number(event.target.value)))}
        />
      </ImpactField>
      <ImpactField config={config} fieldPath={fullRulePath("diagnosticPolicy.inconclusiveStrategy")} label={t("creator.diagnostic.inconclusiveStrategy")} onSelectImpact={onSelectImpact}>
        <select value={fieldValue(config, "diagnosticPolicy.inconclusiveStrategy", "ask_more_signals")} onChange={(event) => onChange(updateRule(config, "diagnosticPolicy.inconclusiveStrategy", event.target.value))}>
          <option value="ask_more_signals">ask_more_signals</option>
          <option value="handoff">handoff</option>
          <option value="stop_with_reason">stop_with_reason</option>
        </select>
      </ImpactField>
      <ImpactField config={config} fieldPath={fullRulePath("diagnosticPolicy.checkFailureStrategy")} label={t("creator.diagnostic.checkFailureStrategy")} onSelectImpact={onSelectImpact}>
        <select value={fieldValue(config, "diagnosticPolicy.checkFailureStrategy", "retry")} onChange={(event) => onChange(updateRule(config, "diagnosticPolicy.checkFailureStrategy", event.target.value))}>
          <option value="retry">retry</option>
          <option value="handoff">handoff</option>
          <option value="stop_with_reason">stop_with_reason</option>
        </select>
      </ImpactField>
      <ImpactField config={config} fieldPath={fullRulePath("diagnosticPolicy.remediationStrategy")} label={t("creator.diagnostic.remediationStrategy")} onSelectImpact={onSelectImpact}>
        <select value={fieldValue(config, "diagnosticPolicy.remediationStrategy", "mock_safe_attempt")} onChange={(event) => onChange(updateRule(config, "diagnosticPolicy.remediationStrategy", event.target.value))}>
          <option value="suggest_only">{t("creator.diagnostic.suggestOnly")}</option>
          <option value="mock_safe_attempt">{t("creator.diagnostic.mockSafeAttempt")}</option>
          <option value="handoff">handoff</option>
        </select>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("diagnosticPolicy.maxRemediationAttempts")}
        label={t("creator.diagnostic.maxRemediationAttempts")}
        onSelectImpact={onSelectImpact}
      >
        <input
          aria-label="Maximum Remediation Attempts"
          type="number"
          min="0"
          max="3"
          value={fieldValue(config, "diagnosticPolicy.maxRemediationAttempts", 1)}
          onChange={(event) => onChange(updateRule(config, "diagnosticPolicy.maxRemediationAttempts", Number(event.target.value)))}
        />
      </ImpactField>

      <h4>{t("creator.diagnostic.validationPolicy")}</h4>
      {([
        ["requireEvidenceBeforeDiagnosis", true, "creator.diagnostic.requireEvidenceBeforeDiagnosis"],
        ["rejectUnknownSignals", true, "creator.diagnostic.rejectUnknownSignals"],
        ["requireVerificationBeforeComplete", true, "creator.diagnostic.requireVerificationBeforeComplete"]
      ] as const).map(([name, fallback, labelKey]) => (
        <ImpactCheckbox
          key={String(name)}
          config={config}
          fieldPath={fullRulePath(`validationPolicy.${name}`)}
          label={t(labelKey)}
          checked={fieldValue(config, `validationPolicy.${name}`, Boolean(fallback))}
          onChange={(checked) => onChange(updateRule(config, `validationPolicy.${name}`, checked))}
          onSelectImpact={onSelectImpact}
        />
      ))}

      <h4>Response Style</h4>
      <ImpactField config={config} fieldPath={fullRulePath("responseStyle.tone")} label="tone" onSelectImpact={onSelectImpact}>
        <select value={fieldValue(config, "responseStyle.tone", "calm_technical")} onChange={(event) => onChange(updateRule(config, "responseStyle.tone", event.target.value))}>
          <option value="calm_technical">calm_technical</option>
          <option value="neutral">neutral</option>
          <option value="concise">concise</option>
        </select>
      </ImpactField>
      {["includeDiagnosisReason", "includeCheckSummary", "includeNextSteps"].map((name) => (
        <ImpactCheckbox
          key={name}
          config={config}
          fieldPath={fullRulePath(`responseStyle.${name}`)}
          label={name}
          checked={fieldValue(config, `responseStyle.${name}`, true)}
          onChange={(checked) => onChange(updateRule(config, `responseStyle.${name}`, checked))}
          onSelectImpact={onSelectImpact}
        />
      ))}

      <div className="creator-adapter-summary" aria-label="Diagnostic Adapter Boundary">
        <strong>Adapters: mock only</strong>
        <span>containsRealEndpoint=false / containsSecret=false / no real device, shell command, external system, API, or LLM access</span>
      </div>
    </section>
  );
}
