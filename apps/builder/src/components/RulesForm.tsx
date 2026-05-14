import type { EcommerceRuleInputs } from "../types";

interface RulesFormProps {
  rules: EcommerceRuleInputs;
  onChange: (rules: EcommerceRuleInputs) => void;
}

export function RulesForm(props: RulesFormProps) {
  const { rules, onChange } = props;

  return (
    <section className="panel-section">
      <h3>规则配置</h3>
      <label className="field">
        <span>delayedShipmentThresholdHours</span>
        <input
          type="number"
          aria-label="delayedShipmentThresholdHours"
          value={rules.delayedShipmentThresholdHours}
          onChange={(event) => onChange({ ...rules, delayedShipmentThresholdHours: Number(event.target.value) })}
        />
      </label>
      <label className="field">
        <span>returnWindowDays</span>
        <input
          type="number"
          aria-label="returnWindowDays"
          value={rules.returnWindowDays}
          onChange={(event) => onChange({ ...rules, returnWindowDays: Number(event.target.value) })}
        />
      </label>
      <label className="field">
        <span>highRiskAmountThreshold</span>
        <input
          type="number"
          aria-label="highRiskAmountThreshold"
          value={rules.highRiskAmountThreshold}
          onChange={(event) => onChange({ ...rules, highRiskAmountThreshold: Number(event.target.value) })}
        />
      </label>
      <label className="checkbox-item">
        <input
          type="checkbox"
          aria-label="requireHumanForRefundAfterDelivery"
          checked={rules.requireHumanForRefundAfterDelivery}
          onChange={(event) => onChange({ ...rules, requireHumanForRefundAfterDelivery: event.target.checked })}
        />
        <span>requireHumanForRefundAfterDelivery</span>
      </label>
      <label className="checkbox-item">
        <input
          type="checkbox"
          aria-label="requireHumanForDamagedGoods"
          checked={rules.requireHumanForDamagedGoods}
          onChange={(event) => onChange({ ...rules, requireHumanForDamagedGoods: event.target.checked })}
        />
        <span>requireHumanForDamagedGoods</span>
      </label>
    </section>
  );
}
