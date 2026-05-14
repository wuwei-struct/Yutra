import { prettyDraftJson } from "../lib/ai-draft-formatters";
import type { DraftDiffItem } from "../types";

interface DraftApplyPreviewProps {
  changes: DraftDiffItem[];
  canApply: boolean;
  applyMessage?: string;
  onApply: () => void;
}

export function DraftApplyPreview(props: DraftApplyPreviewProps) {
  const { changes, canApply, applyMessage, onApply } = props;
  return (
    <section className="panel-section" aria-label="Draft Apply Preview">
      <h4>Draft Apply Preview</h4>
      {changes.length === 0 ? (
        <p className="hint">No changes</p>
      ) : (
        <div className="list">
          {changes.map((change) => (
            <div key={change.field} className="issue issue-warning">
              <strong>{change.field}</strong>
              <div>before: {prettyDraftJson(change.before)}</div>
              <div>after: {prettyDraftJson(change.after)}</div>
            </div>
          ))}
        </div>
      )}
      <button type="button" aria-label="Apply Draft" disabled={!canApply} onClick={onApply}>
        Apply Draft
      </button>
      {applyMessage ? <p className="ok-text">{applyMessage}</p> : null}
    </section>
  );
}
