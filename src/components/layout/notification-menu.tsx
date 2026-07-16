"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";
import type { Messages } from "@/lib/i18n/messages";
import { markNotificationReadAction } from "@/server/actions/collaboration";
import type { NotificationFeed } from "@/server/queries/collaboration";

export function NotificationMenu({
  feed,
  locale,
  messages,
}: {
  feed: NotificationFeed;
  locale: Locale;
  messages: Messages;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = messages.notifications;
  const mark = (id?: string) => {
    startTransition(async () => {
      await markNotificationReadAction(id);
      router.refresh();
    });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="relative"
            aria-label={t.unreadCount.replace(
              "{count}",
              String(feed.unreadCount),
            )}
          />
        }
      >
        <Bell aria-hidden="true" />
        {feed.unreadCount > 0 ? (
          <span className="bg-primary text-primary-foreground absolute top-1 right-1 grid min-w-4 place-items-center rounded-full px-1 text-[0.62rem] font-semibold tabular-nums">
            {feed.unreadCount > 99 ? "99+" : feed.unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(24rem,calc(100vw-2rem))] p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{t.title}</h2>
          {feed.unreadCount ? (
            <button
              type="button"
              onClick={() => mark()}
              disabled={pending}
              className="text-primary inline-flex items-center gap-1 text-xs font-medium disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              {t.markAllRead}
            </button>
          ) : null}
        </div>
        {feed.items.length ? (
          <div className="max-h-96 overflow-y-auto">
            {feed.items.map((item) => {
              const caseNumber = String(item.body_data.case_number ?? "");
              return (
                <div
                  key={item.id}
                  className={`border-b px-4 py-3 last:border-0 ${item.read_at ? "" : "bg-primary/5"}`}
                >
                  <div className="flex items-start gap-2">
                    {!item.read_at ? (
                      <span
                        className="bg-primary mt-1.5 size-2 shrink-0 rounded-full"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {item.case_id ? (
                        <Link
                          href={`/cases/${item.case_id}`}
                          onClick={() =>
                            !item.read_at ? mark(item.id) : undefined
                          }
                          className="hover:text-primary block text-sm font-medium"
                        >
                          {t[item.notification_type]}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium">
                          {t[item.notification_type]}
                        </p>
                      )}
                      {caseNumber ? (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {t.caseReference.replace("{caseNumber}", caseNumber)}
                        </p>
                      ) : null}
                      <p className="text-muted-foreground mt-1 text-[0.68rem]">
                        {formatDate(item.created_at, locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground px-4 py-8 text-center text-sm">
            {t.empty}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
