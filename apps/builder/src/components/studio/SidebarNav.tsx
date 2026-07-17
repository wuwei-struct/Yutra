import type { StudioNavItem } from "../../lib/studio-state";
import { useI18n, type MessageKey } from "../../i18n";

const groups: Array<{ titleKey: MessageKey; items: Array<{ id: StudioNavItem; labelKey: MessageKey }> }> = [
  {
    titleKey: "sidebar.workbench",
    items: [
      { id: "dashboard", labelKey: "sidebar.dashboard" },
      { id: "my-agent", labelKey: "sidebar.myAgents" },
      { id: "scenario-composition", labelKey: "sidebar.scenarioComposition" },
      { id: "templates", labelKey: "sidebar.templates" },
      { id: "packs", labelKey: "sidebar.packs" },
      { id: "tools", labelKey: "sidebar.tools" },
      { id: "knowledge", labelKey: "sidebar.knowledge" }
    ]
  },
  {
    titleKey: "sidebar.runDebug",
    items: [
      { id: "runs", labelKey: "sidebar.runs" },
      { id: "traces", labelKey: "sidebar.traces" }
    ]
  },
  {
    titleKey: "sidebar.settings",
    items: [
      { id: "env", labelKey: "sidebar.environment" },
      { id: "docs", labelKey: "sidebar.help" }
    ]
  }
];

interface SidebarNavProps {
  active: StudioNavItem;
  onSelect: (item: StudioNavItem) => void;
}

export function SidebarNav(props: SidebarNavProps) {
  const { active, onSelect } = props;
  const { t } = useI18n();

  return (
    <aside className="studio-sidebar" aria-label="Studio Navigation">
      <div className="studio-brand">
        <strong>Yutra Studio</strong>
        <span>{t("app.subtitle")}</span>
      </div>
      {groups.map((group) => (
        <nav key={group.titleKey} className="nav-group" aria-label={t(group.titleKey)}>
          <p>{t(group.titleKey)}</p>
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={active === item.id ? "nav-item active" : "nav-item"}
              onClick={() => onSelect(item.id)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </nav>
      ))}
    </aside>
  );
}
