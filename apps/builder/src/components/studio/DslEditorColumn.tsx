import type { StudioStateController } from "../../lib/studio-state";
import { useI18n } from "../../i18n";

interface DslEditorColumnProps {
  studio: StudioStateController;
  onCopySpec: () => void;
  onCopyDsl: () => void;
}

function FlowPreview(props: { spec: unknown }) {
  const { t } = useI18n();
  const states =
    props.spec && typeof props.spec === "object" && "states" in props.spec
      ? Object.keys((props.spec as { states?: Record<string, unknown> }).states ?? {})
      : [];

  return (
    <div className="flow-preview" aria-label="Visual Flow Preview">
      {states.length === 0 ? <p className="hint">{t("dsl.noStates")}</p> : null}
      {states.map((stateName, index) => (
        <div key={stateName} className="flow-node">
          <span>{index + 1}</span>
          <strong>{stateName}</strong>
          {index < states.length - 1 ? <em>{t("dsl.toNext")}</em> : <em>{t("dsl.terminal")}</em>}
        </div>
      ))}
    </div>
  );
}

export function DslEditorColumn(props: DslEditorColumnProps) {
  const { studio, onCopyDsl, onCopySpec } = props;
  const { t } = useI18n();
  const active = studio.tabs.dsl;
  const flowSpec = studio.sourceMode === "dsl" && studio.dslInspectResult?.ok ? studio.dslInspectResult.canonical : studio.preview.spec;

  return (
    <section className="studio-column dsl-column" aria-label="DSL Editor Column">
      <div className="panel-title">
        <h2>{t("dsl.title")}</h2>
        <span>{studio.sourceMode === "dsl" ? t("dsl.dslSourceActive") : t("dsl.builderSourceActive")}</span>
      </div>
      <div className="tabs">
        <button type="button" className={active === "dsl" ? "tab active" : "tab"} onClick={() => studio.setTabs((prev) => ({ ...prev, dsl: "dsl" }))}>
          {t("dsl.editor")}
        </button>
        <button type="button" className={active === "json" ? "tab active" : "tab"} onClick={() => studio.setTabs((prev) => ({ ...prev, dsl: "json" }))}>
          {t("dsl.agentSpecJson")}
        </button>
        <button type="button" className={active === "flow" ? "tab active" : "tab"} onClick={() => studio.setTabs((prev) => ({ ...prev, dsl: "flow" }))}>
          {t("dsl.visualFlowBeta")}
        </button>
      </div>

      {active === "dsl" ? (
        <div className="tab-panel dsl-editor-panel">
          <p className="hint">{t("dsl.editHint")}</p>
          <div className="status-row">
            <span className={studio.dslDirty ? "status-pill warning" : "status-pill"}>{studio.dslDirty ? t("dsl.dirty") : t("dsl.synced")}</span>
            <span className={studio.dslInspectResult?.validation.ok ? "status-pill ok" : "status-pill"}>
              {studio.dslInspectResult ? (studio.dslInspectResult.validation.ok ? t("dsl.inspectOk") : t("dsl.inspectFailed")) : t("dsl.notInspected")}
            </span>
            <span className={studio.dslApplied ? "status-pill ok" : "status-pill"}>{studio.dslApplied ? t("dsl.applied") : t("dsl.notApplied")}</span>
          </div>
          {studio.builderChangedWhileDslActive ? (
            <p className="warning-text">{t("dsl.builderChanged")}</p>
          ) : null}
          {studio.compiledDslMeta ? (
            <section className="compiled-dsl-meta" aria-label="Compiled DSL Metadata">
              <h3>Compiled DSL draft</h3>
              <dl>
                <dt>compileId</dt>
                <dd>{studio.compiledDslMeta.compileId ?? "-"}</dd>
                <dt>compilerVersion</dt>
                <dd>{studio.compiledDslMeta.compilerVersion ?? "-"}</dd>
                <dt>configHash</dt>
                <dd>{studio.compiledDslMeta.configHash ?? "-"}</dd>
                <dt>artifactHash</dt>
                <dd>{studio.compiledDslMeta.artifactHash ?? "-"}</dd>
                {studio.compiledDslMeta.sourceKind === "scenario_slot" ? (
                  <>
                    <dt>compositionId</dt>
                    <dd>{studio.compiledDslMeta.compositionId ?? "-"}</dd>
                    <dt>slotId</dt>
                    <dd>{studio.compiledDslMeta.slotId ?? "-"}</dd>
                    <dt>archetypeId</dt>
                    <dd>{studio.compiledDslMeta.archetypeId ?? "-"}</dd>
                  </>
                ) : null}
                <dt>Status</dt>
                <dd>{studio.compiledDslMeta.inspected ? "inspected" : "Not inspected yet"}</dd>
              </dl>
              {studio.compiledDslMeta.singleSlotOnly ? (
                <p className="warning-text">{t("scenario.slotDslEditorBoundary")}</p>
              ) : null}
              {!studio.compiledDslMeta.inspected ? (
                <p className="warning-text">Compiled DSL is not trusted until inspected.</p>
              ) : null}
            </section>
          ) : null}
          {!studio.dslInspectResult ? <p className="hint">{t("dsl.notValidated")}</p> : null}
          <textarea
            aria-label="DSL Editor Text"
            className="code-textarea"
            value={studio.dslBuffer}
            onChange={(event) => studio.setDslBuffer(event.target.value)}
            rows={28}
          />
          <div className="button-row wrap-row">
            <button type="button" onClick={() => void studio.inspectCurrentDsl()} disabled={studio.dslInspectLoading}>
              {t("dsl.validate")}
            </button>
            <button type="button" onClick={() => void studio.inspectCurrentDsl()} disabled={studio.dslInspectLoading}>
              {t("dsl.inspect")}
            </button>
            <button
              type="button"
              onClick={() => void studio.applyDslAsRunSource()}
              disabled={!studio.dslInspectResult?.ok || !studio.dslInspectResult.validation.ok}
            >
              {t("dsl.apply")}
            </button>
            <button type="button" onClick={studio.resetDslFromBuilder}>
              {t("dsl.reset")}
            </button>
            <button type="button" onClick={onCopyDsl}>
              {t("dsl.copy")}
            </button>
          </div>
          {studio.dslInspectResult?.error ? <p className="error-text">{studio.dslInspectResult.error.message}</p> : null}
        </div>
      ) : null}

      {active === "json" ? (
        <div className="tab-panel">
          <button type="button" onClick={onCopySpec}>
            {t("dsl.copySpec")}
          </button>
          <pre aria-label="AgentSpec JSON">{studio.specJson}</pre>
        </div>
      ) : null}

      {active === "flow" ? <FlowPreview spec={flowSpec} /> : null}
      {studio.copyMessage ? <p className="hint">{studio.copyMessage}</p> : null}
    </section>
  );
}
