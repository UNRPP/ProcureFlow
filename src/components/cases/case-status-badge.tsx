import {
  Ban,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  FilePenLine,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/types/database";

const icons = {
  draft: FilePenLine,
  active: CirclePlay,
  on_hold: CirclePause,
  completed: CheckCircle2,
  cancelled: Ban,
};

export function CaseStatusBadge({
  status,
  messages,
}: {
  status: CaseStatus;
  messages: Messages["cases"]["statuses"];
}) {
  const Icon = icons[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active" && "border-info/40 text-info-foreground",
        status === "completed" && "border-success/40 text-success-foreground",
        status === "on_hold" && "border-warning/50 text-warning-foreground",
        status === "cancelled" && "border-destructive/40 text-destructive",
        status === "draft" && "text-muted-foreground",
      )}
    >
      <Icon />
      {messages[status]}
    </Badge>
  );
}
