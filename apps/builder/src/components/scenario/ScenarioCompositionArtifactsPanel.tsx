import { useState } from "react";
import { useI18n } from "../../i18n";
import type { ScenarioCompositionCompileResult } from "../../types";
import { COMPOSITION_ARTIFACT_FILENAMES } from "./scenario-composition-ui";

export function ScenarioCompositionArtifactsPanel(props: { result: ScenarioCompositionCompileResult }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string>(COMPOSITION_ARTIFACT_FILENAMES[0]);
  return (
    <section className="scenario-panel scenario-artifacts" aria-label="Composition Artifacts">
      <h2>{t("scenario.compositionArtifacts")}</h2>
      <div className="tabs wrap-tabs">
        {COMPOSITION_ARTIFACT_FILENAMES.map((filename) => (
          <button
            type="button"
            key={filename}
            className={selected === filename ? "tab active" : "tab"}
            onClick={() => setSelected(filename)}
          >
            {filename}
          </button>
        ))}
      </div>
      <pre aria-label="Composition Artifact Content">{props.result.compositionArtifacts[selected]}</pre>
    </section>
  );
}
