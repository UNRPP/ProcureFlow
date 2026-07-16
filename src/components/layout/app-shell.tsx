import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import type { NotificationFeed } from "@/server/queries/collaboration";

import { AppHeader } from "./app-header";
import { DesktopSidebar, type ShellUser } from "./desktop-sidebar";

export function AppShell({
  children,
  locale,
  messages,
  user,
  notifications,
}: {
  children: React.ReactNode;
  locale: Locale;
  messages: Messages;
  user: ShellUser;
  notifications: NotificationFeed;
}) {
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground fixed top-3 left-3 z-[100] -translate-y-24 rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-transform focus:translate-y-0"
      >
        {messages.common.skipToContent}
      </a>
      <DesktopSidebar messages={messages} user={user} />
      <div className="min-h-screen lg:pl-68">
        <AppHeader
          locale={locale}
          messages={messages}
          user={user}
          notifications={notifications}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[100rem] p-4 focus:outline-none sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
