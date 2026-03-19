import type { SupportedLocale } from "./messages";

export const LOCALE_STORAGE_KEY = "yutra.viewer.locale";

export function isSupportedLocale(locale: string | null | undefined): locale is SupportedLocale {
  return locale === "en" || locale === "zh-CN";
}

export function localeFromBrowserLanguage(language?: string | null): SupportedLocale {
  if (typeof language === "string" && language.toLowerCase().startsWith("zh")) {
    return "zh-CN";
  }
  return "en";
}

export function resolveInitialLocale(input?: {
  storedLocale?: string | null;
  browserLanguage?: string | null;
}): SupportedLocale {
  const storedLocale = input?.storedLocale;
  if (isSupportedLocale(storedLocale)) {
    return storedLocale;
  }

  return localeFromBrowserLanguage(input?.browserLanguage ?? null);
}

export function getStoredLocale(storage?: Storage | null): SupportedLocale | null {
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(LOCALE_STORAGE_KEY);
  return isSupportedLocale(raw) ? raw : null;
}

export function setStoredLocale(locale: SupportedLocale, storage?: Storage | null): void {
  if (!storage) {
    return;
  }
  storage.setItem(LOCALE_STORAGE_KEY, locale);
}
