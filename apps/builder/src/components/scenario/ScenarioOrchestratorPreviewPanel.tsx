import { useI18n } from "../../i18n";
import type {
  ScenarioCompositionCompileResult,
  ScenarioCompositionDetailResponse
} from "../../types";
import type { ScenarioOrchestratorStatus } from "../../lib/scenario-orchestrator-state";
import { ScenarioOrchestratorArtifactsPanel } from "./ScenarioOrchestratorArtifactsPanel";
import { ScenarioOrchestratorBoundaryNotice } from "./ScenarioOrchestratorBoundaryNotice";
import { ScenarioOrchestratorContractInspector } from "./ScenarioOrchestratorContractInspector";
import { ScenarioOrchestratorProfilePanel } from "./ScenarioOrchestratorProfilePanel";
import { ScenarioOrchestratorSummary } from "./ScenarioOrchestratorSummary";
import type { ScenarioOrchestratorCompileResult } from "../../types";

export function ScenarioOrchestratorPreviewPanel(props: {
  detail: ScenarioCompositionDetailResponse;
  compositionResult?: ScenarioCompositionCompileResult;
  status: ScenarioOrchestratorStatus;
  result?: ScenarioOrchestratorCompileResult;
  selectedArtifact: string;
  selectedProfileSection: string;
  errorCode: string;
  errorMessage: string;
  onCompile: () => void;
  onSelectArtifact: (filename: string) => void;
  onSelectProfileSection: (section: string) => void;
}) {
  const { t } = useI18n();
  const enabled =
    Boolean(props.compositionResult) &&
    props.detail.orchestratorPreviewAvailable &&
    props.status !== "compiling";
  return (
    <section className="scenario-orchestrator-preview" aria-label="Scenario Orchestrator Preview">
      <ScenarioOrchestratorBoundaryNotice />
      <section className="scenario-panel scenario-compile-panel" aria-label="Orchestrator Compile Preview">
        <div className="scenario-section-heading">
          <div>
            <p className="eyebrow">{t("scenario.orchestrator.preview")}</p>
            <h2>{t("scenario.orchestrator.compileAction")}</h2>
          </div>
          <button type="button" disabled={!enabled} onClick={props.onCompile}>
            {props.status === "compiling"
              ? t("scenario.orchestrator.compiling")
              : t("scenario.orchestrator.compileAction")}
          </button>
        </div>
        {!props.compositionResult ? (
          <p className="hint">{t("scenario.orchestrator.requiresComposition")}</p>
        ) : null}
        {!props.detail.orchestratorPreviewAvailable ? (
          <div className="scenario-blockers">
            <strong>{t("scenario.orchestrator.unavailable")}</strong>
            <ul>
              {props.detail.orchestratorBlockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {props.status === "error" ? (
          <div className="scenario-error" role="alert">
            <code>{props.errorCode}</code>
            <p>{props.errorMessage}</p>
          </div>
        ) : null}
        {props.status === "idle" ? (
          <p className="hint">{t("scenario.orchestrator.noAutomaticCompile")}</p>
        ) : null}
      </section>
      {props.result ? (
        <div className="scenario-orchestrator-result">
          <div className="scenario-overview-layout">
            <ScenarioOrchestratorSummary result={props.result} />
            <ScenarioOrchestratorProfilePanel
              profileId={props.detail.orchestratorCompileProfileId}
              result={props.result}
              selectedSection={props.selectedProfileSection}
              onSelectSection={props.onSelectProfileSection}
            />
          </div>
          <ScenarioOrchestratorContractInspector result={props.result} />
          <ScenarioOrchestratorArtifactsPanel
            result={props.result}
            selectedArtifact={props.selectedArtifact}
            onSelectArtifact={props.onSelectArtifact}
          />
        </div>
      ) : null}
    </section>
  );
}
