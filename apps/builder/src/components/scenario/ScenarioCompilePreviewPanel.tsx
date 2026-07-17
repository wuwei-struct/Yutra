import { useI18n } from "../../i18n";
import type { ScenarioCompositionCompileResult, ScenarioCompositionDetailResponse } from "../../types";

export function ScenarioCompilePreviewPanel(props: {
  detail: ScenarioCompositionDetailResponse;
  loading: boolean;
  result?: ScenarioCompositionCompileResult;
  error?: { code: string; message: string };
  onCompile: () => void;
}) {
  const { t } = useI18n();
  const enabled = props.detail.eligibleForCompilePreview && !props.loading;
  return (
    <section className="scenario-panel scenario-compile-panel" aria-label="Scenario Compile Preview">
      <div className="scenario-section-heading">
        <div>
          <p className="eyebrow">{t("scenario.previewOnly")}</p>
          <h2>{t("scenario.compilePreview")}</h2>
        </div>
        <button type="button" disabled={!enabled} onClick={props.onCompile}>
          {props.loading ? t("scenario.compiling") : t("scenario.compileAction")}
        </button>
      </div>
      {!props.detail.eligibleForCompilePreview ? (
        <p className="warning-text">
          {props.detail.readiness.blockers.join("; ") || t("scenario.comingLater")}
        </p>
      ) : null}
      {props.error ? (
        <div className="scenario-error" role="alert">
          <code>{props.error.code}</code>
          <p>{props.error.message}</p>
        </div>
      ) : null}
      {props.result ? (
        <dl className="scenario-compile-summary">
          <dt>previewOnly</dt><dd>{String(props.result.previewOnly)}</dd>
          <dt>runtimeExecutable</dt><dd>{String(props.result.runtimeExecutable)}</dd>
          <dt>planHash</dt><dd>{props.result.planHash}</dd>
          <dt>bundleHash</dt><dd>{props.result.bundleHash}</dd>
          <dt>compositionCompilerVersion</dt><dd>{props.result.compositionCompilerVersion}</dd>
          <dt>slotCount</dt><dd>{props.result.slots.length}</dd>
          <dt>warnings</dt><dd>{props.result.compileReport.warnings.length}</dd>
          <dt>blockers</dt><dd>{props.result.compileReport.blockers.length}</dd>
        </dl>
      ) : (
        <p className="hint">{t("scenario.noAutomaticCompile")}</p>
      )}
      <p className="warning-text">{t("scenario.noOrchestratorGenerated")}</p>
    </section>
  );
}
