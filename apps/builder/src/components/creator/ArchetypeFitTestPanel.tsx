import { useI18n } from "../../i18n";

export function ArchetypeFitTestPanel() {
  const { t } = useI18n();

  const questions = [
    t("creator.fit.primaryOutputQuestion"),
    t("creator.fit.triggerQuestion"),
    t("creator.fit.sideEffectQuestion"),
    t("creator.fit.approvalQuestion"),
    t("creator.fit.processQuestion")
  ];

  const guidance = [
    t("creator.fit.businessActionGuidance"),
    t("creator.fit.authorizationGuidance"),
    t("creator.fit.sourceConstrainedGuidance"),
    t("creator.fit.scenarioPatternGuidance")
  ];

  return (
    <section className="creator-section archetype-fit-test-panel" aria-label="Archetype Fit Test Panel">
      <h3>{t("creator.fit.title")}</h3>
      <ol>
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ol>
      <div className="fit-guidance">
        {guidance.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </section>
  );
}
