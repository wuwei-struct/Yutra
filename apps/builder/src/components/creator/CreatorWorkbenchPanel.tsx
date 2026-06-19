import { useMemo, useState, type ReactNode } from "react";
import type { ConfigField, ConfigFieldSource, PackConfig } from "@yutra/pack-config-core";
import {
  getRuleImpact,
  listRuleImpacts,
  type RuleImpactDefinition
} from "../../../../../packages/pack-config-core/src/rule-impact";
import type { RuleCompilerIssue } from "@yutra/rule-compiler";
import type { CreatorCompilePreviewResponse } from "../../types";
import { compileCreatorPreview } from "../../lib/creator-client";
import {
  createRequestResolutionDemoConfig,
  creatorArchetypes,
  creatorArtifactTabs,
  updateConfigField,
  type CreatorArtifactTab
} from "../../lib/creator-state";
import { useI18n, type MessageKey } from "../../i18n";
import { CertificationReadinessPanel } from "./CertificationReadinessPanel";
import { RuleImpactPanel } from "./RuleImpactPanel";

function fieldValue<T>(config: PackConfig, key: string, fallback: T): T {
  return (config.rules[key]?.value as T | undefined) ?? fallback;
}

function issueGroups(issues: RuleCompilerIssue[]) {
  return {
    errors: issues.filter((issue) => issue.severity === "error"),
    warnings: issues.filter((issue) => issue.severity === "warning")
  };
}

function updateRule<T>(config: PackConfig, key: string, value: T): PackConfig {
  return {
    ...config,
    rules: {
      ...config.rules,
      [key]: updateConfigField(config.rules[key], value)
    }
  };
}

function updateCapability(config: PackConfig, key: string, value: boolean): PackConfig {
  return {
    ...config,
    capabilities: {
      ...config.capabilities,
      [key]: updateConfigField(config.capabilities[key], value)
    }
  };
}

const sourceLabelKeys: Record<ConfigFieldSource, MessageKey> = {
  confirmedByUser: "creator.impact.confirmedByUser",
  defaultFromPack: "creator.impact.defaultFromPack",
  inferredByAI: "creator.impact.inferredByAI",
  migrated: "creator.impact.migrated",
  requiredButMissing: "creator.impact.requiredButMissing"
};

function fullRulePath(key: string): string {
  return `rules.${key}`;
}

function getConfigField(config: PackConfig, fieldPath: string): ConfigField | undefined {
  if (fieldPath.startsWith("capabilities.")) {
    return config.capabilities[fieldPath.replace("capabilities.", "")];
  }
  if (fieldPath.startsWith("rules.")) {
    return config.rules[fieldPath.replace("rules.", "")];
  }
  return undefined;
}

function FieldMeta(props: {
  config: PackConfig;
  fieldPath: string;
  onSelectImpact: (fieldPath: string) => void;
}) {
  const { t } = useI18n();
  const impact = getRuleImpact(props.fieldPath);
  const field = getConfigField(props.config, props.fieldPath);

  return (
    <div className="field-meta-row">
      <span className="status-pill">
        {t("creator.impact.source")}: {field?.source ? t(sourceLabelKeys[field.source]) : "-"}
      </span>
      {impact?.artifacts.slice(0, 3).map((artifact) => (
        <span key={artifact} className="status-pill">
          {artifact}
        </span>
      ))}
      {impact && impact.artifacts.length > 3 ? <span className="status-pill">+{impact.artifacts.length - 3}</span> : null}
      <button type="button" className="impact-button" onClick={() => props.onSelectImpact(props.fieldPath)}>
        {t("creator.impact.impact")}
      </button>
    </div>
  );
}

function ImpactCheckbox(props: {
  config: PackConfig;
  fieldPath: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onSelectImpact: (fieldPath: string) => void;
}) {
  return (
    <div className="creator-field-row">
      <label className="checkbox-item">
        <input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.target.checked)} />
        <span>{props.label}</span>
      </label>
      <FieldMeta config={props.config} fieldPath={props.fieldPath} onSelectImpact={props.onSelectImpact} />
    </div>
  );
}

function ImpactField(props: {
  config: PackConfig;
  fieldPath: string;
  label: string;
  children: ReactNode;
  onSelectImpact: (fieldPath: string) => void;
}) {
  return (
    <div className="creator-field-row">
      <label className="field">
        {props.label}
        {props.children}
      </label>
      <FieldMeta config={props.config} fieldPath={props.fieldPath} onSelectImpact={props.onSelectImpact} />
    </div>
  );
}

function ArchetypeSelector() {
  return (
    <section className="creator-section" aria-label="Archetype Selector">
      <h3>Archetype Selector</h3>
      <p className="hint">Only request-resolution is enabled in this compile preview MVP.</p>
      <div className="creator-archetype-list">
        {creatorArchetypes.map((item) => (
          <button key={item.id} type="button" disabled={!item.enabled} className={item.enabled ? "creator-archetype enabled" : "creator-archetype"}>
            <strong>{item.label}</strong>
            <span>{item.enabled ? "enabled" : "coming soon"}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function RequestResolutionConfigEditor(props: {
  config: PackConfig;
  onChange: (config: PackConfig) => void;
  onSelectImpact: (fieldPath: string) => void;
}) {
  const { config, onChange, onSelectImpact } = props;
  const capabilityIds = ["orderLookup", "shippingLookup", "refundRequest", "returnRequest", "handoff"];

  return (
    <section className="creator-section" aria-label="Request Resolution Config Editor">
      <h3>Request Resolution Config</h3>
      <p className="hint">Demo/mock only. Adapter mode is fixed to mock; no endpoint or secret input is exposed.</p>

      <h4>Capabilities</h4>
      <div className="list">
        {capabilityIds.map((id) => (
          <ImpactCheckbox
            key={id}
            config={config}
            fieldPath={`capabilities.${id}`}
            label={id}
            checked={Boolean(config.capabilities[id]?.value)}
            onChange={(checked) => onChange(updateCapability(config, id, checked))}
            onSelectImpact={onSelectImpact}
          />
        ))}
      </div>

      <h4>Refund Policy</h4>
      <ImpactCheckbox
        config={config}
        fieldPath={fullRulePath("refundPolicy.autoRefundWhenNotShipped")}
        label="autoRefundWhenNotShipped"
        checked={fieldValue(config, "refundPolicy.autoRefundWhenNotShipped", false)}
        onChange={(checked) => onChange(updateRule(config, "refundPolicy.autoRefundWhenNotShipped", checked))}
        onSelectImpact={onSelectImpact}
      />
      <ImpactField
        config={config}
        fieldPath={fullRulePath("refundPolicy.autoRefundMaxAmount")}
        label="autoRefundMaxAmount"
        onSelectImpact={onSelectImpact}
      >
        <input
          aria-label="autoRefundMaxAmount"
          type="number"
          value={fieldValue(config, "refundPolicy.autoRefundMaxAmount", 0)}
          onChange={(event) => onChange(updateRule(config, "refundPolicy.autoRefundMaxAmount", Number(event.target.value)))}
        />
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("refundPolicy.shippedOrderStrategy")}
        label="shippedOrderStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "refundPolicy.shippedOrderStrategy", "require_return_first")}
          onChange={(event) => onChange(updateRule(config, "refundPolicy.shippedOrderStrategy", event.target.value))}
        >
          <option value="require_return_first">require_return_first</option>
          <option value="handoff">handoff</option>
          <option value="reject_with_template">reject_with_template</option>
        </select>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("refundPolicy.expiredAfterSaleStrategy")}
        label="expiredAfterSaleStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "refundPolicy.expiredAfterSaleStrategy", "ask_for_more_info")}
          onChange={(event) => onChange(updateRule(config, "refundPolicy.expiredAfterSaleStrategy", event.target.value))}
        >
          <option value="reject_with_template">reject_with_template</option>
          <option value="handoff">handoff</option>
          <option value="ask_for_more_info">ask_for_more_info</option>
        </select>
      </ImpactField>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("refundPolicy.apiFailureStrategy")}
        label="apiFailureStrategy"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "refundPolicy.apiFailureStrategy", "retry_then_handoff")}
          onChange={(event) => onChange(updateRule(config, "refundPolicy.apiFailureStrategy", event.target.value))}
        >
          <option value="retry_then_handoff">retry_then_handoff</option>
          <option value="handoff">handoff</option>
          <option value="fail_closed_error">fail_closed_error</option>
        </select>
      </ImpactField>

      <h4>Handoff Policy</h4>
      {["highValueRefund", "complaint", "orderNotFound", "ruleConflict"].map((name) => (
        <ImpactCheckbox
          key={name}
          config={config}
          fieldPath={fullRulePath(`handoffPolicy.${name}`)}
          label={name}
          checked={fieldValue(config, `handoffPolicy.${name}`, false)}
          onChange={(checked) => onChange(updateRule(config, `handoffPolicy.${name}`, checked))}
          onSelectImpact={onSelectImpact}
        />
      ))}
      <ImpactField
        config={config}
        fieldPath={fullRulePath("handoffPolicy.maxUserRetryCount")}
        label="maxUserRetryCount"
        onSelectImpact={onSelectImpact}
      >
        <input
          type="number"
          value={fieldValue(config, "handoffPolicy.maxUserRetryCount", 0)}
          onChange={(event) => onChange(updateRule(config, "handoffPolicy.maxUserRetryCount", Number(event.target.value)))}
        />
      </ImpactField>

      <h4>Response Style</h4>
      <ImpactField
        config={config}
        fieldPath={fullRulePath("responseStyle.tone")}
        label="tone"
        onSelectImpact={onSelectImpact}
      >
        <select
          value={fieldValue(config, "responseStyle.tone", "warm_professional")}
          onChange={(event) => onChange(updateRule(config, "responseStyle.tone", event.target.value))}
        >
          <option value="neutral">neutral</option>
          <option value="warm_professional">warm_professional</option>
          <option value="concise">concise</option>
        </select>
      </ImpactField>
      {["includeReason", "includeHumanSupportEntry"].map((name) => (
        <ImpactCheckbox
          key={name}
          config={config}
          fieldPath={fullRulePath(`responseStyle.${name}`)}
          label={name}
          checked={fieldValue(config, `responseStyle.${name}`, false)}
          onChange={(checked) => onChange(updateRule(config, `responseStyle.${name}`, checked))}
          onSelectImpact={onSelectImpact}
        />
      ))}

      <div className="creator-adapter-summary" aria-label="Adapter Mode Summary">
        <strong>Adapters: mock only</strong>
        <span>containsRealEndpoint=false / containsSecret=false</span>
      </div>
    </section>
  );
}

function PackConfigPreview(props: { config: PackConfig }) {
  return (
    <section className="creator-section" aria-label="PackConfig Preview">
      <h3>PackConfig Preview</h3>
      <div className="status-row wrap-row">
        <span className="status-pill ok">demo/mock</span>
        <span className="status-pill">environment: {props.config.governance.environment}</span>
        <span className="status-pill">adapters: mock</span>
      </div>
      <pre>{JSON.stringify(props.config, null, 2)}</pre>
    </section>
  );
}

function CompileIssuesPanel(props: { issues: RuleCompilerIssue[] }) {
  const grouped = issueGroups(props.issues);
  return (
    <section className="creator-section" aria-label="Compile Issues">
      <h3>Compile Issues</h3>
      <p className={grouped.errors.length > 0 ? "error-text" : "ok-text"}>
        errors: {grouped.errors.length} / warnings: {grouped.warnings.length}
      </p>
      {[...grouped.errors, ...grouped.warnings].map((issue, index) => (
        <div key={`${issue.code}-${index}`} className={issue.severity === "error" ? "issue issue-error" : "issue issue-warning"}>
          <strong>{issue.code}</strong>
          <p>{issue.message}</p>
          {issue.path ? <small>path: {issue.path.join(".")}</small> : null}
        </div>
      ))}
    </section>
  );
}

function CompileReportPanel(props: { response: CreatorCompilePreviewResponse }) {
  const report = props.response.report;
  const { t } = useI18n();
  const impacts = listRuleImpacts();
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

type SendCompiledDslMeta = {
  compileId?: string;
  compilerVersion?: string;
  configHash?: string;
  artifactHash?: string;
};

function ArtifactPreviewTabs(props: {
  response: CreatorCompilePreviewResponse;
  onSendCompiledDslToEditor?: (dslText: string, meta?: SendCompiledDslMeta) => void;
}) {
  const [active, setActive] = useState<CreatorArtifactTab>("agent");
  if (!props.response.ok || !props.response.artifacts) {
    return null;
  }

  const artifact = props.response.artifacts[active];
  const canSendAgent = active === "agent" && Boolean(artifact.content);
  return (
    <section className="creator-section" aria-label="Artifact Preview">
      <h3>Artifact Preview</h3>
      <div className="tabs wrap-tabs">
        {creatorArtifactTabs.map((tab) => (
          <button key={tab.key} type="button" className={active === tab.key ? "tab active" : "tab"} onClick={() => setActive(tab.key)}>
            {tab.label}
            {tab.note ? ` (${tab.note})` : ""}
          </button>
        ))}
      </div>
      <div className="status-row wrap-row">
        <span className="status-pill">{artifact.contentType}</span>
        <span className="status-pill">{artifact.hash}</span>
        {active === "agent" ? <span className="status-pill warning">not executed</span> : null}
        {active === "agent" ? <span className="status-pill warning">not inspected</span> : null}
        {active === "adapterConfig" ? <span className="status-pill ok">mock only</span> : null}
      </div>
      {canSendAgent ? (
        <div className="manual-flow-helper" aria-label="Compiled DSL Manual Flow">
          <button
            type="button"
            onClick={() =>
              props.onSendCompiledDslToEditor?.(artifact.content, {
                compileId: props.response.compileId,
                compilerVersion: props.response.compilerVersion,
                configHash: props.response.report?.packConfigHash,
                artifactHash: artifact.hash
              })
            }
          >
            Send agent.yutra.yaml to DSL Editor
          </button>
          <p className="hint">
            Sends the compiled agent artifact to the DSL editor. It does not inspect, apply, or run automatically.
          </p>
          <ol>
            <li>Send to DSL Editor</li>
            <li>Inspect DSL</li>
            <li>Apply DSL as Run Source</li>
            <li>Run Preview manually</li>
          </ol>
        </div>
      ) : null}
      <pre aria-label="Compiled Artifact Content">{artifact.content}</pre>
    </section>
  );
}

export function CreatorWorkbenchPanel(props: {
  onSendCompiledDslToEditor?: (dslText: string, meta?: SendCompiledDslMeta) => void;
}) {
  const [config, setConfig] = useState<PackConfig>(() => createRequestResolutionDemoConfig());
  const [selectedImpact, setSelectedImpact] = useState<RuleImpactDefinition | undefined>(() =>
    getRuleImpact("rules.refundPolicy.autoRefundMaxAmount")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<CreatorCompilePreviewResponse | undefined>(undefined);

  const canCompile = useMemo(() => config.archetypeId === "request-resolution", [config.archetypeId]);

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
      <div className="panel-title">
        <h2>Creator Workbench</h2>
        <span>Compile Preview only / does not run Runtime</span>
      </div>
      <p className="hint">Configure public demo business rules, compile in memory, and inspect generated artifacts. No save, no publish, no disk write.</p>

      <ArchetypeSelector />
      <RequestResolutionConfigEditor
        config={config}
        onChange={setConfig}
        onSelectImpact={(fieldPath) => setSelectedImpact(getRuleImpact(fieldPath))}
      />
      <RuleImpactPanel impact={selectedImpact} />
      <PackConfigPreview config={config} />

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
          <CompileReportPanel response={response} />
          <CertificationReadinessPanel readiness={response.certificationReadiness} />
          <ArtifactPreviewTabs response={response} onSendCompiledDslToEditor={props.onSendCompiledDslToEditor} />
        </>
      ) : null}
    </section>
  );
}
