import { TraceEventDetail } from "../TraceEventDetail";
import { TraceTimeline } from "../TraceTimeline";
import { prettyJson } from "../../lib/formatters";
import type { StudioStateController } from "../../lib/studio-state";
import { useI18n } from "../../i18n";

interface RunTracePanelProps {
  studio: StudioStateController;
}

export function RunTracePanel(props: RunTracePanelProps) {
  const { studio } = props;
  const { t } = useI18n();
  const active = studio.tabs.trace;

  return (
    <section className="studio-bottom-column trace-workbench" aria-label="Run Trace Panel">
      <div className="panel-title">
        <h2>{t("trace.title")}</h2>
        <span>{studio.runResponse?.ok ? studio.runResponse.run?.status ?? t("trace.ready") : t("trace.noRun")}</span>
      </div>
      <div className="tabs wrap-tabs">
        {(["timeline", "state", "event", "context", "logs"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={active === tab ? "tab active" : "tab"}
            onClick={() => studio.setTabs((prev) => ({ ...prev, trace: tab }))}
          >
            {tab === "timeline"
              ? t("trace.timeline")
              : tab === "state"
                ? t("trace.stateView")
                : tab === "event"
                  ? t("trace.eventDetail")
                  : tab === "context"
                    ? t("trace.contextDelta")
                    : t("trace.logs")}
          </button>
        ))}
      </div>
      {active === "timeline" ? (
        <TraceTimeline response={studio.runResponse} selectedIndex={studio.selectedEventIndex} onSelect={studio.setSelectedEventIndex} />
      ) : null}
      {active === "state" ? (
        <section className="panel-section" aria-label="State Trace View">
          <h3>{t("trace.stateView")}</h3>
          <pre>{prettyJson(studio.runResponse?.timeline?.filter((item) => item.state) ?? [])}</pre>
        </section>
      ) : null}
      {active === "event" ? <TraceEventDetail event={studio.selectedEvent as Record<string, unknown> | undefined} /> : null}
      {active === "context" ? (
        <section className="panel-section" aria-label="Context Delta View">
          <h3>{t("trace.contextDelta")}</h3>
          <pre>{prettyJson((studio.selectedEvent as { payload?: unknown } | undefined)?.payload ?? { message: t("trace.selectEvent") })}</pre>
        </section>
      ) : null}
      {active === "logs" ? (
        <section className="panel-section" aria-label="Run Logs">
          <h3>{t("trace.logs")}</h3>
          <p className="hint">{t("trace.logsHint")}</p>
        </section>
      ) : null}
    </section>
  );
}
