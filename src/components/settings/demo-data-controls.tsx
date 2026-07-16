"use client";

import { DatabaseZap, LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Messages } from "@/lib/i18n/messages";
import { manageDemoDataAction } from "@/server/actions/master-data";

export function DemoDataControls({ messages }: { messages: Messages }) {
  const router = useRouter();
  const [pending, setPending] = useState<"seed" | "clear" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const t = messages.settings;

  async function run(operation: "seed" | "clear") {
    if (operation === "clear" && !window.confirm(t.confirmClearDemo)) return;
    setPending(operation);
    const result = await manageDemoDataAction(operation);
    setNotice(result.message);
    setPending(null);
    if (result.status === "success") router.refresh();
  }

  return (
    <section className="mb-5 rounded-xl border border-dashed bg-muted/25 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">{t.demoTitle}</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{t.demoDescription}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={() => run("seed")} disabled={pending !== null}>
            {pending === "seed" ? <LoaderCircle className="animate-spin" /> : <DatabaseZap />}
            {t.seedDemo}
          </Button>
          <Button size="sm" variant="outline" onClick={() => run("clear")} disabled={pending !== null}>
            {pending === "clear" ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
            {t.clearDemo}
          </Button>
        </div>
      </div>
      {notice ? <p className="text-muted-foreground mt-3 text-sm" role="status">{notice}</p> : null}
    </section>
  );
}
