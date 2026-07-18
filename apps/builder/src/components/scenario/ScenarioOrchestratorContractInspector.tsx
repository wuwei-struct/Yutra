import { useI18n } from "../../i18n";
import type { ScenarioOrchestratorCompileResult } from "../../types";

export function ScenarioOrchestratorContractInspector(props: {
  result: ScenarioOrchestratorCompileResult;
}) {
  const { t } = useI18n();
  const document = props.result.orchestratorDocument;
  return (
    <section className="scenario-panel" aria-label="Orchestrator Contract Inspector">
      <h3>{t("scenario.orchestrator.inspector")}</h3>
      <div className="scenario-contract-grid">
        <article>
          <h4>{t("scenario.orchestrator.execution")}</h4>
          <code>{document.executionModel}</code>
          <span>entry: {document.entrySlotId}</span>
          <span>maxCallDepth={document.executionPolicy.budgets.maxCallDepth}</span>
          <span>parallelism={document.executionPolicy.parallelism}</span>
          <span>recursion={document.executionPolicy.recursion}</span>
        </article>
        <article>
          <h4>{t("scenario.orchestrator.contextPolicy")}</h4>
          <code>{document.contextPolicy.inputNamespace}</code>
          <code>{document.contextPolicy.sharedNamespace}</code>
          <code>{document.contextPolicy.outputNamespace}</code>
          <code>{document.contextPolicy.slotNamespacePattern}.*</code>
          <span>implicitMergeAllowed={String(document.contextPolicy.implicitMergeAllowed)}</span>
          <span>adapterInheritanceAllowed={String(document.contextPolicy.adapterInheritanceAllowed)}</span>
          <span>secretPropagationAllowed={String(document.contextPolicy.secretPropagationAllowed)}</span>
        </article>
        <article>
          <h4>{t("scenario.orchestrator.terminals")}</h4>
          {document.terminals.map((terminal) => (
            <code key={terminal.terminalId}>{terminal.terminalId}</code>
          ))}
          <span>invoke_slot / resume_caller / terminate</span>
          <span>request_handoff / fail_closed</span>
        </article>
        <article>
          <h4>{t("scenario.orchestrator.traceContract")}</h4>
          <strong>{document.tracePolicy.mandatoryEventTypes.length} mandatory event types</strong>
          <code>eventsEmittedInPreview=false</code>
          <span>{t("scenario.orchestrator.noTraceEvidence")}</span>
        </article>
        <article>
          <h4>{t("scenario.orchestrator.provenance")}</h4>
          <span>slots: {document.provenance.slotSources.length}</span>
          <span>routes: {document.provenance.routeSources.length}</span>
          <span>bindings: {document.provenance.bindingSources.length}</span>
          <span>overlays: {document.provenance.overlaySources.length}</span>
          <code>{document.provenance.orchestratorHash}</code>
        </article>
      </div>
    </section>
  );
}
