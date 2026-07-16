import { Box } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "text-primary grid size-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-white/60",
        className,
      )}
    >
      <Box className="size-5" strokeWidth={2.25} />
    </span>
  );
}
