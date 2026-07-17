import { useI18n } from "../../i18n";
import type { ScenarioCompositionCatalogItem } from "../../types";
import { localized, readinessClass } from "./scenario-composition-ui";

export function ScenarioPatternSelector(props: {
  items: ScenarioCompositionCatalogItem[];
  selectedId: string;
  loading: boolean;
  onSelect: (compositionId: string) => void;
}) {
  const { locale, t } = useI18n();
  return (
    <section className="scenario-selector" aria-label="Scenario Pattern Selector">
      <div className="scenario-section-heading">
        <div>
          <p className="eyebrow">{t("scenario.pattern")}</p>
          <h2>{t("scenario.catalog")}</h2>
        </div>
        <p>{t("scenario.notArchetype")}</p>
      </div>
      {props.loading ? <p className="hint">{t("scenario.loadingCatalog")}</p> : null}
      <div className="scenario-card-grid">
        {props.items.map((item) => (
          <button
            type="button"
            key={item.compositionId}
            className={props.selectedId === item.compositionId ? "scenario-card selected" : "scenario-card"}
            onClick={() => props.onSelect(item.compositionId)}
            aria-label={`Scenario ${item.compositionId}`}
          >
            <div className="scenario-card-header">
              <div>
                <strong>{localized(item.name, locale)}</strong>
                <code>{item.compositionId}</code>
              </div>
              <span className={`status-pill ${readinessClass(item.readiness.status)}`}>
                {item.eligibleForCompilePreview
                  ? t("scenario.compileAvailable")
                  : item.readiness.status === "contract_only"
                    ? t("scenario.contractOnly")
                    : t("scenario.partiallySupported")}
              </span>
            </div>
            <p>{localized(item.summary, locale)}</p>
            <dl className="scenario-card-facts">
              <dt>{t("scenario.trigger")}</dt>
              <dd>{item.triggerPattern}</dd>
              <dt>{t("scenario.primaryArchetype")}</dt>
              <dd>{item.primaryArchetypeId}</dd>
              <dt>{t("scenario.supportingArchetypes")}</dt>
              <dd>{item.supportingArchetypeIds.join(", ") || "-"}</dd>
              <dt>{t("scenario.crossCutting")}</dt>
              <dd>{item.crossCuttingArchetypeIds.join(", ") || "-"}</dd>
              <dt>{t("scenario.primaryOutput")}</dt>
              <dd>{localized(item.primaryOutput, locale)}</dd>
              <dt>{t("scenario.acceptanceObject")}</dt>
              <dd>{localized(item.acceptanceObject, locale)}</dd>
            </dl>
            {!item.eligibleForCompilePreview && item.readiness.blockers.length > 0 ? (
              <small>{item.readiness.blockers.join("; ")}</small>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
