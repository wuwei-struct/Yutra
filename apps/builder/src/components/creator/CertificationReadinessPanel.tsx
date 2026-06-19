import type { CertificationReadinessGate, CertificationReadinessPreview, ReadinessLevel } from "../../types";
import { useI18n } from "../../i18n";

const artifactLabels: Array<[keyof CertificationReadinessPreview["artifactStatus"], string]> = [
  ["agent", "agent.yutra.yaml"],
  ["policy", "policy.yaml"],
  ["adapterConfig", "adapter.config.json"],
  ["templates", "templates.json"],
  ["testCases", "test-cases.json"],
  ["traceExpectation", "trace.expectation.json"]
];

function readinessClass(level: ReadinessLevel): string {
  if (level === "ready") {
    return "ok";
  }
  if (level === "warning") {
    return "warning";
  }
  return "blocked";
}

function levelText(level: ReadinessLevel, t: (key: "creator.readiness.ready" | "creator.readiness.warning" | "creator.readiness.blocked") => string): string {
  if (level === "ready") {
    return t("creator.readiness.ready");
  }
  if (level === "warning") {
    return t("creator.readiness.warning");
  }
  return t("creator.readiness.blocked");
}

function GateCard(props: { gate: CertificationReadinessGate; localeKey: "en" | "zhCN" }) {
  const { t } = useI18n();
  const gate = props.gate;
  return (
    <div className={`readiness-gate ${readinessClass(gate.level)}`}>
      <div className="readiness-gate-header">
        <strong>{gate.label[props.localeKey]}</strong>
        <span className={`status-pill ${readinessClass(gate.level)}`}>{levelText(gate.level, t)}</span>
      </div>
      <p>{gate.message[props.localeKey]}</p>
      {gate.nextAction?.[props.localeKey] ? <small>{gate.nextAction[props.localeKey]}</small> : null}
    </div>
  );
}

export function CertificationReadinessPanel(props: { readiness?: CertificationReadinessPreview }) {
  const { locale, t } = useI18n();
  const readiness = props.readiness;
  const localeKey = locale === "zh-CN" ? "zhCN" : "en";

  return (
    <section className="creator-section certification-readiness-panel" aria-label="Certification Readiness Panel">
      <h3>{t("creator.readiness.title")}</h3>
      {!readiness ? <p className="hint">{t("creator.readiness.noPreview")}</p> : null}
      {readiness ? (
        <>
          <div className="readiness-overall">
            <span className={`readiness-badge ${readinessClass(readiness.overall)}`}>{levelText(readiness.overall, t)}</span>
            <div>
              <strong>{t("creator.readiness.overall")}</strong>
              <p>{readiness.summary[localeKey]}</p>
              <span className="status-pill">{readiness.environment}</span>
            </div>
          </div>

          <h4>{t("creator.readiness.gates")}</h4>
          <div className="readiness-gate-grid">
            {readiness.gates.map((gate) => (
              <GateCard key={gate.gateId} gate={gate} localeKey={localeKey} />
            ))}
          </div>

          <h4>{t("creator.readiness.artifactStatus")}</h4>
          <div className="artifact-chip-row">
            {artifactLabels.map(([key, label]) => (
              <span key={key} className={readiness.artifactStatus[key] ? "status-pill ok" : "status-pill blocked"}>
                {label}: {readiness.artifactStatus[key] ? t("creator.readiness.ready") : t("creator.readiness.blocked")}
              </span>
            ))}
          </div>

          <h4>{t("creator.readiness.counts")}</h4>
          <div className="impact-summary-grid">
            <div>
              <strong>{readiness.counts.testCases}</strong>
              <span>{t("creator.readiness.testCases")}</span>
            </div>
            <div>
              <strong>{readiness.counts.traceExpectations}</strong>
              <span>{t("creator.readiness.traceExpectations")}</span>
            </div>
            <div>
              <strong>{readiness.counts.ruleImpacts ?? 0}</strong>
              <span>{t("creator.readiness.ruleImpacts")}</span>
            </div>
            <div>
              <strong>{readiness.counts.errors}</strong>
              <span>{t("creator.readiness.errors")}</span>
            </div>
            <div>
              <strong>{readiness.counts.warnings}</strong>
              <span>{t("creator.readiness.warnings")}</span>
            </div>
          </div>

          <div className="readiness-boundary" aria-label="Certification Readiness Boundary">
            <strong>{t("creator.readiness.boundary")}</strong>
            <ul>
              <li>{t("creator.readiness.notOfficial")}</li>
              <li>{t("creator.readiness.runtimeNotExecuted")}</li>
              <li>{t("creator.readiness.testsNotExecuted")}</li>
              <li>{t("creator.readiness.noProductionReady")}</li>
            </ul>
          </div>
        </>
      ) : null}
    </section>
  );
}
