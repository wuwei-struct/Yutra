import { useI18n } from "../../i18n";

export function CreatorBoundaryNotice() {
  const { t } = useI18n();

  return (
    <section className="creator-boundary-notice" aria-label="Creator Boundary Notice">
      <strong>{t("creator.boundary.demoMockOnly")}</strong>
      <p>{t("creator.boundary.notice")}</p>
      <div className="status-row wrap-row">
        <span className="status-pill warning">{t("creator.boundary.noAutomaticRuntime")}</span>
        <span className="status-pill warning">{t("creator.boundary.notProductionReady")}</span>
        <span className="status-pill ok">mock adapters only</span>
      </div>
    </section>
  );
}
