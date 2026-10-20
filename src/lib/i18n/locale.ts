export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "locale";

export const dirFor = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");
export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);
