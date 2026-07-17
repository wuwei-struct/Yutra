import { useI18n } from "../../i18n";
import type { ScenarioCompositionDetailResponse } from "../../types";
import { localized } from "./scenario-composition-ui";

export function ScenarioCompositionOverview(props: { detail: ScenarioCompositionDetailResponse }) {
  const { detail } = props;
  const { locale, t } = useI18n();
  const plan = detail.plan;
  const slots = plan.slots ?? [];
  return (
    <section className="scenario-panel scenario-overview" aria-label="Composition Overview">
      <div className="scenario-section-heading">
        <div>
          <p className="eyebrow">{t("scenario.compositionPlan")}</p>
          <h2>{localized(detail.pattern.name, locale)}</h2>
        </div>
        <span className="status-pill">{plan.executionModel}</span>
      </div>
      <dl className="scenario-overview-grid">
        <dt>compositionId</dt>
        <dd>{plan.compositionId}</dd>
        <dt>version</dt>
        <dd>{plan.version ?? "-"}</dd>
        <dt>patternRef</dt>
        <dd>{`${plan.patternRef.patternId}@${plan.patternRef.version}`}</dd>
        <dt>{t("scenario.primaryOutput")}</dt>
        <dd>{localized(detail.compositionSummary.primaryOutput, locale)}</dd>
        <dt>{t("scenario.acceptanceObject")}</dt>
        <dd>{localized(detail.compositionSummary.acceptanceObject, locale)}</dd>
        <dt>{t("scenario.trigger")}</dt>
        <dd>{detail.compositionSummary.triggerPattern}</dd>
        <dt>{t("scenario.primitives")}</dt>
        <dd>{detail.compositionSummary.primitiveCoverage.join(", ")}</dd>
        <dt>{t("scenario.governanceFocus")}</dt>
        <dd>
          {(locale === "zh-CN"
            ? detail.compositionSummary.governanceFocus.zhCN
            : detail.compositionSummary.governanceFocus.en
          ).join(", ")}
        </dd>
        <dt>{t("scenario.publicExposure")}</dt>
        <dd>{detail.publicBoundary.mode}</dd>
      </dl>
      <div className="scenario-slot-summary-grid">
        {slots.length > 0
          ? slots.map((slot) => (
              <article key={slot.slotId} className={`scenario-slot-card ${slot.role}`}>
                <span className="status-pill">{slot.role}</span>
                <strong>{slot.slotId}</strong>
                <code>{slot.archetypeId}</code>
                <small>{slot.packConfigId}</small>
                <p>{localized(slot.purpose, locale)}</p>
              </article>
            ))
          : (
              <article className="scenario-slot-card contract-only">
                <span className="status-pill warning">{t("scenario.contractOnly")}</span>
                <strong>{plan.primaryArchetypeId}</strong>
                <p>{(plan.supportingArchetypeIds ?? []).join(", ")}</p>
              </article>
            )}
      </div>
      <div className="scenario-invariants">
        <span>{t("scenario.namespacedConfigs")}</span>
        <span>{t("scenario.boundary.noDeepMerge")}</span>
        <span>{t("scenario.noAdapterInheritance")}</span>
        <span>{t("scenario.noSecretMerge")}</span>
        <span>{t("scenario.primaryTerminalOwnership")}</span>
      </div>
    </section>
  );
}
