import { AgentEditorWorkspace } from "./AgentEditorWorkspace";
import { ScenarioCompositionWorkbench } from "../scenario/ScenarioCompositionWorkbench";
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
        ) : studio.navItem === "scenario-composition" ? (
          <ScenarioCompositionWorkbench
            onSendSlotDsl={(dslText, metadata) => {
              studio.sendCompiledDslToEditor(dslText, {
                sourceKind: "scenario_slot",
                compileId: `${metadata.compositionId}:${metadata.slotId}`,
                compilerVersion: metadata.compilerVersion,
                configHash: metadata.configHash,
                artifactHash: metadata.artifactHash,
                compositionId: metadata.compositionId,
                slotId: metadata.slotId,
                archetypeId: metadata.archetypeId,
                singleSlotOnly: true
              });
              studio.setNavItem("my-agent");
            }}
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
