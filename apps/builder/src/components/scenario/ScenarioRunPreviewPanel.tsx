import { useI18n } from "../../i18n";
import type {
  ScenarioRunPreviewDemoCase,
  ScenarioRunPreviewResult
} from "../../types";
import type { ScenarioRunStatus } from "../../lib/scenario-run-state";
import { ScenarioRunAuditPanel } from "./ScenarioRunAuditPanel";
import { ScenarioRunCaseSelector } from "./ScenarioRunCaseSelector";
import { ScenarioRunSummary } from "./ScenarioRunSummary";
import { ScenarioRunTimeline } from "./ScenarioRunTimeline";
import { ScenarioSlotInvocationPanel } from "./ScenarioSlotInvocationPanel";

export function ScenarioRunPreviewPanel(props: {
  orchestratorReady: boolean;
  status: ScenarioRunStatus;
  demoCase: ScenarioRunPreviewDemoCase;
  availableCases: ScenarioRunPreviewDemoCase[];
  result?: ScenarioRunPreviewResult;
  errorCode: string;
  errorMessage: string;
  onSelectCase: (demoCase: ScenarioRunPreviewDemoCase) => void;
  onRun: () => void;
}) {
  const { t } = useI18n();
  const enabled =
    props.orchestratorReady &&
    props.availableCases.length > 0 &&
    props.status !== "running";
  return (
    <section className="scenario-run-preview" aria-label="Scenario Run Preview">
      <section className="scenario-run-boundary" aria-label="Scenario Run Preview Boundary">
        <p className="eyebrow">{t("scenario.run.manualOnly")}</p>
        <h2>{t("scenario.run.title")}</h2>
        <p>{t("scenario.run.boundary")}</p>
        <div className="scenario-invariants">
          <span>{t("scenario.run.manualOnly")}</span>
          <span>{t("scenario.boundary.demoOnly")}</span>
          <span>{t("scenario.run.noSideEffects")}</span>
          <span>{t("scenario.run.inMemory")}</span>
          <span>{t("scenario.run.noPersistence")}</span>
          <span>{t("scenario.boundary.notProduction")}</span>
        </div>
      </section>
      <section className="scenario-panel scenario-compile-panel">
        <div className="scenario-section-heading">
          <div>
            <p className="eyebrow">{t("scenario.run.evidence")}</p>
            <h2>{t("scenario.run.action")}</h2>
          </div>
          <button type="button" disabled={!enabled} onClick={props.onRun}>
            {props.status === "running"
              ? t("scenario.run.running")
              : t("scenario.run.action")}
          </button>
        </div>
        {!props.orchestratorReady ? (
          <p className="hint">{t("scenario.run.requiresOrchestrator")}</p>
        ) : null}
        <p className="hint">{t("scenario.run.noAutomaticRun")}</p>
        <ScenarioRunCaseSelector
          cases={props.availableCases}
          selectedCase={props.demoCase}
          disabled={props.status === "running"}
          onSelect={props.onSelectCase}
        />
        {props.status === "error" ? (
          <div className="scenario-error" role="alert">
            <code>{props.errorCode}</code>
            <p>{props.errorMessage}</p>
          </div>
        ) : null}
      </section>
      {props.result ? (
        <div className="scenario-run-result">
          <div className="scenario-overview-layout">
            <ScenarioRunSummary result={props.result} />
            <ScenarioRunAuditPanel result={props.result} />
          </div>
          <ScenarioSlotInvocationPanel slots={props.result.slotInvocations} />
          <ScenarioRunTimeline items={props.result.timeline} />
        </div>
      ) : null}
    </section>
  );
}
