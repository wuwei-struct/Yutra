import { useI18n } from "../../i18n";
import { type SupportedCreatorArchetype } from "../../lib/creator-state";
import { creatorArchetypeOptions, type CreatorArchetypeOption } from "./archetype-taxonomy-ui";
import { isSupportedCreatorArchetype } from "./creator-ui-helpers";

export function CreatorArchetypeSelector(props: {
  currentArchetypeId: string;
  focusedArchetypeId: string;
  onSelectArchetype: (archetypeId: SupportedCreatorArchetype) => void;
  onFocusArchetype: (archetypeId: string) => void;
}) {
  const { locale, t } = useI18n();

  return (
    <section className="creator-section" aria-label="Archetype Selector">
      <h3>{t("creator.archetype.selector")}</h3>
      <p className="hint">{t("creator.archetype.selectorHint")}</p>
      <div className="creator-archetype-card-grid">
        {creatorArchetypeOptions.map((item) => (
          <ArchetypeCard
            key={item.id}
            item={item}
            locale={locale}
            selected={props.currentArchetypeId === item.id}
            focused={props.focusedArchetypeId === item.id}
            onFocusArchetype={props.onFocusArchetype}
            onSelectArchetype={props.onSelectArchetype}
            labels={{
              enabled: t("creator.archetype.enabled"),
              comingSoon: t("creator.archetype.comingSoon"),
              product: t("creator.archetype.product"),
              crossCutting: t("creator.archetype.crossCutting"),
              primaryOutput: t("creator.archetype.primaryOutput"),
              acceptanceObject: t("creator.archetype.acceptanceObject"),
              triggerPattern: t("creator.archetype.triggerPattern"),
              governanceFocus: t("creator.archetype.governanceFocus"),
              behaviorPrimitives: t("creator.archetype.behaviorPrimitives"),
              crossCuttingCapability: t("creator.archetype.crossCuttingCapability"),
              notStandalone: t("creator.archetype.notStandalone"),
              details: t("creator.archetype.details")
            }}
          />
        ))}
      </div>
    </section>
  );
}

function ArchetypeCard(props: {
  item: CreatorArchetypeOption;
  locale: "en" | "zh-CN";
  selected: boolean;
  focused: boolean;
  labels: Record<
    | "enabled"
    | "comingSoon"
    | "product"
    | "crossCutting"
    | "primaryOutput"
    | "acceptanceObject"
    | "triggerPattern"
    | "governanceFocus"
    | "behaviorPrimitives"
    | "crossCuttingCapability"
    | "notStandalone"
    | "details",
    string
  >;
  onSelectArchetype: (archetypeId: SupportedCreatorArchetype) => void;
  onFocusArchetype: (archetypeId: string) => void;
}) {
  const { item, locale } = props;
  const manifest = item.manifest;
  const taxonomy = manifest.taxonomy;
  const name = locale === "zh-CN" ? manifest.name.zhCN : manifest.name.en;
  const primaryOutput = taxonomy.primaryOutput ? (locale === "zh-CN" ? taxonomy.primaryOutput.zhCN : taxonomy.primaryOutput.en) : "-";
  const acceptanceObject = taxonomy.acceptanceObject ? (locale === "zh-CN" ? taxonomy.acceptanceObject.zhCN : taxonomy.acceptanceObject.en) : "-";
  const governanceFocus = (locale === "zh-CN" ? taxonomy.governanceFocus?.zhCN : taxonomy.governanceFocus?.en) ?? [];
  const status = props.selected ? "selected" : item.enabled ? props.labels.enabled : props.labels.comingSoon;

  return (
    <article className={`creator-archetype-card ${item.enabled ? "enabled" : "disabled"} ${props.selected ? "selected" : ""} ${props.focused ? "focused" : ""}`}>
      <div className="creator-archetype-card-header">
        <div>
          <strong>{manifest.archetypeId}</strong>
          <span>{name}</span>
        </div>
        <span className={item.enabled ? "status-pill ok" : "status-pill warning"}>{status}</span>
      </div>
      <div className="taxonomy-chip-row">
        <span className="taxonomy-chip">{taxonomy.layer === "product_archetype" ? props.labels.product : props.labels.crossCutting}</span>
        <span className="taxonomy-chip">{taxonomy.triggerPattern ?? "mixed"}</span>
      </div>
      <dl className="archetype-card-facts">
        <dt>{props.labels.primaryOutput}</dt>
        <dd>{primaryOutput}</dd>
        <dt>{props.labels.acceptanceObject}</dt>
        <dd>{acceptanceObject}</dd>
        <dt>{props.labels.governanceFocus}</dt>
        <dd>{governanceFocus.slice(0, 3).join(", ") || "-"}</dd>
      </dl>
      <div>
        <span className="hint">{props.labels.behaviorPrimitives}</span>
        <div className="taxonomy-chip-row">
          {taxonomy.primitiveRefs.slice(0, 6).map((primitive) => (
            <span className="taxonomy-chip primitive" key={primitive}>
              {primitive}
            </span>
          ))}
        </div>
      </div>
      {taxonomy.layer === "cross_cutting_archetype" ? (
        <p className="warning-text">
          {props.labels.crossCuttingCapability}: {props.labels.notStandalone}
        </p>
      ) : null}
      <div className="button-row wrap-row">
        <button
          type="button"
          disabled={!item.enabled}
          aria-pressed={props.selected}
          onClick={() => {
            props.onFocusArchetype(item.id);
            if (isSupportedCreatorArchetype(item.id)) {
              props.onSelectArchetype(item.id);
            }
          }}
        >
          {item.label}
        </button>
        <button type="button" className="secondary-button" onClick={() => props.onFocusArchetype(item.id)}>
          {props.labels.details}
        </button>
      </div>
    </article>
  );
}
