import type { CertificationReadinessGate, CertificationReadinessPreview, ReadinessLevel, RunPreviewEvidence } from "../../types";
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

function evidenceStatusText(evidence: RunPreviewEvidence | undefined, t: (key: "creator.readiness.notRun" | "creator.readiness.evidenceCaptured" | "creator.readiness.runFailed" | "creator.readiness.evidenceStale") => string): string {
  if (!evidence || evidence.status === "none") {
    return t("creator.readiness.notRun");
  }
  if (evidence.status === "ready") {
    return t("creator.readiness.evidenceCaptured");
  }
  if (evidence.status === "stale") {
    return t("creator.readiness.evidenceStale");
  }
  return t("creator.readiness.runFailed");
}

function displayedManualRuntimeGate(gate: CertificationReadinessGate, evidence?: RunPreviewEvidence): CertificationReadinessGate {
  if (gate.gateId !== "manual_runtime_run" || !evidence || evidence.status === "none") {
    return gate;
  }

  if (evidence.status === "ready") {
    return {
      ...gate,
      level: "ready",
      message: {
        en: "Manual Run Preview evidence was captured for the inspected DSL source.",
        zhCN: "已为检查通过的 DSL 源捕获手动运行预览证据。"
      },
      evidence: {
        runId: evidence.runId,
        runStatus: evidence.runStatus,
        sourceMode: evidence.sourceMode,
        eventCount: evidence.eventCount,
        hasTraceEvents: evidence.hasTraceEvents,
        hasAuditBundle: evidence.hasAuditBundle,
        configHash: evidence.compiledDsl?.configHash
      }
    };
  }

  if (evidence.status === "failed") {
    return {
      ...gate,
      level: "blocked",
      message: {
        en: "Manual Run Preview failed or did not produce usable compiled DSL evidence.",
        zhCN: "手动运行预览失败，或未产生可用的编译 DSL 证据。"
      },
      evidence: { reason: evidence.reason, runStatus: evidence.runStatus, sourceMode: evidence.sourceMode }
    };
  }

  return {
    ...gate,
    level: "warning",
    message: {
      en: "Manual Run Preview evidence is stale because the DSL changed after capture.",
      zhCN: "DSL 在证据捕获后发生变化，手动运行预览证据已过期。"
    },
    evidence: { reason: evidence.reason, runId: evidence.runId, sourceMode: evidence.sourceMode }
  };
}

function displayedOverall(gates: CertificationReadinessGate[]): ReadinessLevel {
  if (gates.some((gate) => gate.level === "blocked")) {
    return "blocked";
  }
  if (gates.some((gate) => gate.level === "warning")) {
    return "warning";
  }
  return "ready";
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

export function CertificationReadinessPanel(props: { readiness?: CertificationReadinessPreview; runPreviewEvidence?: RunPreviewEvidence }) {
  const { locale, t } = useI18n();
  const readiness = props.readiness;
  const localeKey = locale === "zh-CN" ? "zhCN" : "en";
  const displayedGates = readiness?.gates.map((gate) => displayedManualRuntimeGate(gate, props.runPreviewEvidence)) ?? [];
  const overall = readiness ? displayedOverall(displayedGates) : undefined;

  return (
    <section className="creator-section certification-readiness-panel" aria-label="Certification Readiness Panel">
      <h3>{t("creator.readiness.title")}</h3>
      {!readiness ? <p className="hint">{t("creator.readiness.noPreview")}</p> : null}
      {readiness ? (
        <>
          <div className="readiness-overall">
            <span className={`readiness-badge ${readinessClass(overall ?? readiness.overall)}`}>
              {levelText(overall ?? readiness.overall, t)}
            </span>
            <div>
              <strong>{t("creator.readiness.overall")}</strong>
              <p>{readiness.summary[localeKey]}</p>
              <span className="status-pill">{readiness.environment}</span>
            </div>
          </div>

          <h4>{t("creator.readiness.gates")}</h4>
          <div className="readiness-gate-grid">
            {displayedGates.map((gate) => (
              <GateCard key={gate.gateId} gate={gate} localeKey={localeKey} />
            ))}
          </div>

          <h4>{t("creator.readiness.manualEvidence")}</h4>
          <div className="manual-run-evidence" aria-label="Manual Run Preview Evidence">
            <dl>
              <dt>{t("creator.readiness.evidenceStatus")}</dt>
              <dd>{evidenceStatusText(props.runPreviewEvidence, t)}</dd>
              <dt>runId</dt>
              <dd>{props.runPreviewEvidence?.runId ?? "-"}</dd>
              <dt>runStatus</dt>
              <dd>{props.runPreviewEvidence?.runStatus ?? "-"}</dd>
              <dt>sourceMode</dt>
              <dd>{props.runPreviewEvidence?.sourceMode ?? "-"}</dd>
              <dt>{t("creator.readiness.eventCount")}</dt>
              <dd>{props.runPreviewEvidence?.eventCount ?? 0}</dd>
              <dt>{t("creator.readiness.traceEventsPresent")}</dt>
              <dd>{props.runPreviewEvidence?.hasTraceEvents ? "true" : "false"}</dd>
              <dt>{t("creator.readiness.auditBundlePresent")}</dt>
              <dd>{props.runPreviewEvidence?.hasAuditBundle ? "true" : "false"}</dd>
              <dt>compileId</dt>
              <dd>{props.runPreviewEvidence?.compiledDsl?.compileId ?? "-"}</dd>
              <dt>compilerVersion</dt>
              <dd>{props.runPreviewEvidence?.compiledDsl?.compilerVersion ?? "-"}</dd>
              <dt>configHash</dt>
              <dd>{props.runPreviewEvidence?.compiledDsl?.configHash ?? "-"}</dd>
              <dt>artifactHash</dt>
              <dd>{props.runPreviewEvidence?.compiledDsl?.artifactHash ?? "-"}</dd>
              <dt>capturedAt</dt>
              <dd>{props.runPreviewEvidence?.capturedAt ?? "-"}</dd>
            </dl>
            {props.runPreviewEvidence?.reason ? <p className="warning-text">{props.runPreviewEvidence.reason}</p> : null}
            <p className="hint">{t("creator.readiness.manualEvidenceBoundary")}</p>
            <p className="hint">{t("creator.readiness.officialStillNotRun")}</p>
            <p className="hint">{t("creator.readiness.productionStillNotClaimed")}</p>
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
