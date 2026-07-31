import { useI18n } from "../../i18n";
import type { ScenarioEvidenceReplayResult } from "@yutra/scenario-run-evidence-core";

export function ScenarioEvidenceIntegrity(props: {
  result?: ScenarioEvidenceReplayResult;
}) {
  const { t } = useI18n();
  return (
    <section className="scenario-evidence-integrity" aria-label="Scenario Evidence Integrity">
      <h3>{t("scenario.evidence.integrity")}</h3>
      <dl className="scenario-key-values">
        <div>
          <dt>{t("scenario.evidence.integrityStatus")}</dt>
          <dd>{props.result?.integrityStatus ?? t("scenario.evidence.pending")}</dd>
        </div>
        <div>
          <dt>{t("scenario.evidence.replayMode")}</dt>
          <dd>{props.result?.replayMode ?? "offline_evidence"}</dd>
        </div>
        <div>
          <dt>{t("scenario.evidence.runtimeExecuted")}</dt>
          <dd>{String(props.result?.runtimeExecuted ?? false)}</dd>
        </div>
      </dl>
      {props.result && !props.result.valid ? (
        <ul className="scenario-blockers" role="alert">
          {props.result.blockers.map((item) => (
            <li key={`${item.code}:${item.message}`}>
              <code>{item.code}</code> {item.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
