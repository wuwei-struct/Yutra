import type { FlowDraft } from "@yutra/builder-ai-core";
import { prettyDraftJson } from "../lib/ai-draft-formatters";

interface FlowDraftPreviewProps {
  draft?: FlowDraft;
}

export function FlowDraftPreview(props: FlowDraftPreviewProps) {
  const { draft } = props;
  return (
    <section className="panel-section" aria-label="FlowDraft Preview">
      <h4>FlowDraft Preview</h4>
      {draft ? (
        <>
          <p className="warning-text">This is a draft. Review before applying.</p>
          <div className="card">
            <div>draftId: {draft.draftId}</div>
            <div>scenario: {draft.scenario}</div>
            <div>title: {draft.title}</div>
            <div>source: {draft.source.type}</div>
            <div>createdAt: {draft.createdAt}</div>
            <div>intents: {draft.intents.map((item) => item.id).join(", ")}</div>
            <div>skills: {draft.selectedSkills.join(", ")}</div>
          </div>
          <pre aria-label="FlowDraft JSON">{prettyDraftJson(draft)}</pre>
        </>
      ) : (
        <p className="hint">Generate a draft to preview FlowDraft JSON.</p>
      )}
    </section>
  );
}
