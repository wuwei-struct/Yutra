import { useI18n } from "../../i18n";
import type {
  ScenarioEvidenceReplayResult,
  ScenarioRunEvidenceBundle
} from "@yutra/scenario-run-evidence-core";
import type { ScenarioEvidenceReplayStatus } from "../../lib/scenario-evidence-state";
import { ScenarioEvidenceIntegrity } from "./ScenarioEvidenceIntegrity";
import { ScenarioEvidenceProvenance } from "./ScenarioEvidenceProvenance";
import { ScenarioEvidenceReplayTimeline } from "./ScenarioEvidenceReplayTimeline";

export function ScenarioEvidencePanel(props: {
  bundle?: ScenarioRunEvidenceBundle;
  status: ScenarioEvidenceReplayStatus;
  result?: ScenarioEvidenceReplayResult;
  onReplay: () => void;
}) {
  const { t } = useI18n();
  return (
    <section className="scenario-evidence-panel" aria-label="Scenario Evidence and Replay Inspector">
      <div className="scenario-section-heading">
        <div>
          <p className="eyebrow">{t("scenario.evidence.offlineOnly")}</p>
          <h2>{t("scenario.evidence.title")}</h2>
        </div>
        <button
          type="button"
          disabled={!props.bundle || props.status === "replaying"}
          onClick={props.onReplay}
        >
          {props.status === "replaying"
            ? t("scenario.evidence.replaying")
            : t("scenario.evidence.replayAction")}
        </button>
      </div>
      <p className="hint">{t("scenario.evidence.boundary")}</p>
      {props.bundle ? (
        <>
          <dl className="scenario-key-values scenario-evidence-identity">
            <div><dt>evidenceId</dt><dd><code>{props.bundle.evidenceId}</code></dd></div>
            <div><dt>evidenceHash</dt><dd><code>{props.bundle.evidenceHash}</code></dd></div>
          </dl>
          <div className="scenario-evidence-grid">
            <ScenarioEvidenceIntegrity result={props.result} />
            <ScenarioEvidenceProvenance bundle={props.bundle} />
          </div>
        </>
      ) : (
        <p className="hint">{t("scenario.evidence.requiresRun")}</p>
      )}
      {props.result?.valid ? (
        <>
          <div className="scenario-evidence-grid">
            <section aria-label="Scenario Evidence Slot Tree">
              <h3>{t("scenario.evidence.slotTree")}</h3>
              {props.result.slotTree.length ? props.result.slotTree.map((slot) => (
                <article key={slot.slotId} className="scenario-evidence-card">
                  <code>{slot.slotId}</code>
                  <span>invocations={slot.invocations.length}</span>
                </article>
              )) : <p className="hint">{t("scenario.run.noSlotInvocations")}</p>}
            </section>
            <section aria-label="Scenario Evidence Decision Summary">
              <h3>{t("scenario.evidence.decisions")}</h3>
              <div className="scenario-evidence-card">
                <span>projections={props.result.projectionSummary.length}</span>
                <span>routes={props.result.routeSummary.length}</span>
                <span>bindings={props.result.bindingSummary.length}</span>
                <span>overlays={props.result.overlaySummary.length}</span>
                <code>terminal={props.result.terminalSummary?.terminalId}</code>
              </div>
            </section>
          </div>
          <ScenarioEvidenceReplayTimeline result={props.result} />
        </>
      ) : null}
    </section>
  );
}
