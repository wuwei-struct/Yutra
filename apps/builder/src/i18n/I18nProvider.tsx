import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { persistLocale, readInitialLocale } from "./locale";
import { messages, type MessageKey, type StudioLocale } from "./messages";

export interface I18nContextValue {
  locale: StudioLocale;
  setLocale: (locale: StudioLocale) => void;
  t: (key: MessageKey) => string;
}

export const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider(props: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<StudioLocale>(() => readInitialLocale());

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const setLocale = useCallback((nextLocale: StudioLocale) => {
    setLocaleState(nextLocale);
  }, []);

  const t = useCallback(
    (key: MessageKey) => {
      return messages[locale][key] ?? messages.en[key] ?? key;
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>;
}
