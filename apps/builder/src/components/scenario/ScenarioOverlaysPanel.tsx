import { useI18n } from "../../i18n";
import type { ScenarioCompositionOverlay } from "../../types";
import { scopeLabel } from "./scenario-composition-ui";

export function ScenarioOverlaysPanel(props: { overlays: ScenarioCompositionOverlay[] }) {
  const { t } = useI18n();
  return (
    <section className="scenario-detail-panel" aria-label="Composition Overlays">
      <h3>{t("scenario.overlays")}</h3>
      <div className="scenario-overlay-grid">
        {props.overlays.map((overlay) => (
          <article key={overlay.overlayId}>
            <strong>{overlay.overlayId}</strong>
            <code>{overlay.archetypeId}</code>
            <span>{overlay.enforcementMode}</span>
            <small>{overlay.scopes.map(scopeLabel).join(", ")}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
