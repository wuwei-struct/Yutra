import { useI18n } from "../../i18n";

export function ScenarioPrecedencePanel(props: {
  precedence?: { rules: string[]; conflictMode: "fail_closed" };
}) {
  const { t } = useI18n();
  return (
    <section className="scenario-detail-panel" aria-label="Composition Precedence">
      <div className="scenario-section-heading">
        <h3>{t("scenario.precedence")}</h3>
        <code>conflictMode = {props.precedence?.conflictMode ?? "fail_closed"}</code>
      </div>
      <ol className="scenario-precedence-list">
        {(props.precedence?.rules ?? []).map((rule) => <li key={rule}>{rule}</li>)}
      </ol>
    </section>
  );
}
