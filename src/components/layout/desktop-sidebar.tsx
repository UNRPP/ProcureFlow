import { BrandMark } from "./brand-mark";
import { QuickActions } from "./quick-actions";
import { SidebarNav } from "./sidebar-nav";
import { UserAvatar } from "./user-avatar";

import type { Messages } from "@/lib/i18n/messages";

export type ShellUser = {
  fullName: string;
  email: string;
  roleLabel: string;
};

export function DesktopSidebar({
  messages,
  user,
}: {
  messages: Messages;
  user: ShellUser;
}) {
  return (
    <aside className="border-sidebar-border bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-40 hidden w-68 flex-col border-r lg:flex">
      <div className="flex h-20 items-center gap-3 px-5">
        <BrandMark />
        <div className="min-w-0">
          <p className="truncate text-[1.05rem] font-semibold tracking-tight text-white">
            {messages.brand.name}
          </p>
          <p className="text-sidebar-foreground/65 truncate text-xs">
            {messages.brand.subtitle}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav messages={messages.navigation} />
        <QuickActions messages={messages.cases} />
      </div>

      <div className="border-sidebar-border m-3 flex items-center gap-3 rounded-xl border bg-black/8 p-3">
        <UserAvatar name={user.fullName} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {user.fullName}
          </p>
          <p className="text-sidebar-foreground/65 truncate text-xs">
            {user.roleLabel}
          </p>
        </div>
      </div>
    </aside>
  );
}
