import { toIntlLocale, type Locale } from "./config";

export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), options).format(
    new Date(value),
  );
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(toIntlLocale(locale), options).format(value);
}

export function formatCurrency(
  value: number,
  locale: Locale,
  currency = "THB",
): string {
  return formatNumber(value, locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}
