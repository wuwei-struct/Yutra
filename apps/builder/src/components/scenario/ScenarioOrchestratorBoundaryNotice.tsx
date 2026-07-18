import { useI18n } from "../../i18n";

export function ScenarioOrchestratorBoundaryNotice() {
  const { t } = useI18n();
  return (
    <aside
      className="scenario-orchestrator-boundary"
      aria-label="Scenario Orchestrator Boundary Notice"
    >
      <strong>{t("scenario.orchestrator.boundaryTitle")}</strong>
      <p>{t("scenario.orchestrator.boundaryNotice")}</p>
      <div className="scenario-invariants">
        <span>{t("scenario.boundary.demoOnly")}</span>
        <span>{t("scenario.orchestrator.previewOnly")}</span>
        <span>{t("scenario.orchestrator.noAgentDsl")}</span>
        <span>{t("scenario.boundary.noRuntime")}</span>
        <span>{t("scenario.boundary.noDeepMerge")}</span>
        <span>{t("scenario.noAdapterInheritance")}</span>
        <span>{t("scenario.noSecretMerge")}</span>
        <span>{t("scenario.boundary.notProduction")}</span>
      </div>
    </aside>
  );
}
