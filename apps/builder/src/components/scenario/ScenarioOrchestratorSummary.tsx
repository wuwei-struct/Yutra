import { useI18n } from "../../i18n";
import type { ScenarioOrchestratorCompileResult } from "../../types";

export function ScenarioOrchestratorSummary(props: {
  result: ScenarioOrchestratorCompileResult;
}) {
  const { t } = useI18n();
  const { result } = props;
  const document = result.orchestratorDocument;
  return (
    <section className="scenario-panel" aria-label="Scenario Orchestrator Summary">
      <div className="scenario-section-heading">
        <div>
          <p className="eyebrow">{t("scenario.orchestrator.contract")}</p>
          <h3>{t("scenario.orchestrator.summary")}</h3>
        </div>
        <span className="status-pill">kind={document.kind}</span>
      </div>
      <p className="scenario-orchestrator-warning">
        {t("scenario.orchestrator.runtimeBoundary")}
      </p>
      <dl className="scenario-compile-summary">
        <dt>orchestratorId</dt><dd>{result.orchestratorId}</dd>
        <dt>orchestratorVersion</dt><dd>{result.orchestratorVersion}</dd>
        <dt>compositionId</dt><dd>{result.compositionId}</dd>
        <dt>patternId</dt><dd>{result.patternId}</dd>
        <dt>executionModel</dt><dd>{document.executionModel}</dd>
        <dt>entrySlotId</dt><dd>{document.entrySlotId}</dd>
        <dt>slotCount</dt><dd>{document.slots.length}</dd>
        <dt>routeCount</dt><dd>{document.routes.length}</dd>
        <dt>bindingCount</dt><dd>{document.bindings.length}</dd>
        <dt>overlayCount</dt><dd>{document.overlayRefs.length}</dd>
        <dt>compilerVersion</dt><dd>{result.compilerVersion}</dd>
        <dt>planHash</dt><dd>{result.planHash}</dd>
        <dt>compositionBundleHash</dt><dd>{result.compositionBundleHash}</dd>
        <dt>orchestratorHash</dt><dd>{result.orchestratorHash}</dd>
        <dt>previewBundleHash</dt><dd>{result.previewBundleHash}</dd>
        <dt>previewOnly</dt><dd>{String(result.previewOnly)}</dd>
        <dt>runtimeExecutable</dt><dd>{String(result.runtimeExecutable)}</dd>
        <dt>currentRuntimeSupported</dt><dd>{String(result.currentRuntimeSupported)}</dd>
      </dl>
    </section>
  );
}
