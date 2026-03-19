import { useEffect, useMemo, useState } from "react";
import { EventDetail } from "./components/event-detail";
import { RunList } from "./components/run-list";
import { TraceTimeline } from "./components/trace-timeline";
import { useI18n, type SupportedLocale } from "./i18n";
import { buildRunSummaries, groupEventsByRunId } from "./lib/trace-grouping";
import { loadTraceFromFile, loadTraceFromSample } from "./lib/trace-loader";
import type { TraceEvent } from "./types";
import "./styles.css";

const SAMPLE_OPTIONS = [
  { label: "Examples Matrix (completed + handoff)", path: "/samples/examples-matrix.jsonl" }
];

export interface AppProps {
  initialEvents?: TraceEvent[];
}

export default function App(props: AppProps = {}) {
  const { locale, setLocale, t } = useI18n();
  const [events, setEvents] = useState<TraceEvent[]>(props.initialEvents ?? []);
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(undefined);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [errorCode, setErrorCode] = useState<string | undefined>();

  const grouped = useMemo(() => groupEventsByRunId(events), [events]);
  const runs = useMemo(() => buildRunSummaries(grouped), [grouped]);
  const selectedRunEvents = selectedRunId ? grouped[selectedRunId] ?? [] : [];
  const selectedEvent = selectedRunEvents.find((event) => event.id === selectedEventId);

  useEffect(() => {
    if (runs.length === 0 || selectedRunId) {
      return;
    }

    const firstRun = runs[0].runId;
    setSelectedRunId(firstRun);
    setSelectedEventId(grouped[firstRun]?.[0]?.id);
  }, [grouped, runs, selectedRunId]);

  const hydrateSelection = (nextEvents: TraceEvent[]) => {
    const nextGrouped = groupEventsByRunId(nextEvents);
    const nextRuns = buildRunSummaries(nextGrouped);
    const firstRun = nextRuns[0]?.runId;
    const firstEvent = firstRun ? nextGrouped[firstRun]?.[0]?.id : undefined;

    setEvents(nextEvents);
    setSelectedRunId(firstRun);
    setSelectedEventId(firstEvent);
  };

  const handleSampleLoad = async (samplePath: string) => {
    try {
      setErrorCode(undefined);
      const loaded = await loadTraceFromSample(samplePath);
      hydrateSelection(loaded);
    } catch (e) {
      setErrorCode((e as Error).message);
    }
  };

  const handleFileLoad = async (file?: File) => {
    if (!file) {
      return;
    }

    try {
      setErrorCode(undefined);
      const loaded = await loadTraceFromFile(file);
      hydrateSelection(loaded);
    } catch (e) {
      setErrorCode((e as Error).message);
    }
  };

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    const firstEvent = grouped[runId]?.[0]?.id;
    setSelectedEventId(firstEvent);
  };

  const mapStatusLabel = (status: "completed" | "failed" | "handoff" | "running") => {
    if (status === "completed") {
      return t("statusCompleted");
    }
    if (status === "failed") {
      return t("statusFailed");
    }
    if (status === "handoff") {
      return t("statusHandoff");
    }
    return t("statusRunning");
  };

  const errorMessage = useMemo(() => {
    if (!errorCode) {
      return undefined;
    }
    if (errorCode === "FAILED_TO_LOAD_TRACE_FILE") {
      return t("failedToLoadTraceFile");
    }
    if (errorCode === "INVALID_JSONL") {
      return t("invalidJsonl");
    }
    if (errorCode === "EMPTY_FILE") {
      return t("emptyFile");
    }
    if (errorCode === "UNSUPPORTED_CONTENT") {
      return t("unsupportedContent");
    }
    return t("failedToLoadTraceFile");
  }, [errorCode, t]);

  return (
    <div className="app">
      <main className="layout">
        <RunList
          runs={runs}
          selectedRunId={selectedRunId}
          onSelectRun={handleSelectRun}
          title={t("runList")}
          noRunsLabel={t("noRunsLoaded")}
          statusLabel={t("status")}
          startedAtLabel={t("startedAt")}
          eventCountLabel={t("eventCount")}
          mapStatus={mapStatusLabel}
          error={errorMessage}
          controls={
            <>
              <h1 className="viewer-title">Yutra {t("traceViewer")}</h1>
              <label className="control-label" htmlFor="locale-select">
                {t("language")}
              </label>
              <select
                id="locale-select"
                data-testid="locale-select"
                aria-label={t("language")}
                value={locale}
                onChange={(event) => setLocale(event.target.value as SupportedLocale)}
              >
                <option value="en">{t("english")}</option>
                <option value="zh-CN">{t("chinese")}</option>
              </select>
              <label className="file-input">
                {t("loadJsonl")}
                <input
                  type="file"
                  accept=".jsonl,application/json"
                  onChange={(event) => handleFileLoad(event.target.files?.[0])}
                />
              </label>
              <select
                data-testid="sample-select"
                aria-label={t("sampleTraces")}
                onChange={(event) => void handleSampleLoad(event.target.value)}
                defaultValue=""
              >
                <option value="" disabled>
                  {t("sampleTraces")}
                </option>
                {SAMPLE_OPTIONS.map((option) => (
                  <option key={option.path} value={option.path}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          }
        />
        <TraceTimeline
          events={selectedRunEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          title={t("timeline")}
          hasRunSelected={Boolean(selectedRunId)}
          noRunSelectedLabel={t("noRunSelected")}
          selectRunToInspectLabel={t("selectRunToInspect")}
          noEventsInRunLabel={t("noEventsInRun")}
        />
        <EventDetail
          event={selectedEvent}
          title={t("eventDetail")}
          noEventSelectedLabel={t("noEventSelected")}
          selectEventToInspectLabel={t("selectEventToInspect")}
          labels={{
            type: t("type"),
            timestamp: t("timestamp"),
            state: t("state"),
            action: t("action"),
            transition: t("transition"),
            payload: t("payload"),
            metadata: t("metadata"),
            error: t("error")
          }}
        />
      </main>
    </div>
  );
}
