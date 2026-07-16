"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const documentLocale =
    typeof document === "undefined"
      ? defaultLocale
      : document.documentElement.lang;
  const locale = isLocale(documentLocale) ? documentLocale : defaultLocale;
  const messages = getMessages(locale);

  return (
    <section className="grid min-h-[60vh] place-items-center text-center">
      <div className="max-w-md">
        <span className="bg-destructive/10 text-destructive mx-auto grid size-12 place-items-center rounded-2xl">
          <TriangleAlert aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-semibold">
          {messages.common.unexpectedErrorTitle}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {messages.common.unexpectedErrorDescription}
        </p>
        <Button className="mt-5" onClick={reset}>
          {messages.common.retry}
        </Button>
      </div>
    </section>
  );
}
