import { StudioShell } from "./components/studio/StudioShell";
import { copyText, downloadTextAsFile, useStudioState } from "./lib/studio-state";

export default function App() {
  const studio = useStudioState();

  return (
    <StudioShell
      studio={studio}
      onCopySpec={() => {
        void copyText(studio.specJson).then((ok) =>
          studio.setCopyMessage(ok ? "Copied AgentSpec JSON." : "Clipboard not available in this browser.")
        );
      }}
      onCopyDsl={() => {
        void copyText(studio.dslBuffer).then((ok) => studio.setCopyMessage(ok ? "Copied DSL draft." : "Clipboard not available in this browser."));
      }}
      onRun={() => {
        void studio.runCurrentPreview();
      }}
      onDownloadTrace={() => {
        if (studio.runResponse?.ok && studio.runResponse.traceJsonl) {
          downloadTextAsFile("yutra-trace-preview.jsonl", studio.runResponse.traceJsonl);
        }
      }}
      onDownloadAudit={() => {
        if (studio.runResponse?.ok && studio.runResponse.auditBundle) {
          downloadTextAsFile("yutra-audit-preview.json", JSON.stringify(studio.runResponse.auditBundle, null, 2));
        }
      }}
    />
  );
}
