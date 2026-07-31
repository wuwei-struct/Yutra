import { useI18n } from "../../i18n";
import type { ScenarioEvidenceReplayResult } from "@yutra/scenario-run-evidence-core";

export function ScenarioEvidenceReplayTimeline(props: {
  result: ScenarioEvidenceReplayResult;
}) {
  const { t } = useI18n();
  if (!props.result.valid) return null;
  return (
    <section className="scenario-evidence-replay" aria-label="Scenario Evidence Replay Timeline">
      <h3>{t("scenario.evidence.replayTimeline")}</h3>
      <ol>
        {props.result.timeline.map((item) => (
          <li key={item.index}>
            <span className="scenario-timeline-index">{item.index}</span>
            <div>
              <strong>{item.type}</strong>
              <small>{item.source}</small>
              <div className="scenario-timeline-evidence">
                {item.slotId ? <code>slotId={item.slotId}</code> : null}
                {item.semanticOutcome ? <code>outcome={item.semanticOutcome}</code> : null}
                {item.routeId ? <code>routeId={item.routeId}</code> : null}
                {item.bindingId ? <code>bindingId={item.bindingId}</code> : null}
                {item.overlayId ? <code>overlayId={item.overlayId}</code> : null}
                {item.terminalId ? <code>terminalId={item.terminalId}</code> : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
