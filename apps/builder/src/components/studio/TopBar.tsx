import { localeOptions, useI18n } from "../../i18n";

interface TopBarProps {
  agentName: string;
  onPreview: () => void;
}

export function TopBar(props: TopBarProps) {
  const { agentName, onPreview } = props;
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="studio-topbar" aria-label="Studio Top Bar">
      <div>
        <div className="breadcrumb">
          {t("topbar.myAgent")} / {agentName || t("topbar.defaultAgent")}
        </div>
        <div className="topbar-meta">
          <span>{t("topbar.draft")}</span>
          <span>{t("topbar.localDraft")}</span>
          <span>{t("topbar.notPersisted")}</span>
        </div>
      </div>
      <div className="topbar-actions">
        <button type="button" disabled title={t("topbar.undoTitle")}>
          {t("topbar.undo")}
        </button>
        <button type="button" disabled title={t("topbar.redoTitle")}>
          {t("topbar.redo")}
        </button>
        <button type="button" onClick={onPreview}>
          {t("topbar.previewAgent")}
        </button>
        <button type="button" title={t("topbar.saveTitle")}>
          {t("topbar.save")}
        </button>
        <button type="button" disabled title={t("topbar.publishTitle")}>
          {t("topbar.publish")}
        </button>
        <label className="language-switcher">
          <span>{t("topbar.language")}</span>
          <select
            aria-label="Studio Language"
            value={locale}
            onChange={(event) => setLocale(event.target.value as typeof locale)}
          >
            {localeOptions.map((option) => (
              <option key={option.locale} value={option.locale}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="avatar-placeholder" aria-label="User avatar placeholder">
          Y
        </div>
      </div>
    </header>
  );
}
