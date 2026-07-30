import { useI18n } from "../../i18n";
import type { ScenarioRunPreviewTimelineItem } from "../../types";

export function ScenarioRunTimeline(props: {
  items: ScenarioRunPreviewTimelineItem[];
}) {
  const { t } = useI18n();
  return (
    <section className="scenario-panel scenario-run-timeline" aria-label="Scenario Timeline">
      <h3>{t("scenario.run.timeline")}</h3>
      <ol>
        {props.items.map((item) => (
          <li key={`${item.index}-${item.type}`}>
            <span className="scenario-timeline-index">{item.index}</span>
            <div>
              <strong>{item.type}</strong>
              <small>{item.source}</small>
              <div className="scenario-timeline-evidence">
                {item.slotId ? <code>slot={item.slotId}</code> : null}
                {item.semanticOutcome ? (
                  <code>outcome={item.semanticOutcome}</code>
                ) : null}
                {item.routeId ? <code>route={item.routeId}</code> : null}
                {item.bindingId ? <code>binding={item.bindingId}</code> : null}
                {item.overlayId ? <code>overlay={item.overlayId}</code> : null}
                {item.decision ? <code>decision={item.decision}</code> : null}
                {item.errorCode ? <code>error={item.errorCode}</code> : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
