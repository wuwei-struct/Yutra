import { useI18n, type MessageKey } from "../../i18n";
import type { ScenarioRunPreviewDemoCase } from "../../types";

const CASE_LABEL_KEYS: Record<ScenarioRunPreviewDemoCase, MessageKey> = {
  complaint_policy: "scenario.run.case.policy",
  complaint_compensation: "scenario.run.case.compensation",
  complaint_handoff: "scenario.run.case.handoff",
  refund_authorization: "scenario.run.case.authorization",
  overlay_deny: "scenario.run.case.overlayDeny"
};

export function ScenarioRunCaseSelector(props: {
  cases: ScenarioRunPreviewDemoCase[];
  selectedCase: ScenarioRunPreviewDemoCase;
  disabled: boolean;
  onSelect: (demoCase: ScenarioRunPreviewDemoCase) => void;
}) {
  const { t } = useI18n();
  return (
    <fieldset className="scenario-run-case-selector" disabled={props.disabled}>
      <legend>{t("scenario.run.selectCase")}</legend>
      <div className="scenario-run-case-grid">
        {props.cases.map((demoCase) => (
          <label
            className={demoCase === props.selectedCase ? "selected" : ""}
            key={demoCase}
          >
            <input
              type="radio"
              name="scenario-run-case"
              value={demoCase}
              checked={demoCase === props.selectedCase}
              onChange={() => props.onSelect(demoCase)}
            />
            <span>{t(CASE_LABEL_KEYS[demoCase])}</span>
            <code>{demoCase}</code>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
