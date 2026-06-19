import type { PackConfig } from "@yutra/pack-config-core";
import { fieldValue, fullRulePath, updateCapability, updateRule } from "./creator-ui-helpers";
import { ImpactCheckbox, ImpactField } from "./CreatorFieldControls";

export function ApprovalDecisionConfigEditor(props: {
  config: PackConfig;
  onChange: (config: PackConfig) => void;
  onSelectImpact: (fieldPath: string) => void;
}) {
  const { config, onChange, onSelectImpact } = props;
  const capabilityIds = ["requestIntake", "evidenceCollection", "eligibilityCheck", "riskReview", "approvalDecision", "handoff"];

  return (
    <section className="creator-section" aria-label="Approval Decision Config Editor">
      <h3>Approval Decision Config</h3>
      <p className="hint">
        Public demo/mock only. Adapter mode is fixed to mock; no approver, department, endpoint, secret, or enterprise policy input is exposed.
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

      <h4>Approval Policy</h4>
      <ImpactCheckbox
        config={config}
        fieldPath={fullRulePath("approvalPolicy.autoApproveLowRisk")}
        label="autoApproveLowRisk"
        checked={fieldValue(config, "approvalPolicy.autoApproveLowRisk", false)}
        onChange={(checked) => onChange(updateRule(config, "approvalPolicy.autoApproveLowRisk", checked))}
        onSelectImpact={onSelectImpact}
      />
      <ImpactField
        config={config}
        fieldPath={fullRulePath("approvalPolicy.lowRiskMaxAmount")}
        label="lowRiskMaxAmount"
        onSelectImpact={onSelectImpact}
      >
        <input
          aria-label="lowRiskMaxAmount"
          type="number"
          value={fieldValue(config, "approvalPolicy.lowRiskMaxAmount", 0)}
          onChange={(event) => onChange(updateRule(config, "approvalPolicy.lowRiskMaxAmount", Number(event.target.value)))}
        />
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("approvalPolicy.missingEvidenceStrategy")}
        label="missingEvidenceStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "approvalPolicy.missingEvidenceStrategy", "ask_for_more_info")}
          onChange={(event) => onChange(updateRule(config, "approvalPolicy.missingEvidenceStrategy", event.target.value))}
        >
          <option value="ask_for_more_info">ask_for_more_info</option>
          <option value="handoff">handoff</option>
          <option value="reject_with_reason">reject_with_reason</option>
        </select>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("approvalPolicy.highRiskStrategy")}
        label="highRiskStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "approvalPolicy.highRiskStrategy", "require_human_approval")}
          onChange={(event) => onChange(updateRule(config, "approvalPolicy.highRiskStrategy", event.target.value))}
        >
          <option value="require_human_approval">require_human_approval</option>
          <option value="handoff">handoff</option>
          <option value="reject_with_reason">reject_with_reason</option>
        </select>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("approvalPolicy.policyConflictStrategy")}
        label="policyConflictStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "approvalPolicy.policyConflictStrategy", "handoff")}
          onChange={(event) => onChange(updateRule(config, "approvalPolicy.policyConflictStrategy", event.target.value))}
        >
          <option value="handoff">handoff</option>
          <option value="fail_closed_error">fail_closed_error</option>
        </select>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("approvalPolicy.timeoutStrategy")}
        label="timeoutStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "approvalPolicy.timeoutStrategy", "remind_reviewer")}
          onChange={(event) => onChange(updateRule(config, "approvalPolicy.timeoutStrategy", event.target.value))}
        >
          <option value="remind_reviewer">remind_reviewer</option>
          <option value="handoff">handoff</option>
          <option value="fail_closed_error">fail_closed_error</option>
        </select>
      </ImpactField>

      <h4>Risk Policy</h4>
      {["requireHumanForHighRisk", "requireEvidenceBeforeDecision", "requireReasonForRejection"].map((name) => (
        <ImpactCheckbox
          key={name}
          config={config}
          fieldPath={fullRulePath(`riskPolicy.${name}`)}
          label={name}
          checked={fieldValue(config, `riskPolicy.${name}`, false)}
          onChange={(checked) => onChange(updateRule(config, `riskPolicy.${name}`, checked))}
          onSelectImpact={onSelectImpact}
        />
      ))}
      <ImpactField
        config={config}
        fieldPath={fullRulePath("riskPolicy.maxUserRetryCount")}
        label="maxUserRetryCount"
        onSelectImpact={onSelectImpact}
      >
        <input
          type="number"
          value={fieldValue(config, "riskPolicy.maxUserRetryCount", 0)}
          onChange={(event) => onChange(updateRule(config, "riskPolicy.maxUserRetryCount", Number(event.target.value)))}
        />
      </ImpactField>

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
      {["includeDecisionReason", "includeNextSteps", "includeHumanReviewEntry"].map((name) => (
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
        <span>containsRealEndpoint=false / containsSecret=false / no real approval system</span>
      </div>
    </section>
  );
}
