import { Plus } from "lucide-react";
import Link from "next/link";

import type { Messages } from "@/lib/i18n/messages";
import type { WorkCategoryCode } from "@/types/database";

const actions: { category: WorkCategoryCode; accent: string }[] = [
  { category: "medical_device", accent: "bg-sidebar-primary" },
  { category: "medical_equipment", accent: "bg-chart-2" },
  { category: "service_contract", accent: "bg-chart-4" },
];

export function QuickActions({
  messages,
  onNavigate,
}: {
  messages: Messages["cases"];
  onNavigate?: () => void;
}) {
  return (
    <section className="border-sidebar-border mt-6 border-t pt-5">
      <h2 className="text-sidebar-foreground/55 px-2 text-[0.68rem] font-semibold tracking-wider uppercase">
        {messages.quickActions}
      </h2>
      <div className="mt-2 space-y-1">
        {actions.map(({ category, accent }) => (
          <Link
            key={category}
            href={`/cases/new?category=${category}`}
            onClick={onNavigate}
            className="hover:bg-sidebar-accent/55 focus-visible:ring-sidebar-ring flex min-h-10 items-center gap-2.5 rounded-xl px-2 text-sm text-white/85 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <span
              className={`${accent} grid size-6 place-items-center rounded-lg text-white`}
            >
              <Plus className="size-3.5" />
            </span>
            <span>{messages.quickActionLabels[category]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
