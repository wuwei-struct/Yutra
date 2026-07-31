import { useI18n } from "../../i18n";
import { useScenarioCompositionState } from "../../lib/scenario-composition-state";
import { useScenarioEvidenceState } from "../../lib/scenario-evidence-state";
import { useScenarioOrchestratorState } from "../../lib/scenario-orchestrator-state";
import { useScenarioRunState } from "../../lib/scenario-run-state";
import { ScenarioCompositionArtifactsPanel } from "./ScenarioCompositionArtifactsPanel";
import { ScenarioCompositionBoundaryNotice } from "./ScenarioCompositionBoundaryNotice";
import { ScenarioCompositionOverview } from "./ScenarioCompositionOverview";
import { ScenarioCompositionReadinessPanel } from "./ScenarioCompositionReadinessPanel";
import { ScenarioCompilePreviewPanel } from "./ScenarioCompilePreviewPanel";
import { ScenarioEvidencePanel } from "./ScenarioEvidencePanel";
import { ScenarioPatternSelector } from "./ScenarioPatternSelector";
import { ScenarioPlanPreviewPanel } from "./ScenarioPlanPreviewPanel";
import {
  ScenarioSlotArtifactsPanel,
  type ScenarioSlotDslMetadata
} from "./ScenarioSlotArtifactsPanel";
import { ScenarioOrchestratorPreviewPanel } from "./ScenarioOrchestratorPreviewPanel";
import { ScenarioRunPreviewPanel } from "./ScenarioRunPreviewPanel";

export function ScenarioCompositionWorkbench(props: {
  onSendSlotDsl: (dslText: string, metadata: ScenarioSlotDslMetadata) => void;
}) {
  const { t } = useI18n();
  const state = useScenarioCompositionState();
  const orchestrator = useScenarioOrchestratorState(state.selectedCompositionId);
  const scenarioRun = useScenarioRunState(
    state.selectedCompositionId,
    Boolean(orchestrator.result)
  );
  const evidence = useScenarioEvidenceState(scenarioRun.result?.evidenceBundle);
  return (
    <main className="scenario-workbench" aria-label="Scenario Composition Workbench">
      <header className="scenario-hero">
        <div>
          <p className="eyebrow">{t("scenario.previewOnly")}</p>
          <h1>{t("scenario.title")}</h1>
          <p>{t("scenario.subtitle")}</p>
        </div>
        <div className="scenario-hero-flags">
          <span>previewOnly=true</span>
          <span>runtimeExecutable=false</span>
        </div>
      </header>
      <ScenarioCompositionBoundaryNotice />
      <ScenarioPatternSelector
        items={state.catalog}
        selectedId={state.selectedCompositionId}
        loading={state.catalogLoading}
        onSelect={state.selectComposition}
      />
      {state.error ? <p className="error-text" role="alert">{state.error}</p> : null}
      {state.detailLoading ? <p className="hint">{t("scenario.loadingDetail")}</p> : null}
      {state.detail ? (
        <>
          <div className="scenario-overview-layout">
            <ScenarioCompositionOverview detail={state.detail} />
            <ScenarioCompositionReadinessPanel detail={state.detail} />
          </div>
          <ScenarioPlanPreviewPanel plan={state.detail.plan} />
          <ScenarioCompilePreviewPanel
            detail={state.detail}
            loading={state.compileLoading}
            result={state.compileResult}
            error={state.compileError}
            onCompile={() => void state.compilePreview()}
          />
        </>
      ) : null}
      {state.compileResult ? (
        <div key={state.compileResult.compositionId} className="scenario-artifact-layout">
          <ScenarioCompositionArtifactsPanel result={state.compileResult} />
          <ScenarioSlotArtifactsPanel result={state.compileResult} onSendSlotDsl={props.onSendSlotDsl} />
        </div>
      ) : null}
      {state.detail ? (
        <ScenarioOrchestratorPreviewPanel
          detail={state.detail}
          compositionResult={state.compileResult}
          status={orchestrator.status}
          result={orchestrator.result}
          selectedArtifact={orchestrator.selectedArtifact}
          selectedProfileSection={orchestrator.selectedProfileSection}
          errorCode={orchestrator.errorCode}
          errorMessage={orchestrator.errorMessage}
          onCompile={() => void orchestrator.compilePreview()}
          onSelectArtifact={orchestrator.setSelectedArtifact}
          onSelectProfileSection={orchestrator.setSelectedProfileSection}
        />
      ) : null}
      {state.detail ? (
        <ScenarioRunPreviewPanel
          orchestratorReady={Boolean(orchestrator.result)}
          status={scenarioRun.status}
          demoCase={scenarioRun.demoCase}
          availableCases={scenarioRun.availableCases}
          result={scenarioRun.result}
          errorCode={scenarioRun.errorCode}
          errorMessage={scenarioRun.errorMessage}
          onSelectCase={scenarioRun.selectDemoCase}
          onRun={() => void scenarioRun.runPreview()}
        />
      ) : null}
      {state.detail ? (
        <ScenarioEvidencePanel
          bundle={scenarioRun.result?.evidenceBundle}
          status={evidence.status}
          result={evidence.result}
          onReplay={evidence.replay}
        />
      ) : null}
    </main>
  );
}
