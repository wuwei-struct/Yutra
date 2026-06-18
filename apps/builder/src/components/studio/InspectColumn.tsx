import { ValidationPanel } from "../ValidationPanel";
import { prettyJson } from "../../lib/formatters";
import type { StudioStateController } from "../../lib/studio-state";
import { useI18n } from "../../i18n";

interface InspectColumnProps {
  studio: StudioStateController;
}

function countTransitions(spec: unknown): number {
  if (!spec || typeof spec !== "object" || !("states" in spec)) {
    return 0;
  }
  return Object.values((spec as { states?: Record<string, { transitions?: unknown[] }> }).states ?? {}).reduce(
    (count, state) => count + (state.transitions?.length ?? 0),
    0
  );
}

function countHandoff(spec: unknown): number {
  if (!spec || typeof spec !== "object" || !("states" in spec)) {
    return 0;
  }
  return Object.values((spec as { states?: Record<string, { handoff?: boolean }> }).states ?? {}).filter((state) => state.handoff).length;
}

function Overview(props: { studio: StudioStateController; spec: unknown }) {
  const { t } = useI18n();
  const spec = props.spec as
    | { states?: Record<string, unknown>; actions?: unknown[]; intents?: unknown[] }
    | undefined;
  const skillActions = props.studio.dslInspectResult?.ok ? props.studio.dslInspectResult.summary?.skillActions ?? 0 : props.studio.formState.selectedSkillNames.length;

  return (
    <section aria-label="Structure Overview" className="overview-grid">
      <div>
        <strong>{Object.keys(spec?.states ?? {}).length}</strong>
        <span>{t("inspect.states")}</span>
      </div>
      <div>
        <strong>{spec?.actions?.length ?? 0}</strong>
        <span>{t("inspect.actions")}</span>
      </div>
      <div>
        <strong>{spec?.intents?.length ?? 0}</strong>
        <span>{t("inspect.intents")}</span>
      </div>
      <div>
        <strong>{countTransitions(spec)}</strong>
        <span>{t("inspect.transitions")}</span>
      </div>
      <div>
        <strong>{countHandoff(spec)}</strong>
        <span>{t("inspect.handoffStates")}</span>
      </div>
      <div>
        <strong>{skillActions}</strong>
        <span>{t("inspect.skillActions")}</span>
      </div>
    </section>
  );
}

export function InspectColumn(props: InspectColumnProps) {
  const { studio } = props;
  const { t } = useI18n();
  const active = studio.tabs.inspect;
  const usingDsl = studio.sourceMode === "dsl" || Boolean(studio.dslInspectResult);
  const dslResult = studio.dslInspectResult;
  const activeSpec = usingDsl && dslResult?.ok ? dslResult.canonical : studio.preview.spec;
  const validationIssues = usingDsl ? dslResult?.validation.issues ?? [] : studio.issueList;
  const validationOk = usingDsl ? dslResult?.validation.ok ?? false : studio.validationOk;
  const uiWarnings = usingDsl
    ? dslResult
      ? dslResult.warnings?.map((warning) => warning.message) ?? []
      : ["DSL source has not been inspected."]
    : studio.preview.uiWarnings;

  return (
    <section className="studio-column inspect-column" aria-label="Inspect Column">
      <div className="panel-title">
        <h2>{t("inspect.title")}</h2>
        <span>
          {usingDsl ? t("inspect.dslSource") : t("inspect.builderSource")} / {validationOk ? t("inspect.validationPassed") : t("inspect.needsReview")}
        </span>
      </div>
      <div className="tabs wrap-tabs">
        {(["validation", "normalized", "canonical", "overview", "flow"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={active === tab ? "tab active" : "tab"}
            onClick={() => studio.setTabs((prev) => ({ ...prev, inspect: tab }))}
          >
            {tab === "validation"
              ? t("inspect.validation")
              : tab === "normalized"
                ? t("inspect.normalized")
                : tab === "canonical"
                  ? t("inspect.canonical")
                  : tab === "overview"
                    ? t("inspect.overview")
                    : t("inspect.flow")}
          </button>
        ))}
      </div>

      {active === "validation" ? (
        <ValidationPanel ok={validationOk} issues={validationIssues} uiWarnings={uiWarnings} />
      ) : null}

      {active === "normalized" ? (
        <section className="panel-section" aria-label="Normalized Builder Config">
          <h3>{usingDsl ? t("inspect.normalizedDsl") : t("inspect.builderSummary")}</h3>
          <p className="hint">{usingDsl ? t("inspect.normalizedHint") : t("inspect.builderHint")}</p>
          <pre>{prettyJson(usingDsl ? dslResult?.normalized ?? { message: t("inspect.inspectFirst") } : studio.preview.formConfig)}</pre>
        </section>
      ) : null}

      {active === "canonical" ? (
        <section className="panel-section" aria-label="Canonical IR">
          <h3>{t("inspect.canonicalSpec")}</h3>
          <pre>{prettyJson(usingDsl ? dslResult?.canonical ?? { message: t("inspect.inspectFirst") } : studio.preview.spec ?? {})}</pre>
          {usingDsl && dslResult?.explain ? (
            <>
              <h3>{t("inspect.explain")}</h3>
              <pre>{dslResult.explain}</pre>
            </>
          ) : null}
        </section>
      ) : null}

      {active === "overview" ? <Overview studio={studio} spec={activeSpec} /> : null}

      {active === "flow" ? (
        <section className="panel-section" aria-label="Flow Path Preview">
          <h3>{t("inspect.statePath")}</h3>
          <p>{Object.keys(((activeSpec as { states?: Record<string, unknown> })?.states ?? {})).join(" -> ") || "-"}</p>
        </section>
      ) : null}
    </section>
  );
}
