import { useI18n, type MessageKey } from "../../i18n";

const workflowSteps: MessageKey[] = [
  "creator.workflow.selectArchetype",
  "creator.workflow.configureBusinessRules",
  "creator.workflow.reviewRuleImpact",
  "creator.workflow.compilePreview",
  "creator.workflow.sendDsl",
  "creator.workflow.inspectDsl",
  "creator.workflow.applyDsl",
  "creator.workflow.runPreview",
  "creator.workflow.reviewTraceAudit"
];

export function CreatorWorkflowStepper(props: {
  compiled: boolean;
  hasRunEvidence: boolean;
}) {
  const { t } = useI18n();

  return (
    <section className="creator-workflow-stepper" aria-label="Creator Workflow">
      <div className="creator-stage-header">
        <h3>{t("creator.workflow.title")}</h3>
        <span className="status-pill warning">manual flow</span>
      </div>
      <ol>
        {workflowSteps.map((step, index) => {
          const active = index < 3 || (props.compiled && index < 5) || props.hasRunEvidence;
          return (
            <li key={step} className={active ? "workflow-step active" : "workflow-step"}>
              <span>{index + 1}</span>
              <strong>{t(step)}</strong>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
