import type { StudioLocale } from "./messages";

export const STUDIO_LOCALE_STORAGE_KEY = "yutra.studio.locale";

export function isStudioLocale(value: unknown): value is StudioLocale {
  return value === "en" || value === "zh-CN";
}

export function resolveInitialLocale(options: { stored?: string | null; navigatorLanguage?: string | null } = {}): StudioLocale {
  if (isStudioLocale(options.stored)) {
    return options.stored;
  }
  const language = options.navigatorLanguage ?? "";
  return language.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

export function readInitialLocale(): StudioLocale {
  const stored = typeof window !== "undefined" ? window.localStorage.getItem(STUDIO_LOCALE_STORAGE_KEY) : undefined;
  const navigatorLanguage = typeof navigator !== "undefined" ? navigator.language : undefined;
  return resolveInitialLocale({ stored, navigatorLanguage });
}

export function persistLocale(locale: StudioLocale): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STUDIO_LOCALE_STORAGE_KEY, locale);
}
