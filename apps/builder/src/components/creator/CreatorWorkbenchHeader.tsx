import { useI18n } from "../../i18n";
import { getCreatorArchetypeManifest } from "./archetype-taxonomy-ui";

export function CreatorWorkbenchHeader(props: { archetypeId: string }) {
  const { locale, t } = useI18n();
  const manifest = getCreatorArchetypeManifest(props.archetypeId);
  const taxonomy = manifest?.taxonomy;
  const primaryOutput = taxonomy?.primaryOutput ? (locale === "zh-CN" ? taxonomy.primaryOutput.zhCN : taxonomy.primaryOutput.en) : undefined;

  return (
    <section className="creator-hero" aria-label="Creator Workbench Header">
      <div>
        <p className="eyebrow">Agent Creation Workbench</p>
        <h2>Creator Workbench</h2>
        <p className="hint">Configure business rules, compile in memory, and inspect governed agent artifacts.</p>
        {taxonomy ? (
          <div className="creator-hero-taxonomy" aria-label="Current Archetype Taxonomy Summary">
            <span>
              {t("creator.archetype.primaryOutput")}: {primaryOutput}
            </span>
            <span>
              {t("creator.archetype.triggerPattern")}: {taxonomy.triggerPattern}
            </span>
            <span>
              {t("creator.archetype.behaviorPrimitives")}: {taxonomy.primitiveRefs.join(", ")}
            </span>
          </div>
        ) : null}
      </div>
      <div className="creator-hero-status">
        <span className="status-pill ok">{props.archetypeId}</span>
        <span className="status-pill warning">{t("creator.boundary.demoMockOnly")}</span>
        <span className="status-pill warning">{t("creator.boundary.noAutomaticRuntime")}</span>
      </div>
    </section>
  );
}
