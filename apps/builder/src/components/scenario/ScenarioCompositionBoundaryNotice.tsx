import { useI18n } from "../../i18n";

export function ScenarioCompositionBoundaryNotice() {
  const { t } = useI18n();
  return (
    <aside className="scenario-boundary-notice" aria-label="Scenario Composition Boundary Notice">
      <strong>{t("scenario.boundary.title")}</strong>
      <p>{t("scenario.boundary.notice")}</p>
      <div className="taxonomy-chip-row">
        <span className="status-pill warning">{t("scenario.boundary.demoOnly")}</span>
        <span className="status-pill">{t("scenario.boundary.noDeepMerge")}</span>
        <span className="status-pill">{t("scenario.boundary.noOrchestrator")}</span>
        <span className="status-pill">{t("scenario.boundary.noRuntime")}</span>
        <span className="status-pill blocked">{t("scenario.boundary.notProduction")}</span>
      </div>
    </aside>
  );
}
