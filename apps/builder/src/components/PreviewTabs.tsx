import type { BuilderIssue } from "@yutra/builder-core";
import { useMemo, useState } from "react";
import { ValidationPanel } from "./ValidationPanel";

type TabKey = "json" | "dsl" | "validation";

interface PreviewTabsProps {
  specJson: string;
  dslText: string;
  issues: BuilderIssue[];
  uiWarnings: string[];
  ok: boolean;
  onCopySpec: () => void;
  onCopyDsl: () => void;
  copyMessage?: string;
}

export function PreviewTabs(props: PreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("json");
  const { specJson, dslText, issues, uiWarnings, ok, onCopySpec, onCopyDsl, copyMessage } = props;

  const currentTab = useMemo(() => activeTab, [activeTab]);

  return (
    <section className="preview">
      <div className="tabs">
        <button type="button" className={currentTab === "json" ? "tab active" : "tab"} onClick={() => setActiveTab("json")}>
          AgentSpec JSON
        </button>
        <button type="button" className={currentTab === "dsl" ? "tab active" : "tab"} onClick={() => setActiveTab("dsl")}>
          中文 DSL
        </button>
        <button
          type="button"
          className={currentTab === "validation" ? "tab active" : "tab"}
          onClick={() => setActiveTab("validation")}
        >
          Validation
        </button>
      </div>

      {currentTab === "json" ? (
        <div className="tab-panel">
          <button type="button" onClick={onCopySpec}>
            Copy AgentSpec JSON
          </button>
          <pre aria-label="AgentSpec JSON">{specJson}</pre>
        </div>
      ) : null}

      {currentTab === "dsl" ? (
        <div className="tab-panel">
          <button type="button" onClick={onCopyDsl}>
            Copy 中文 DSL
          </button>
          <pre aria-label="Chinese DSL">{dslText}</pre>
        </div>
      ) : null}

      {currentTab === "validation" ? (
        <div className="tab-panel">
          <ValidationPanel ok={ok} issues={issues} uiWarnings={uiWarnings} />
        </div>
      ) : null}

      {copyMessage ? <p className="hint">{copyMessage}</p> : null}
    </section>
  );
}
