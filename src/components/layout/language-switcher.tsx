import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { setLocale } from "@/server/actions/locale";

export function LanguageSwitcher({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages["language"];
}) {
  const nextLocale: Locale = locale === "en" ? "th" : "en";
  const nextLabel = nextLocale === "en" ? messages.english : messages.thai;

  return (
    <form action={setLocale.bind(null, nextLocale)}>
      <Button
        type="submit"
        variant="ghost"
        size="lg"
        aria-label={`${messages.change}: ${nextLabel}`}
        title={`${messages.change}: ${nextLabel}`}
      >
        <Languages />
        <span className="hidden text-xs font-semibold sm:inline">
          {locale === "en" ? messages.shortEnglish : messages.shortThai}
        </span>
      </Button>
    </form>
  );
}
