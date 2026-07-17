import { useI18n } from "../../i18n";
import type { ScenarioCompositionDetailResponse } from "../../types";
import { readinessClass } from "./scenario-composition-ui";

export function ScenarioCompositionReadinessPanel(props: { detail: ScenarioCompositionDetailResponse }) {
  const { t } = useI18n();
  const { readiness } = props.detail;
  const checks = [
    ["contractValid", readiness.contractValid],
    ["patternAligned", readiness.patternAligned],
    ["allProductArchetypesCompilerEnabled", readiness.allProductArchetypesCompilerEnabled],
    ["allProductArchetypesWorkbenchEnabled", readiness.allProductArchetypesWorkbenchEnabled],
    ["allCrossCuttingAvailable", readiness.allCrossCuttingAvailable],
    ["compositionCompilerAvailable", readiness.compositionCompilerAvailable]
  ] as const;
  return (
    <section className="scenario-panel scenario-readiness" aria-label="Composition Readiness">
      <div className="scenario-section-heading">
        <h2>{t("scenario.readiness")}</h2>
        <span className={`status-pill ${readinessClass(readiness.status)}`}>{readiness.status}</span>
      </div>
      <div className="scenario-readiness-grid">
        {checks.map(([label, value]) => (
          <div key={label}>
            <code>{label}</code>
            <strong>{String(value)}</strong>
          </div>
        ))}
        <div>
          <code>previewOnly</code>
          <strong>true</strong>
        </div>
        <div>
          <code>runtimeExecutable</code>
          <strong>false</strong>
        </div>
      </div>
      {readiness.blockers.length > 0 ? (
        <div className="scenario-blockers">
          <strong>{t("scenario.blockers")}</strong>
          <ul>
            {readiness.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="warning-text">{t("scenario.compileReadyBoundary")}</p>
    </section>
  );
}
