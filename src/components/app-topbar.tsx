"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { TopbarAccountButton } from "@/components/account-popover";
import { BellIcon, MenuIcon } from "@/components/nav-icons";
import { PlatformSwitcher } from "@/components/platform-switcher";
import { matchNavItem } from "@/content/site";
import { Account } from "@/lib/api";

function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-foreground"
        aria-label="Notifications"
      >
        <BellIcon />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+0.6rem)] z-30 w-64 rounded-lg border border-border bg-surface p-3 shadow-(--shadow-lg)">
          <p className="text-sm font-medium">Notifications</p>
          <p className="mt-1 text-xs text-muted">Nothing yet — you&apos;re all caught up.</p>
        </div>
      )}
    </div>
  );
}

/** Section label on the left, plus the mobile-only menu trigger (the sidebar is
 *  `hidden lg:block`, so this is how it's reached below `lg`). Platform switcher, notifications,
 *  and the account avatar sit on the right. The avatar and the sidebar's SidebarProfileCard
 *  share one popover (see account-popover.tsx) — two entry points to the exact same menu, not
 *  two menus that could drift apart. */
export function AppTopbar({
  account,
  onOpenMobile,
  onSignOut,
}: {
  account: Account | null;
  onOpenMobile: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const section = matchNavItem(pathname)?.label ?? "";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-surface/80 px-4 py-3.5 shadow-(--shadow-sm) backdrop-blur-md supports-backdrop-filter:bg-surface/60 lg:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        className="text-muted transition-colors hover:text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <MenuIcon />
      </button>

      <span className="min-w-0 truncate font-display text-base font-semibold tracking-tight">{section}</span>

      <div className="ml-auto flex items-center gap-3">
        <PlatformSwitcher />
        <NotificationsButton />
        <TopbarAccountButton account={account} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
