import { useI18n } from "../../i18n";
import type { ScenarioOrchestratorCompileResult } from "../../types";

export function ScenarioOrchestratorProfilePanel(props: {
  profileId?: string;
  result: ScenarioOrchestratorCompileResult;
  selectedSection: string;
  onSelectSection: (section: string) => void;
}) {
  const { t } = useI18n();
  const sections = ["slots", "routes", "terminals"] as const;
  const document = props.result.orchestratorDocument;
  return (
    <section className="scenario-panel" aria-label="Orchestrator Compile Profile">
      <div className="scenario-section-heading">
        <div>
          <p className="eyebrow">{t("scenario.orchestrator.explicitRoutes")}</p>
          <h3>{t("scenario.orchestrator.compileProfile")}</h3>
        </div>
        <code>{props.profileId ?? "-"}</code>
      </div>
      <p className="hint">{t("scenario.orchestrator.profileBoundary")}</p>
      <div className="tabs">
        {sections.map((section) => (
          <button
            type="button"
            key={section}
            className={props.selectedSection === section ? "tab active" : "tab"}
            onClick={() => props.onSelectSection(section)}
          >
            {section}
          </button>
        ))}
      </div>
      {props.selectedSection === "slots" ? (
        <div className="scenario-profile-grid">
          {document.slots.map((slot) => (
            <article key={slot.slotId}>
              <strong>{slot.slotId}</strong>
              <code>{slot.role}</code>
              <span>acceptedOutcomes: {slot.acceptedOutcomes.join(", ")}</span>
              <span>callableBySlotIds: {slot.callableBySlotIds.join(", ") || "-"}</span>
            </article>
          ))}
        </div>
      ) : null}
      {props.selectedSection === "routes" ? (
        <div className="scenario-table-wrap">
          <table>
            <thead><tr><th>routeId</th><th>outcome</th><th>{t("scenario.orchestrator.routePriority")}</th><th>effect</th><th>terminal</th></tr></thead>
            <tbody>
              {document.routes.map((route) => (
                <tr key={route.routeId}>
                  <td>{route.routeId}</td><td>{route.outcome}</td><td>{route.priority}</td>
                  <td>{route.effect.type}</td><td>{route.effect.terminalId ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {props.selectedSection === "terminals" ? (
        <div className="scenario-terminal-grid">
          {document.terminals.map((terminal) => (
            <article key={terminal.terminalId}>
              <strong>{terminal.terminalId}</strong>
              <span>{terminal.status}</span>
              <code>requiresAudit={String(terminal.requiresAudit)}</code>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
