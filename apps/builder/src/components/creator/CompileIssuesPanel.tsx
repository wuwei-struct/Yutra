import type { RuleCompilerIssue } from "@yutra/rule-compiler";
import { issueGroups } from "./creator-ui-helpers";

export function CompileIssuesPanel(props: { issues: RuleCompilerIssue[] }) {
  const grouped = issueGroups(props.issues);
  return (
    <section className="creator-section" aria-label="Compile Issues">
      <h3>Compile Issues</h3>
      <p className={grouped.errors.length > 0 ? "error-text" : "ok-text"}>
        errors: {grouped.errors.length} / warnings: {grouped.warnings.length}
      </p>
      {[...grouped.errors, ...grouped.warnings].map((issue, index) => (
        <div key={`${issue.code}-${index}`} className={issue.severity === "error" ? "issue issue-error" : "issue issue-warning"}>
          <strong>{issue.code}</strong>
          <p>{issue.message}</p>
          {issue.path ? <small>path: {issue.path.join(".")}</small> : null}
        </div>
      ))}
    </section>
  );
}
