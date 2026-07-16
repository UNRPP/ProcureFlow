import type { Locale } from "@/lib/i18n/config";

export function localizedMasterDataName(
  record: { name_en: string; name_th: string },
  locale: Locale,
): string {
  if (locale === "th" && record.name_th.trim()) return record.name_th;
  return record.name_en;
}
