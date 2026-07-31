import { useI18n } from "../../i18n";
import type { ScenarioRunEvidenceBundle } from "@yutra/scenario-run-evidence-core";

export function ScenarioEvidenceProvenance(props: {
  bundle: ScenarioRunEvidenceBundle;
}) {
  const { t } = useI18n();
  return (
    <section className="scenario-evidence-provenance" aria-label="Scenario Evidence Provenance">
      <h3>{t("scenario.evidence.provenance")}</h3>
      <dl className="scenario-key-values">
        {Object.entries(props.bundle.sources).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd><code>{value}</code></dd>
          </div>
        ))}
      </dl>
      <div className="scenario-invariants">
        <span>redacted={String(props.bundle.redactionSummary.redacted)}</span>
        <span>containsCustomerData=false</span>
        <span>containsRealEndpoint=false</span>
        <span>containsSecret=false</span>
        <span>{t("scenario.evidence.noPersistence")}</span>
      </div>
    </section>
  );
}
