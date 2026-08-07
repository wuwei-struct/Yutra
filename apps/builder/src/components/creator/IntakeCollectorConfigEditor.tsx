import type { PackConfig } from "@yutra/pack-config-core";
import { useI18n } from "../../i18n";
import { fieldValue, fullRulePath, updateCapability, updateRule } from "./creator-ui-helpers";
import { ImpactCheckbox, ImpactField } from "./CreatorFieldControls";

const capabilityIds = [
  "fieldCollection",
  "fieldValidation",
  "missingFieldDetection",
  "duplicateCheck",
  "confirmation",
  "handoff"
] as const;

const genericFieldIds = ["topic", "request_summary", "context_note"] as const;

export function IntakeCollectorConfigEditor(props: {
  config: PackConfig;
  onChange: (config: PackConfig) => void;
  onSelectImpact: (fieldPath: string) => void;
}) {
  const { config, onChange, onSelectImpact } = props;
  const { t } = useI18n();
  const requiredFields = fieldValue<string[]>(config, "intakePolicy.requiredFields", ["topic", "request_summary"]);

  const toggleRequiredField = (fieldId: string, checked: boolean) => {
    const next = checked
      ? [...new Set([...requiredFields, fieldId])]
      : requiredFields.filter((item) => item !== fieldId);
    onChange(updateRule(config, "intakePolicy.requiredFields", next));
  };

  return (
    <section className="creator-section intake-collector-editor" aria-label="Intake Collector Config Editor">
      <h3>{t("creator.intake.title")} Config</h3>
      <p className="hint">{t("creator.intake.boundary")}</p>

      <h4>Capabilities</h4>
      <div className="list">
        {capabilityIds.map((id) => (
          <ImpactCheckbox
            key={id}
            config={config}
            fieldPath={`capabilities.${id}`}
            label={t(`creator.intake.${id}`)}
            checked={Boolean(config.capabilities[id]?.value)}
            onChange={(checked) => onChange(updateCapability(config, id, checked))}
            onSelectImpact={onSelectImpact}
          />
        ))}
      </div>

      <h4>{t("creator.intake.policy")}</h4>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("intakePolicy.requiredFields")}
        label={t("creator.intake.requiredFields")}
        onSelectImpact={onSelectImpact}
      >
        <span className="generic-field-options" aria-label="Required Fields">
          {genericFieldIds.map((fieldId) => (
            <label className="checkbox-item" key={fieldId}>
              <input
                type="checkbox"
                checked={requiredFields.includes(fieldId)}
                onChange={(event) => toggleRequiredField(fieldId, event.target.checked)}
              />
              <span>{fieldId}</span>
            </label>
          ))}
        </span>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("intakePolicy.maxClarificationRounds")}
        label={t("creator.intake.maxClarificationRounds")}
        onSelectImpact={onSelectImpact}
      >
        <input
          aria-label="Maximum Clarification Rounds"
          type="number"
          min="0"
          max="5"
          value={fieldValue(config, "intakePolicy.maxClarificationRounds", 2)}
          onChange={(event) => onChange(updateRule(config, "intakePolicy.maxClarificationRounds", Number(event.target.value)))}
        />
      </ImpactField>
      <ImpactField config={config} fieldPath={fullRulePath("intakePolicy.incompleteStrategy")} label={t("creator.intake.incompleteStrategy")} onSelectImpact={onSelectImpact}>
        <select value={fieldValue(config, "intakePolicy.incompleteStrategy", "ask_missing_fields")} onChange={(event) => onChange(updateRule(config, "intakePolicy.incompleteStrategy", event.target.value))}>
          <option value="ask_missing_fields">{t("creator.intake.askMissingFields")}</option>
          <option value="handoff">handoff</option>
          <option value="stop_with_reason">{t("creator.intake.stopWithReason")}</option>
        </select>
      </ImpactField>
      <ImpactField config={config} fieldPath={fullRulePath("intakePolicy.invalidFieldStrategy")} label={t("creator.intake.invalidFieldStrategy")} onSelectImpact={onSelectImpact}>
        <select value={fieldValue(config, "intakePolicy.invalidFieldStrategy", "ask_correction")} onChange={(event) => onChange(updateRule(config, "intakePolicy.invalidFieldStrategy", event.target.value))}>
          <option value="ask_correction">{t("creator.intake.askCorrection")}</option>
          <option value="handoff">handoff</option>
        </select>
      </ImpactField>
      <ImpactField config={config} fieldPath={fullRulePath("intakePolicy.duplicateStrategy")} label={t("creator.intake.duplicateStrategy")} onSelectImpact={onSelectImpact}>
        <select value={fieldValue(config, "intakePolicy.duplicateStrategy", "warn_and_confirm")} onChange={(event) => onChange(updateRule(config, "intakePolicy.duplicateStrategy", event.target.value))}>
          <option value="warn_and_confirm">{t("creator.intake.warnAndConfirm")}</option>
          <option value="handoff">handoff</option>
          <option value="reject_duplicate">reject_duplicate</option>
        </select>
      </ImpactField>

      <h4>{t("creator.intake.validationPolicy")}</h4>
      {[
        ["requireConfirmationBeforeComplete", true],
        ["rejectUnknownFields", true],
        ["trimTextFields", true],
        ["allowPartialDraft", false]
      ].map(([name, fallback]) => (
        <ImpactCheckbox
          key={String(name)}
          config={config}
          fieldPath={fullRulePath(`validationPolicy.${name}`)}
          label={name === "requireConfirmationBeforeComplete" ? t("creator.intake.requireConfirmationBeforeComplete") : String(name)}
          checked={fieldValue(config, `validationPolicy.${name}`, Boolean(fallback))}
          onChange={(checked) => onChange(updateRule(config, `validationPolicy.${name}`, checked))}
          onSelectImpact={onSelectImpact}
        />
      ))}

      <h4>Response Style</h4>
      <ImpactField config={config} fieldPath={fullRulePath("responseStyle.tone")} label="tone" onSelectImpact={onSelectImpact}>
        <select value={fieldValue(config, "responseStyle.tone", "neutral")} onChange={(event) => onChange(updateRule(config, "responseStyle.tone", event.target.value))}>
          <option value="neutral">neutral</option>
          <option value="warm_professional">warm_professional</option>
          <option value="concise">concise</option>
        </select>
      </ImpactField>
      {["includeMissingFieldList", "includeValidationReason", "includeNextSteps"].map((name) => (
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

      <div className="creator-adapter-summary" aria-label="Intake Adapter Boundary">
        <strong>Adapters: mock only</strong>
        <span>containsRealEndpoint=false / containsSecret=false / no personal data, customer form, database, CRM, or ERP</span>
      </div>
    </section>
  );
}
