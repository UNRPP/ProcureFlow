"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Messages } from "@/lib/i18n/messages";

import { BrandMark } from "./brand-mark";
import { QuickActions } from "./quick-actions";
import { SidebarNav } from "./sidebar-nav";

export function MobileNavigation({ messages }: { messages: Messages }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="lg:hidden"
            aria-label={messages.header.openMenu}
          />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent
        side="left"
        closeLabel={messages.header.closeMenu}
        className="border-sidebar-border bg-sidebar text-sidebar-foreground w-[min(88vw,20rem)] p-0"
      >
        <SheetHeader className="border-sidebar-border border-b px-5 py-5 text-left">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <SheetTitle className="text-white">
                {messages.brand.name}
              </SheetTitle>
              <SheetDescription className="text-sidebar-foreground/65">
                {messages.brand.subtitle}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="px-3 py-4">
          <SidebarNav
            messages={messages.navigation}
            onNavigate={() => setOpen(false)}
          />
          <QuickActions
            messages={messages.cases}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
