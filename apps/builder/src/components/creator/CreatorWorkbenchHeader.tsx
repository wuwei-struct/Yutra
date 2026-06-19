import { useI18n } from "../../i18n";

export function CreatorWorkbenchHeader(props: { archetypeId: string }) {
  const { t } = useI18n();

  return (
    <section className="creator-hero" aria-label="Creator Workbench Header">
      <div>
        <p className="eyebrow">Agent Creation Workbench</p>
        <h2>Creator Workbench</h2>
        <p className="hint">Configure business rules, compile in memory, and inspect governed agent artifacts.</p>
      </div>
      <div className="creator-hero-status">
        <span className="status-pill ok">{props.archetypeId}</span>
        <span className="status-pill warning">{t("creator.boundary.demoMockOnly")}</span>
        <span className="status-pill warning">{t("creator.boundary.noAutomaticRuntime")}</span>
      </div>
    </section>
  );
}
