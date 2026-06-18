import { RunResultSummary } from "../RunResultSummary";
import { TestInputEditor } from "../TestInputEditor";
import type { StudioStateController } from "../../lib/studio-state";
import { useI18n } from "../../i18n";

interface RunDebugPanelProps {
  studio: StudioStateController;
  onRun: () => void;
  onDownloadTrace: () => void;
}

export function RunDebugPanel(props: RunDebugPanelProps) {
  const { studio, onRun, onDownloadTrace } = props;
  const { t } = useI18n();
  const dslRunBlocked = studio.sourceMode === "dsl" && !studio.lastValidDslSpec;

  return (
    <section className="studio-bottom-column" aria-label="Run Debug Panel">
      <div className="panel-title">
        <h2>{t("run.debugTitle")}</h2>
        <span>{studio.sourceMode === "dsl" ? t("run.runningFromDsl") : t("run.runningFromBuilder")}</span>
      </div>
      {dslRunBlocked ? <p className="warning-text">{t("run.dslBlocked")}</p> : null}
      <TestInputEditor
        samples={studio.sampleOptions}
        selectedSampleId={studio.selectedSampleId}
        jsonText={studio.inputJson}
        jsonError={studio.inputJsonError}
        onSampleChange={(sampleId) => {
          studio.setSelectedSampleId(sampleId);
          const sample = studio.sampleOptions.find((item) => item.id === sampleId);
          studio.setInputJson(JSON.stringify(sample?.input ?? { context: {} }, null, 2));
          studio.setInputJsonError("");
        }}
        onJsonTextChange={(value) => {
          studio.setInputJson(value);
          studio.setInputJsonError("");
        }}
      />
      <section className="panel-section">
        <h3>{t("run.environment")}</h3>
        <label className="field">
          <span>{t("run.environment")}</span>
          <select
            aria-label="Run Environment"
            value={studio.runOptions.environment}
            onChange={(event) =>
              studio.setRunOptions((prev) => ({ ...prev, environment: event.target.value as typeof studio.runOptions.environment }))
            }
          >
            <option value="mock">mock</option>
            <option value="demo">demo</option>
            <option value="prod-like">prod-like</option>
          </select>
        </label>
        <label className="field">
          <span>{t("run.llmProvider")}</span>
          <select
            aria-label="Run LLM Provider"
            value={studio.runOptions.llmProvider}
            onChange={(event) =>
              studio.setRunOptions((prev) => ({ ...prev, llmProvider: event.target.value as typeof studio.runOptions.llmProvider }))
            }
          >
            <option value="mock">{t("run.mock")}</option>
            <option value="real" disabled>
              {t("run.realLlm")}
            </option>
          </select>
        </label>
        <div className="hint">{t("run.skillDir")}</div>
        <details>
          <summary>{t("run.advanced")}</summary>
          <div className="advanced-grid">
            <label className="field">
              <span>maxDurationMs</span>
              <input
                aria-label="maxDurationMs"
                type="number"
                value={studio.runOptions.maxDurationMs}
                onChange={(event) => studio.setRunOptions((prev) => ({ ...prev, maxDurationMs: Number(event.target.value) }))}
              />
            </label>
            <label className="field">
              <span>maxExternalCalls</span>
              <input
                aria-label="maxExternalCalls"
                type="number"
                value={studio.runOptions.maxExternalCalls}
                onChange={(event) => studio.setRunOptions((prev) => ({ ...prev, maxExternalCalls: Number(event.target.value) }))}
              />
            </label>
            <label className="field">
              <span>timeoutMs</span>
              <input
                aria-label="timeoutMs"
                type="number"
                value={studio.runOptions.timeoutMs}
                onChange={(event) => studio.setRunOptions((prev) => ({ ...prev, timeoutMs: Number(event.target.value) }))}
              />
            </label>
            <label className="field">
              <span>{t("run.retryAttempts")}</span>
              <input
                aria-label="retry attempts"
                type="number"
                value={studio.runOptions.retryAttempts}
                onChange={(event) => studio.setRunOptions((prev) => ({ ...prev, retryAttempts: Number(event.target.value) }))}
              />
            </label>
          </div>
        </details>
      </section>
      <div className="run-actions">
        <button type="button" onClick={onRun} disabled={studio.runLoading || dslRunBlocked}>
          {studio.runLoading ? t("run.running") : t("run.preview")}
        </button>
        <button type="button" onClick={studio.resetRunInput}>
          {t("run.reset")}
        </button>
        <button type="button" onClick={onDownloadTrace} disabled={!studio.runResponse?.ok || !studio.runResponse.traceJsonl}>
          {t("run.downloadTrace")}
        </button>
      </div>
      {studio.runError ? <p className="error-text">{studio.runError}</p> : null}
      {studio.runResponse ? <RunResultSummary response={studio.runResponse} /> : null}
    </section>
  );
}
