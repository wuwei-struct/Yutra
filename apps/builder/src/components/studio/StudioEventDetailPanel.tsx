import { AuditBundlePanel } from "../AuditBundlePanel";
import { prettyJson } from "../../lib/formatters";
import type { StudioStateController } from "../../lib/studio-state";
import { useI18n } from "../../i18n";

interface StudioEventDetailPanelProps {
  studio: StudioStateController;
  onDownloadAudit: () => void;
}

function readPayload(event: Record<string, unknown> | undefined): Record<string, unknown> {
  const payload = event?.payload;
  return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
}

export function StudioEventDetailPanel(props: StudioEventDetailPanelProps) {
  const { studio, onDownloadAudit } = props;
  const { t } = useI18n();
  const event = studio.selectedEvent as Record<string, unknown> | undefined;
  const payload = readPayload(event);

  return (
    <section className="studio-bottom-column detail-workbench" aria-label="Studio Event Detail Panel">
      <div className="panel-title">
        <h2>{t("event.title")}</h2>
        <span>{event?.type ? String(event.type) : t("event.noEvent")}</span>
      </div>
      <section className="panel-section event-fields">
        <h3>{t("event.selected")}</h3>
        <dl>
          <dt>{t("event.type")}</dt>
          <dd>{String(event?.type ?? "-")}</dd>
          <dt>{t("event.id")}</dt>
          <dd>{String(event?.id ?? "-")}</dd>
          <dt>{t("event.timestamp")}</dt>
          <dd>{String(event?.ts ?? "-")}</dd>
          <dt>{t("event.state")}</dt>
          <dd>{String(event?.state ?? "-")}</dd>
          <dt>{t("event.action")}</dt>
          <dd>{String(event?.action ?? "-")}</dd>
          <dt>{t("event.skillName")}</dt>
          <dd>{String(payload.skillName ?? payload.skill ?? "-")}</dd>
          <dt>{t("event.duration")}</dt>
          <dd>{String(payload.durationMs ?? "-")}</dd>
        </dl>
        <h4>{t("event.input")}</h4>
        <pre>{prettyJson(payload.input ?? {})}</pre>
        <h4>{t("event.output")}</h4>
        <pre>{prettyJson(payload.output ?? payload.result ?? {})}</pre>
        <h4>{t("event.error")}</h4>
        <pre>{prettyJson(payload.error ?? {})}</pre>
        <h4>{t("event.contextDelta")}</h4>
        <pre>{prettyJson(payload.contextDelta ?? payload.contextPatch ?? {})}</pre>
        <h4>{t("event.rawPayload")}</h4>
        <pre>{prettyJson(payload)}</pre>
      </section>
      <AuditBundlePanel response={studio.runResponse} onDownloadAudit={onDownloadAudit} />
    </section>
  );
}
