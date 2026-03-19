import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { LOCALE_STORAGE_KEY, resolveInitialLocale, setStoredLocale } from "./locale";
import { MESSAGES, type MessageKey, type SupportedLocale } from "./messages";

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveBrowserLocale(): SupportedLocale {
  const storage = typeof window !== "undefined" ? window.localStorage : null;
  const stored = storage ? storage.getItem(LOCALE_STORAGE_KEY) : null;
  const browserLanguage = typeof navigator !== "undefined" ? navigator.language : "en";

  return resolveInitialLocale({
    storedLocale: stored,
    browserLanguage
  });
}

export function I18nProvider(props: { children: ReactNode; initialLocale?: SupportedLocale }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(props.initialLocale ?? resolveBrowserLocale());

  const setLocale = (nextLocale: SupportedLocale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      setStoredLocale(nextLocale, window.localStorage);
    }
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => MESSAGES[locale][key]
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
