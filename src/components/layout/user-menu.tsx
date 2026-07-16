"use client";

import { ChevronDown, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Messages } from "@/lib/i18n/messages";
import { signOut } from "@/server/actions/auth";

import type { ShellUser } from "./desktop-sidebar";
import { UserAvatar } from "./user-avatar";

export function UserMenu({
  user,
  messages,
}: {
  user: ShellUser;
  messages: Messages["header"];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="lg"
            className="h-10 max-w-52 gap-2 px-2"
            aria-label={messages.userMenu}
          />
        }
      >
        <UserAvatar name={user.fullName} size="sm" />
        <span className="hidden max-w-28 truncate text-sm md:block">
          {user.fullName}
        </span>
        <ChevronDown className="text-muted-foreground hidden size-3.5 md:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2">
            <span className="text-muted-foreground block text-[0.7rem] font-normal tracking-wide uppercase">
              {messages.signedInAs}
            </span>
            <span className="text-foreground mt-1 block truncate text-sm">
              {user.email}
            </span>
            <span className="text-muted-foreground mt-0.5 block truncate text-xs font-normal">
              {user.roleLabel}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <button
            type="submit"
            className="text-destructive hover:bg-destructive/10 focus-visible:ring-ring flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <LogOut className="size-4" />
            {messages.signOut}
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
