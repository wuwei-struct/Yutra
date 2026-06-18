import { DraftAssistantColumn } from "./DraftAssistantColumn";
import { DslEditorColumn } from "./DslEditorColumn";
import { InspectColumn } from "./InspectColumn";
import { RunDebugPanel } from "./RunDebugPanel";
import { RunTracePanel } from "./RunTracePanel";
import { StudioEventDetailPanel } from "./StudioEventDetailPanel";
import type { StudioStateController } from "../../lib/studio-state";

interface AgentEditorWorkspaceProps {
  studio: StudioStateController;
  onCopySpec: () => void;
  onCopyDsl: () => void;
  onRun: () => void;
  onDownloadTrace: () => void;
  onDownloadAudit: () => void;
}

export function AgentEditorWorkspace(props: AgentEditorWorkspaceProps) {
  const { studio, onCopySpec, onCopyDsl, onRun, onDownloadTrace, onDownloadAudit } = props;

  return (
    <main className="agent-editor-workspace" aria-label="Agent Editor Workbench">
      <section className="workspace-main-grid">
        <DraftAssistantColumn studio={studio} />
        <DslEditorColumn studio={studio} onCopySpec={onCopySpec} onCopyDsl={onCopyDsl} />
        <InspectColumn studio={studio} />
      </section>
      <section className="workspace-bottom-grid">
        <RunDebugPanel studio={studio} onRun={onRun} onDownloadTrace={onDownloadTrace} />
        <RunTracePanel studio={studio} />
        <StudioEventDetailPanel studio={studio} onDownloadAudit={onDownloadAudit} />
      </section>
    </main>
  );
}
