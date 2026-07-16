"use client";

import {
  CalendarDays,
  ClipboardCheck,
  FolderOpen,
  LayoutDashboard,
  Settings,
  type LucideIcon,
  ChartNoAxesCombined,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { Messages } from "@/lib/i18n/messages";

type NavigationKey = Exclude<keyof Messages["navigation"], "label">;

type NavigationItem = {
  href: string;
  key: NavigationKey;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/my-work", key: "myWork", icon: ClipboardCheck },
  { href: "/cases", key: "cases", icon: FolderOpen },
  { href: "/calendar", key: "calendar", icon: CalendarDays },
  { href: "/reports", key: "reports", icon: ChartNoAxesCombined },
  { href: "/settings", key: "settings", icon: Settings },
];

export function SidebarNav({
  messages,
  onNavigate,
}: {
  messages: Messages["navigation"];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={messages.label} className="space-y-1">
      {navigationItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group text-sidebar-foreground/78 hover:bg-sidebar-accent/65 hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-[background-color,color,transform] duration-150 hover:translate-x-0.5 focus-visible:ring-2 focus-visible:outline-none",
              active &&
                "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
            )}
          >
            <Icon className="size-[1.15rem] shrink-0" strokeWidth={1.9} />
            <span>{messages[item.key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
