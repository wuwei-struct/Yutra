import { useState } from "react";
import type { CreatorCompilePreviewResponse } from "../../types";
import { creatorArtifactTabs, type CreatorArtifactTab } from "../../lib/creator-state";
import type { SendCompiledDslMeta } from "./creator-ui-helpers";

export function CompileArtifactsPanel(props: {
  response: CreatorCompilePreviewResponse;
  onSendCompiledDslToEditor?: (dslText: string, meta?: SendCompiledDslMeta) => void;
}) {
  const [active, setActive] = useState<CreatorArtifactTab>("agent");
  if (!props.response.ok || !props.response.artifacts) {
    return null;
  }

  const artifact = props.response.artifacts[active];
  const canSendAgent = active === "agent" && Boolean(artifact.content);
  return (
    <section className="creator-section" aria-label="Artifact Preview">
      <h3>Artifact Preview</h3>
      <div className="tabs wrap-tabs">
        {creatorArtifactTabs.map((tab) => (
          <button key={tab.key} type="button" className={active === tab.key ? "tab active" : "tab"} onClick={() => setActive(tab.key)}>
            {tab.label}
            {tab.note ? ` (${tab.note})` : ""}
          </button>
        ))}
      </div>
      <div className="status-row wrap-row">
        <span className="status-pill">{artifact.contentType}</span>
        <span className="status-pill">{artifact.hash}</span>
        {active === "agent" ? <span className="status-pill warning">not executed</span> : null}
        {active === "agent" ? <span className="status-pill warning">not inspected</span> : null}
        {active === "adapterConfig" ? <span className="status-pill ok">mock only</span> : null}
      </div>
      {canSendAgent ? (
        <div className="manual-flow-helper" aria-label="Compiled DSL Manual Flow">
          <button
            type="button"
            onClick={() =>
              props.onSendCompiledDslToEditor?.(artifact.content, {
                compileId: props.response.compileId,
                compilerVersion: props.response.compilerVersion,
                configHash: props.response.report?.packConfigHash,
                artifactHash: artifact.hash
              })
            }
          >
            Send agent.yutra.yaml to DSL Editor
          </button>
          <p className="hint">
            Sends the compiled agent artifact to the DSL editor. It does not inspect, apply, or run automatically.
          </p>
          <ol>
            <li>Send to DSL Editor</li>
            <li>Inspect DSL</li>
            <li>Apply DSL as Run Source</li>
            <li>Run Preview manually</li>
          </ol>
        </div>
      ) : null}
      <pre aria-label="Compiled Artifact Content">{artifact.content}</pre>
    </section>
  );
}
