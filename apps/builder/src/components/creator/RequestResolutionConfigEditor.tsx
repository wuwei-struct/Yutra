import type { PackConfig } from "@yutra/pack-config-core";
import { fieldValue, fullRulePath, updateCapability, updateRule } from "./creator-ui-helpers";
import { ImpactCheckbox, ImpactField } from "./CreatorFieldControls";

export function RequestResolutionConfigEditor(props: {
  config: PackConfig;
  onChange: (config: PackConfig) => void;
  onSelectImpact: (fieldPath: string) => void;
}) {
  const { config, onChange, onSelectImpact } = props;
  const capabilityIds = ["orderLookup", "shippingLookup", "refundRequest", "returnRequest", "handoff"];

  return (
    <section className="creator-section" aria-label="Request Resolution Config Editor">
      <h3>Request Resolution Config</h3>
      <p className="hint">Demo/mock only. Adapter mode is fixed to mock; no endpoint or secret input is exposed.</p>

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

      <h4>Refund Policy</h4>
      <ImpactCheckbox
        config={config}
        fieldPath={fullRulePath("refundPolicy.autoRefundWhenNotShipped")}
        label="autoRefundWhenNotShipped"
        checked={fieldValue(config, "refundPolicy.autoRefundWhenNotShipped", false)}
        onChange={(checked) => onChange(updateRule(config, "refundPolicy.autoRefundWhenNotShipped", checked))}
        onSelectImpact={onSelectImpact}
      />
      <ImpactField
        config={config}
        fieldPath={fullRulePath("refundPolicy.autoRefundMaxAmount")}
        label="autoRefundMaxAmount"
        onSelectImpact={onSelectImpact}
      >
        <input
          aria-label="autoRefundMaxAmount"
          type="number"
          value={fieldValue(config, "refundPolicy.autoRefundMaxAmount", 0)}
          onChange={(event) => onChange(updateRule(config, "refundPolicy.autoRefundMaxAmount", Number(event.target.value)))}
        />
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("refundPolicy.shippedOrderStrategy")}
        label="shippedOrderStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "refundPolicy.shippedOrderStrategy", "require_return_first")}
          onChange={(event) => onChange(updateRule(config, "refundPolicy.shippedOrderStrategy", event.target.value))}
        >
          <option value="require_return_first">require_return_first</option>
          <option value="handoff">handoff</option>
          <option value="reject_with_template">reject_with_template</option>
        </select>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("refundPolicy.expiredAfterSaleStrategy")}
        label="expiredAfterSaleStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "refundPolicy.expiredAfterSaleStrategy", "ask_for_more_info")}
          onChange={(event) => onChange(updateRule(config, "refundPolicy.expiredAfterSaleStrategy", event.target.value))}
        >
          <option value="reject_with_template">reject_with_template</option>
          <option value="handoff">handoff</option>
          <option value="ask_for_more_info">ask_for_more_info</option>
        </select>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("refundPolicy.apiFailureStrategy")}
        label="apiFailureStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "refundPolicy.apiFailureStrategy", "retry_then_handoff")}
          onChange={(event) => onChange(updateRule(config, "refundPolicy.apiFailureStrategy", event.target.value))}
        >
          <option value="retry_then_handoff">retry_then_handoff</option>
          <option value="handoff">handoff</option>
          <option value="fail_closed_error">fail_closed_error</option>
        </select>
      </ImpactField>

      <h4>Handoff Policy</h4>
      {["highValueRefund", "complaint", "orderNotFound", "ruleConflict"].map((name) => (
        <ImpactCheckbox
          key={name}
          config={config}
          fieldPath={fullRulePath(`handoffPolicy.${name}`)}
          label={name}
          checked={fieldValue(config, `handoffPolicy.${name}`, false)}
          onChange={(checked) => onChange(updateRule(config, `handoffPolicy.${name}`, checked))}
          onSelectImpact={onSelectImpact}
        />
      ))}
      <ImpactField
        config={config}
        fieldPath={fullRulePath("handoffPolicy.maxUserRetryCount")}
        label="maxUserRetryCount"
        onSelectImpact={onSelectImpact}
      >
        <input
          type="number"
          value={fieldValue(config, "handoffPolicy.maxUserRetryCount", 0)}
          onChange={(event) => onChange(updateRule(config, "handoffPolicy.maxUserRetryCount", Number(event.target.value)))}
        />
      </ImpactField>

      <h4>Response Style</h4>
      <ImpactField config={config} fieldPath={fullRulePath("responseStyle.tone")} label="tone" onSelectImpact={onSelectImpact}>
        <select
          value={fieldValue(config, "responseStyle.tone", "warm_professional")}
          onChange={(event) => onChange(updateRule(config, "responseStyle.tone", event.target.value))}
        >
          <option value="neutral">neutral</option>
          <option value="warm_professional">warm_professional</option>
          <option value="concise">concise</option>
        </select>
      </ImpactField>
      {["includeReason", "includeHumanSupportEntry"].map((name) => (
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
        <span>containsRealEndpoint=false / containsSecret=false</span>
      </div>
    </section>
  );
}
