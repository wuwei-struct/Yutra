import type { CreatorCompilePreviewResponse } from "../../types";
import { useI18n } from "../../i18n";
import { getRuleImpactsForArchetype } from "./creator-ui-helpers";

export function CompileReportSummary(props: { response: CreatorCompilePreviewResponse; archetypeId: string }) {
  const report = props.response.report;
  const { t } = useI18n();
  const impacts = getRuleImpactsForArchetype(props.archetypeId);
  const artifactCounts = impacts.reduce<Record<string, number>>((counts, impactItem) => {
    for (const artifact of impactItem.artifacts) {
      counts[artifact] = (counts[artifact] ?? 0) + 1;
    }
    return counts;
  }, {});
  const failClosedFields = impacts.filter((impactItem) =>
    impactItem.safetyNotes?.en?.some((note) => note.toLowerCase().includes("fail-closed"))
  );
  const handoffFields = impacts.filter((impactItem) =>
    impactItem.affects.some((target) => target.id.toLowerCase().includes("handoff"))
  );

  return (
    <section className="creator-section" aria-label="Compile Report">
      <h3>Compile Report</h3>
      {report ? (
        <>
          <dl className="creator-report-grid">
            <dt>compileId</dt>
            <dd>{props.response.compileId ?? "-"}</dd>
            <dt>compilerVersion</dt>
            <dd>{props.response.compilerVersion ?? report.compilerVersion}</dd>
            <dt>mode</dt>
            <dd>{props.response.mode ?? report.mode}</dd>
            <dt>configHash</dt>
            <dd>{report.packConfigHash}</dd>
            <dt>failClosedPolicy</dt>
            <dd>
              <span className="status-pill ok">{report.failClosedPolicy}</span>
            </dd>
          </dl>
          <h4>Coverage</h4>
          <pre>{JSON.stringify(report.coverage, null, 2)}</pre>
          <h4>Artifact Hashes</h4>
          <pre>{JSON.stringify(report.artifactHashes, null, 2)}</pre>
          <h4>{t("creator.impact.summary")}</h4>
          <div className="impact-summary-grid" aria-label="Rule Impact Summary">
            <div>
              <strong>{impacts.length}</strong>
              <span>{t("creator.impact.explainedFields")}</span>
            </div>
            <div>
              <strong>{failClosedFields.length}</strong>
              <span>{t("creator.impact.failClosedFields")}</span>
            </div>
            <div>
              <strong>{handoffFields.length}</strong>
              <span>{t("creator.impact.handoffFields")}</span>
            </div>
          </div>
          <div className="artifact-chip-row">
            {Object.entries(artifactCounts).map(([artifact, count]) => (
              <span key={artifact} className="status-pill">
                {artifact}: {count}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="hint">Compile report unavailable.</p>
      )}
    </section>
  );
}
