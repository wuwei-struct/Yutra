import type {
  RuleImpactDefinition,
  RuleImpactTargetKind
} from "../../../../../packages/pack-config-core/src/rule-impact";
import { useI18n, type MessageKey } from "../../i18n";

const targetLabels: Record<RuleImpactTargetKind, MessageKey> = {
  guard: "creator.impact.guard",
  action: "creator.impact.action",
  transition: "creator.impact.transition",
  policy: "creator.impact.policy",
  template: "creator.impact.template",
  test_case: "creator.impact.testCase",
  trace_expectation: "creator.impact.traceExpectation",
  adapter_config: "creator.impact.adapterConfig"
};

export function RuleImpactPanel(props: { impact?: RuleImpactDefinition }) {
  const { impact } = props;
  const { locale, t } = useI18n();
  const localeKey = locale === "zh-CN" ? "zhCN" : "en";

  return (
    <section className="creator-section rule-impact-panel" aria-label="Rule Impact Panel">
      <h3>{t("creator.impact.title")}</h3>
      {!impact ? <p className="hint">{t("creator.impact.noMetadata")}</p> : null}
      {impact ? (
        <>
          <div className="rule-impact-header">
            <span className="status-pill">{impact.fieldPath}</span>
            <strong>{impact.label[localeKey]}</strong>
          </div>
          <p>{impact.summary[localeKey]}</p>
          <h4>{t("creator.impact.affects")}</h4>
          <div className="impact-target-list">
            {impact.affects.map((target) => (
              <div key={`${target.kind}:${target.id}`} className="impact-target-card">
                <span className="status-pill">{t(targetLabels[target.kind])}</span>
                <strong>{target.id}</strong>
                <p>{target.label[localeKey]}</p>
              </div>
            ))}
          </div>
          <h4>{t("creator.impact.artifacts")}</h4>
          <div className="artifact-chip-row">
            {impact.artifacts.map((artifact) => (
              <span key={artifact} className="status-pill ok">
                {artifact}
              </span>
            ))}
          </div>
          <h4>{t("creator.impact.safetyNotes")}</h4>
          {impact.safetyNotes?.[localeKey]?.length ? (
            <ul className="impact-notes">
              {impact.safetyNotes[localeKey]?.map((note) => <li key={note}>{note}</li>)}
            </ul>
          ) : (
            <p className="hint">{t("creator.impact.noSafetyNotes")}</p>
          )}
        </>
      ) : null}
    </section>
  );
}
