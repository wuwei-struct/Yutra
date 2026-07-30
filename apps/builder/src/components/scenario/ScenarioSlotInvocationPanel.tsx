import { useI18n } from "../../i18n";
import type { ScenarioRunPreviewSlotSummary } from "../../types";

export function ScenarioSlotInvocationPanel(props: {
  slots: ScenarioRunPreviewSlotSummary[];
}) {
  const { t } = useI18n();
  return (
    <section className="scenario-panel" aria-label="Scenario Slot Invocations">
      <h3>{t("scenario.run.slotInvocations")}</h3>
      {props.slots.length ? (
        <div className="scenario-run-slot-grid">
          {props.slots.map((slot) => (
            <article key={slot.invocationIndex}>
              <strong>{slot.slotId}</strong>
              <code>invocationIndex={slot.invocationIndex}</code>
              <code>runtimeStatus={slot.runtimeStatus}</code>
              <code>runtimeFinalState={slot.runtimeFinalState ?? "n/a"}</code>
              <code>semanticOutcome={slot.semanticOutcome ?? "n/a"}</code>
              <code>projectionId={slot.projectionId ?? "n/a"}</code>
              <code>runtimeRunId={slot.runtimeRunId ?? "n/a"}</code>
              <code>traceReference={String(slot.traceReferenceAvailable)}</code>
              <code>auditReference={slot.auditReferenceStatus}</code>
            </article>
          ))}
        </div>
      ) : (
        <p className="hint">{t("scenario.run.noSlotInvocations")}</p>
      )}
    </section>
  );
}
