import { useI18n } from "../../i18n";
import type { ScenarioRunPreviewResult } from "../../types";

export function ScenarioRunAuditPanel(props: {
  result: ScenarioRunPreviewResult;
}) {
  const { t } = useI18n();
  const result = props.result;
  return (
    <section className="scenario-panel" aria-label="Scenario Governance Evidence">
      <h3>{t("scenario.run.governance")}</h3>
      <div className="scenario-run-governance-grid">
        <article>
          <strong>{t("scenario.routes")}</strong>
          {result.selectedRoutes.map((route) => (
            <code key={route.routeId}>{route.routeId} → {route.effect}</code>
          ))}
          {!result.selectedRoutes.length ? <code>none</code> : null}
        </article>
        <article>
          <strong>{t("scenario.bindings")}</strong>
          {result.appliedBindings.map((binding) => (
            <code key={binding.bindingId}>{binding.bindingId}</code>
          ))}
          {!result.appliedBindings.length ? <code>none</code> : null}
        </article>
        <article>
          <strong>{t("scenario.overlays")}</strong>
          {result.evaluatedOverlays.map((overlay, index) => (
            <code key={`${overlay.overlayId}-${overlay.stage}-${index}`}>
              {overlay.overlayId}: {overlay.stage}={overlay.decision}
            </code>
          ))}
        </article>
        <article>
          <strong>{t("scenario.run.budget")}</strong>
          <code>slotInvocations={result.budgetUsage.slotInvocations}</code>
          <code>routeEvaluations={result.budgetUsage.routeEvaluations}</code>
          <code>bindingApplications={result.budgetUsage.bindingApplications}</code>
        </article>
        <article>
          <strong>{t("scenario.run.audit")}</strong>
          <code>status={result.auditSummary.status}</code>
          <code>redacted={String(result.auditSummary.redacted)}</code>
          <code>
            externalEffectsOccurred=
            {String(result.auditSummary.externalEffectsOccurred)}
          </code>
        </article>
        <article>
          <strong>{t("scenario.run.terminal")}</strong>
          <code>{result.terminalId}</code>
          <code>status={result.status}</code>
        </article>
      </div>
    </section>
  );
}
