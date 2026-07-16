import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import type { NotificationFeed } from "@/server/queries/collaboration";

import type { ShellUser } from "./desktop-sidebar";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNavigation } from "./mobile-navigation";
import { NotificationMenu } from "./notification-menu";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function AppHeader({
  locale,
  messages,
  user,
  notifications,
}: {
  locale: Locale;
  messages: Messages;
  user: ShellUser;
  notifications: NotificationFeed;
}) {
  return (
    <header className="bg-background/92 sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <MobileNavigation messages={messages} />

      <form
        action="/cases"
        className="relative ml-auto hidden w-full max-w-lg md:block"
      >
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          name="search"
          aria-label={messages.header.searchPlaceholder}
          placeholder={messages.header.searchPlaceholder}
          className="bg-card h-10 pl-9 shadow-xs"
        />
      </form>

      <div className="ml-auto flex items-center gap-0.5 md:ml-2">
        <LanguageSwitcher locale={locale} messages={messages.language} />
        <ThemeToggle messages={messages.theme} />
        <NotificationMenu
          feed={notifications}
          locale={locale}
          messages={messages}
        />
        <div className="bg-border mx-1 hidden h-6 w-px sm:block" />
        <UserMenu user={user} messages={messages.header} />
      </div>
    </header>
  );
}
