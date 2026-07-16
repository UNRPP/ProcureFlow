export const locales = ["en", "th"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "procureflow-locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}

export function toIntlLocale(locale: Locale): string {
  return locale === "th" ? "th-TH" : "en-US";
}
