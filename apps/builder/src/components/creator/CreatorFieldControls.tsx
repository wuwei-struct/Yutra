import type { ReactNode } from "react";
import type { PackConfig } from "@yutra/pack-config-core";
import { useI18n } from "../../i18n";
import { getConfigField, getRuleImpactForArchetype, sourceLabelKeys } from "./creator-ui-helpers";

export function FieldMeta(props: {
  config: PackConfig;
  fieldPath: string;
  onSelectImpact: (fieldPath: string) => void;
}) {
  const { t } = useI18n();
  const impact = getRuleImpactForArchetype(props.config.archetypeId, props.fieldPath);
  const field = getConfigField(props.config, props.fieldPath);

  return (
    <div className="field-meta-row">
      <span className="status-pill">
        {t("creator.impact.source")}: {field?.source ? t(sourceLabelKeys[field.source]) : "-"}
      </span>
      {impact?.artifacts.slice(0, 3).map((artifact) => (
        <span key={artifact} className="status-pill">
          {artifact}
        </span>
      ))}
      {impact && impact.artifacts.length > 3 ? <span className="status-pill">+{impact.artifacts.length - 3}</span> : null}
      <button type="button" className="impact-button" onClick={() => props.onSelectImpact(props.fieldPath)}>
        {t("creator.impact.impact")}
      </button>
    </div>
  );
}

export function ImpactCheckbox(props: {
  config: PackConfig;
  fieldPath: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onSelectImpact: (fieldPath: string) => void;
}) {
  return (
    <div className="creator-field-row">
      <label className="checkbox-item">
        <input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.target.checked)} />
        <span>{props.label}</span>
      </label>
      <FieldMeta config={props.config} fieldPath={props.fieldPath} onSelectImpact={props.onSelectImpact} />
    </div>
  );
}

export function ImpactField(props: {
  config: PackConfig;
  fieldPath: string;
  label: string;
  children: ReactNode;
  onSelectImpact: (fieldPath: string) => void;
}) {
  return (
    <div className="creator-field-row">
      <label className="field">
        {props.label}
        {props.children}
      </label>
      <FieldMeta config={props.config} fieldPath={props.fieldPath} onSelectImpact={props.onSelectImpact} />
    </div>
  );
}
