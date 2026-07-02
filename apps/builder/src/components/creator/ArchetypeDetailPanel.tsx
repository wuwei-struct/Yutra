import type { ArchetypeManifest } from "../../../../../packages/archetype-core/src/types";
import { useI18n } from "../../i18n";
import { isSupportedCreatorArchetype } from "./creator-ui-helpers";

function localized(value: { en: string; zhCN: string } | undefined, locale: "en" | "zh-CN"): string {
  if (!value) {
    return "-";
  }
  return locale === "zh-CN" ? value.zhCN : value.en;
}

function localizedList(value: { en?: string[]; zhCN?: string[] } | undefined, locale: "en" | "zh-CN"): string[] {
  if (!value) {
    return [];
  }
  return locale === "zh-CN" ? value.zhCN ?? [] : value.en ?? [];
}

export function ArchetypeDetailPanel(props: { manifest?: ArchetypeManifest }) {
  const { locale, t } = useI18n();
  const manifest = props.manifest;

  if (!manifest) {
    return null;
  }

  const taxonomy = manifest.taxonomy;
  const supported = isSupportedCreatorArchetype(manifest.archetypeId);
  const governanceFocus = localizedList(taxonomy.governanceFocus, locale);
  const scenarioHints = localizedList(taxonomy.scenarioPatternHints, locale);

  return (
    <section className="creator-section archetype-detail-panel" aria-label="Archetype Detail Panel">
      <div className="creator-stage-header">
        <h3>{t("creator.archetype.detail")}</h3>
        <span className={supported ? "status-pill ok" : "status-pill warning"}>{supported ? t("creator.archetype.enabled") : t("creator.archetype.comingSoon")}</span>
      </div>
      <dl className="archetype-detail-grid">
        <dt>Archetype ID</dt>
        <dd>{manifest.archetypeId}</dd>
        <dt>{t("creator.archetype.layer")}</dt>
        <dd>{taxonomy.layer === "product_archetype" ? t("creator.archetype.product") : t("creator.archetype.crossCutting")}</dd>
        <dt>{t("creator.archetype.primaryOutput")}</dt>
        <dd>{localized(taxonomy.primaryOutput, locale)}</dd>
        <dt>{t("creator.archetype.acceptanceObject")}</dt>
        <dd>{localized(taxonomy.acceptanceObject, locale)}</dd>
        <dt>{t("creator.archetype.triggerPattern")}</dt>
        <dd>{taxonomy.triggerPattern ?? "-"}</dd>
        <dt>{t("creator.archetype.supported")}</dt>
        <dd>{supported ? "Yes" : "No"}</dd>
        <dt>{t("creator.archetype.compilerSupport")}</dt>
        <dd>{supported ? "Yes" : "No"}</dd>
      </dl>

      <div className="archetype-detail-block">
        <strong>{t("creator.archetype.behaviorPrimitives")}</strong>
        <div className="taxonomy-chip-row">
          {taxonomy.primitiveRefs.map((primitive) => (
            <span className="taxonomy-chip" key={primitive}>
              {primitive}
            </span>
          ))}
        </div>
      </div>

      <div className="archetype-detail-block">
        <strong>{t("creator.archetype.governanceFocus")}</strong>
        <ul>
          {governanceFocus.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="archetype-detail-block">
        <strong>{t("creator.archetype.scenarioHints")}</strong>
        {scenarioHints.length > 0 ? (
          <ul>
            {scenarioHints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="hint">-</p>
        )}
      </div>

      {taxonomy.layer === "cross_cutting_archetype" ? (
        <p className="warning-text">
          {t("creator.archetype.crossCuttingCapability")}: {t("creator.archetype.notStandalone")}
        </p>
      ) : null}
    </section>
  );
}
