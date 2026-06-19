import { useMemo, useState } from "react";
import type { PackConfig } from "@yutra/pack-config-core";
import type { RuleImpactDefinition } from "../../../../../packages/pack-config-core/src/rule-impact";
import type { CreatorCompilePreviewResponse, RunPreviewEvidence } from "../../types";
import { compileCreatorPreview } from "../../lib/creator-client";
import {
  createRequestResolutionDemoConfig,
  getDefaultImpactPathForArchetype,
  getDefaultPackConfigForArchetype,
  type SupportedCreatorArchetype
} from "../../lib/creator-state";
import { useI18n } from "../../i18n";
import { CertificationReadinessPanel } from "./CertificationReadinessPanel";
import { CompileArtifactsPanel } from "./CompileArtifactsPanel";
import { CompileIssuesPanel } from "./CompileIssuesPanel";
import { CompileReportSummary } from "./CompileReportSummary";
import { CreatorArchetypeSelector } from "./CreatorArchetypeSelector";
import { CreatorBoundaryNotice } from "./CreatorBoundaryNotice";
import { CreatorConfigSection } from "./CreatorConfigSection";
import { CreatorWorkflowStepper } from "./CreatorWorkflowStepper";
import { CreatorWorkbenchHeader } from "./CreatorWorkbenchHeader";
import { PackConfigPreviewPanel } from "./PackConfigPreviewPanel";
import { RuleImpactPanel } from "./RuleImpactPanel";
import { getRuleImpactForArchetype, isSupportedCreatorArchetype, type SendCompiledDslMeta } from "./creator-ui-helpers";

export function CreatorWorkbenchPanel(props: {
  onSendCompiledDslToEditor?: (dslText: string, meta?: SendCompiledDslMeta) => void;
  runPreviewEvidence?: RunPreviewEvidence;
}) {
  const { t } = useI18n();
  const [config, setConfig] = useState<PackConfig>(() => createRequestResolutionDemoConfig());
  const [selectedImpact, setSelectedImpact] = useState<RuleImpactDefinition | undefined>(() =>
    getRuleImpactForArchetype("request-resolution", "rules.refundPolicy.autoRefundMaxAmount")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<CreatorCompilePreviewResponse | undefined>(undefined);

  const canCompile = useMemo(() => isSupportedCreatorArchetype(config.archetypeId), [config.archetypeId]);
  const hasCompiled = Boolean(response?.ok && response.artifacts);
  const hasRunEvidence = props.runPreviewEvidence?.status === "ready";

  const setCreatorArchetype = (archetypeId: SupportedCreatorArchetype) => {
    const nextConfig = getDefaultPackConfigForArchetype(archetypeId);
    setConfig(nextConfig);
    setSelectedImpact(getRuleImpactForArchetype(archetypeId, getDefaultImpactPathForArchetype(archetypeId)));
    setResponse(undefined);
    setError("");
    setLoading(false);
  };

  const onCompile = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await compileCreatorPreview({ config, mode: "preview", locale: config.locale ?? "en" });
      if (!result.ok) {
        setError(result.error?.message ?? "Compile preview failed.");
        setResponse(result);
        return;
      }
      setResponse(result);
    } catch (compileError) {
      setError(compileError instanceof Error ? compileError.message : "Compile preview failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="creator-workbench-panel" aria-label="Creator Workbench">
      <CreatorWorkbenchHeader archetypeId={config.archetypeId} />
      <CreatorBoundaryNotice />
      <CreatorWorkflowStepper compiled={hasCompiled} hasRunEvidence={hasRunEvidence} />

      <div className="creator-workbench-layout">
        <section className="creator-stage-card" aria-label="Business Rules">
          <div className="creator-stage-header">
            <h3>{t("creator.section.businessRules")}</h3>
            <span className="status-pill">{config.archetypeId}</span>
          </div>
          <CreatorArchetypeSelector currentArchetypeId={config.archetypeId} onSelectArchetype={setCreatorArchetype} />
          <CreatorConfigSection
            config={config}
            onChange={setConfig}
            onSelectImpact={(fieldPath) => setSelectedImpact(getRuleImpactForArchetype(config.archetypeId, fieldPath))}
          />
          <PackConfigPreviewPanel config={config} />
        </section>

        <section className="creator-stage-card" aria-label="Rule Explanation">
          <div className="creator-stage-header">
            <h3>{t("creator.section.ruleExplanation")}</h3>
            <span className="status-pill">{t("creator.impact.title")}</span>
          </div>
          <RuleImpactPanel impact={selectedImpact} />
        </section>

        <section className="creator-stage-card" aria-label="Compile Preview Panel">
          <div className="creator-stage-header">
            <h3>{t("creator.section.compilePreview")}</h3>
            <span className="status-pill warning">Runtime not invoked</span>
          </div>
          <div className="button-row wrap-row">
            <button type="button" onClick={() => void onCompile()} disabled={!canCompile || loading}>
              {loading ? "Compiling..." : "Compile Preview"}
            </button>
            <span className="status-pill warning">Runtime not invoked</span>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {response ? (
            <>
              <CompileIssuesPanel issues={response.issues} />
              <CompileReportSummary response={response} archetypeId={config.archetypeId} />
              <CompileArtifactsPanel response={response} onSendCompiledDslToEditor={props.onSendCompiledDslToEditor} />
            </>
          ) : null}
        </section>

        <section className="creator-stage-card" aria-label="Readiness & Evidence">
          <div className="creator-stage-header">
            <h3>{t("creator.section.readinessEvidence")}</h3>
            <span className="status-pill warning">{t("creator.boundary.notProductionReady")}</span>
          </div>
          <CertificationReadinessPanel readiness={response?.certificationReadiness} runPreviewEvidence={props.runPreviewEvidence} />
        </section>
      </div>
    </section>
  );
}
