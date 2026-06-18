import type { BuilderRunPreviewResponse } from "../types";
import { useI18n } from "../i18n";

interface TraceTimelineProps {
  response?: BuilderRunPreviewResponse;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function TraceTimeline(props: TraceTimelineProps) {
  const { response, selectedIndex, onSelect } = props;
  const { t } = useI18n();
  const timeline = response?.ok ? response.timeline ?? [] : [];

  return (
    <section className="panel-section" aria-label="Trace Timeline">
      <h4>{t("trace.timeline")}</h4>
      {timeline.length === 0 ? <p className="hint">{t("trace.noEvents")}</p> : null}
      <div className="timeline-list">
        {timeline.map((item) => (
          <button
            key={`${item.index}-${item.type}`}
            type="button"
            className={selectedIndex === item.index ? "timeline-item active" : "timeline-item"}
            onClick={() => onSelect(item.index)}
          >
            <span>#{item.index}</span>
            <span>{item.type}</span>
            <span>{item.state ?? "-"}</span>
            <span>{item.action ?? "-"}</span>
            <span>{item.status ?? "-"}</span>
            <span>{item.error ?? "-"}</span>
            <span>
              {item.implementationType === "skill" && item.skillName ? `Skill: ${item.skillName}` : item.implementationType ?? "-"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
