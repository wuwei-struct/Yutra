import { AgentEditorWorkspace } from "./AgentEditorWorkspace";
import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";
import { useI18n } from "../../i18n";
import type { StudioStateController } from "../../lib/studio-state";

interface StudioShellProps {
  studio: StudioStateController;
  onCopySpec: () => void;
  onCopyDsl: () => void;
  onRun: () => void;
  onDownloadTrace: () => void;
  onDownloadAudit: () => void;
}

export function StudioShell(props: StudioShellProps) {
  const { studio, onCopySpec, onCopyDsl, onRun, onDownloadTrace, onDownloadAudit } = props;
  const { t } = useI18n();

  return (
    <div className="studio-shell">
      <SidebarNav active={studio.navItem} onSelect={studio.setNavItem} />
      <div className="studio-surface">
        <TopBar agentName={studio.formState.agentName} onPreview={() => studio.setNavItem("my-agent")} />
        {studio.navItem === "my-agent" ? (
          <AgentEditorWorkspace
            studio={studio}
            onCopySpec={onCopySpec}
            onCopyDsl={onCopyDsl}
            onRun={onRun}
            onDownloadTrace={onDownloadTrace}
            onDownloadAudit={onDownloadAudit}
          />
        ) : (
          <section className="coming-soon" aria-label="Coming Soon">
            <h1>{t("sidebar.comingSoon")}</h1>
            <p>{t("sidebar.placeholder")}</p>
          </section>
        )}
      </div>
    </div>
  );
}
