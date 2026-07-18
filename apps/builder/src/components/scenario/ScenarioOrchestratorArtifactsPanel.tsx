import { useI18n } from "../../i18n";
import type { ScenarioOrchestratorCompileResult } from "../../types";

export const ORCHESTRATOR_ARTIFACT_FILENAMES = [
  "scenario.orchestrator.yaml",
  "orchestrator.routes.json",
  "orchestrator.context-policy.json",
  "orchestrator.trace-contract.json",
  "orchestrator.provenance.json",
  "orchestrator-report.json"
] as const;

export function ScenarioOrchestratorArtifactsPanel(props: {
  result: ScenarioOrchestratorCompileResult;
  selectedArtifact: string;
  onSelectArtifact: (filename: string) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="scenario-panel scenario-orchestrator-artifacts" aria-label="Orchestrator Artifacts">
      <div className="scenario-section-heading">
        <div>
          <p className="eyebrow">{t("scenario.orchestrator.notAgentDsl")}</p>
          <h3>{t("scenario.orchestrator.artifacts")}</h3>
        </div>
        <code>{props.result.artifactHashes[props.selectedArtifact]}</code>
      </div>
      <div className="tabs wrap-tabs">
        {ORCHESTRATOR_ARTIFACT_FILENAMES.map((filename) => (
          <button
            type="button"
            key={filename}
            className={props.selectedArtifact === filename ? "tab active" : "tab"}
            onClick={() => props.onSelectArtifact(filename)}
          >
            {filename}
          </button>
        ))}
      </div>
      <pre aria-label="Orchestrator Artifact Content">
        {props.result.orchestratorArtifacts[props.selectedArtifact]}
      </pre>
      <p className="scenario-orchestrator-warning">
        {t("scenario.orchestrator.editorBoundary")}
      </p>
    </section>
  );
}
