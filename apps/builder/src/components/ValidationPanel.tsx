import type { BuilderIssue } from "@yutra/builder-core";
import { formatIssuePath } from "../lib/formatters";

interface ValidationPanelProps {
  ok: boolean;
  issues: BuilderIssue[];
  uiWarnings: string[];
}

export function ValidationPanel(props: ValidationPanelProps) {
  const { ok, issues, uiWarnings } = props;
  return (
    <section className="validation-panel" aria-label="Validation Panel">
      <h4>Validation</h4>
      <p className={ok ? "ok-text" : "error-text"}>{ok ? "passed" : "failed"}</p>
      <p>issue count: {issues.length + uiWarnings.length}</p>
      {issues.map((item, index) => (
        <div key={`${item.code}-${index}`} className={`issue ${item.severity === "warning" ? "issue-warning" : "issue-error"}`}>
          <div>code: {item.code}</div>
          <div>severity: {item.severity}</div>
          <div>message: {item.message}</div>
          <div>path: {formatIssuePath(item.path)}</div>
        </div>
      ))}
      {uiWarnings.map((warning, index) => (
        <div key={`ui-warning-${index}`} className="issue issue-warning">
          <div>code: UI_WARNING</div>
          <div>severity: warning</div>
          <div>message: {warning}</div>
          <div>path: -</div>
        </div>
      ))}
    </section>
  );
}
