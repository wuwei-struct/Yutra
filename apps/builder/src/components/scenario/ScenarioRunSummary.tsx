import { useI18n } from "../../i18n";
import type { ScenarioRunPreviewResult } from "../../types";

export function ScenarioRunSummary(props: {
  result: ScenarioRunPreviewResult;
}) {
  const { t } = useI18n();
  const result = props.result;
  return (
    <section className="scenario-panel" aria-label="Scenario Run Summary">
      <div className="scenario-section-heading">
        <h3>{t("scenario.run.summary")}</h3>
        <span className={`scenario-run-status ${result.status}`}>
          {result.status}
        </span>
      </div>
      <dl className="scenario-compile-summary">
        <dt>compositionId</dt>
        <dd><code>{result.compositionId}</code></dd>
        <dt>orchestratorRunId</dt>
        <dd><code>{result.orchestratorRunId}</code></dd>
        <dt>demoCase</dt>
        <dd><code>{result.demoCase}</code></dd>
        <dt>terminalId</dt>
        <dd><code>{result.terminalId}</code></dd>
        <dt>scenarioCompleted</dt>
        <dd><code>{String(result.scenarioCompleted)}</code></dd>
        <dt>{t("scenario.run.slotCount")}</dt>
        <dd>{result.slotInvocationCount}</dd>
        <dt>{t("scenario.run.traceCount")}</dt>
        <dd>{result.traceSummary.eventCount}</dd>
        <dt>externalEffectsOccurred</dt>
        <dd><code>{String(result.externalEffectsOccurred)}</code></dd>
      </dl>
    </section>
  );
}
