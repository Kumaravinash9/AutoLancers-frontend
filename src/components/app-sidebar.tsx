"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { NAV_ICONS } from "@/components/nav-icons";
import { SidebarProfileCard } from "@/components/account-popover";
import { APP_NAV, BRAND, matchNavItem, NavGroupKey } from "@/content/site";
import { Account } from "@/lib/api";

const GROUP_ORDER: NavGroupKey[] = ["workspace", "account"];

/**
 * The nav rail's contents, shared by the persistent desktop rail and the mobile drawer in
 * AppShell — collapsed and the collapse toggle only make sense for the rail, so the drawer
 * passes collapsed=false and omits onToggleCollapse. Links are grouped (Workspace, Account),
 * with a horizontal divider between groups rather than a section label. The nav list
 * scrolls on its own (`overflow-y-auto` on `<nav>`, not the outer column) so the profile card
 * stays pinned to the bottom regardless of how long the nav list gets.
 */
export function AppSidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  account,
  onSignOut,
}: {
  collapsed: boolean;
  /** Omitted by the mobile drawer, which has no rail to collapse. */
  onToggleCollapse?: () => void;
  /** Closes the mobile drawer after following a link. No-op on the desktop rail. */
  onNavigate?: () => void;
  account: Account | null;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const activeHref = matchNavItem(pathname)?.href;

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 flex items-center justify-between gap-2 px-1">
        {collapsed ? (
          // Collapsed: the brand mark itself doubles as the expand trigger — hover swaps "AL"
          // for the expand icon rather than showing a second, permanently-visible button.
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="group relative grid h-8 w-8 shrink-0 place-items-center"
          >
            <span className="font-display text-lg font-semibold tracking-tight transition-opacity group-hover:opacity-0">
              {BRAND.prefix[0]}
              <span className="text-accent">{BRAND.suffix[0]}</span>
            </span>
            <PanelLeftOpen
              size={21}
              strokeWidth={1.75}
              className="absolute inset-0 m-auto text-muted opacity-0 transition-opacity group-hover:opacity-100"
            />
          </button>
        ) : (
          <>
            <Link
              href="/dashboard"
              onClick={onNavigate}
              className="font-display text-lg font-semibold tracking-tight"
            >
              {BRAND.prefix}
              <span className="text-accent">{BRAND.suffix}</span>
            </Link>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-foreground"
              >
                <PanelLeftClose size={21} strokeWidth={1.75} />
              </button>
            )}
          </>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-hidden">
        {GROUP_ORDER.map((group) => {
          const items = APP_NAV.filter((item) => item.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              {group !== "workspace" && <hr className="mb-3 border-t border-border" />}
              <div className="flex flex-col gap-1">
                {items.map((item) => {
                  const Icon = NAV_ICONS[item.icon];
                  const active = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={`relative flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors ${
                        collapsed ? "justify-center px-0" : "px-3"
                      } ${
                        active
                          ? "bg-accent-soft font-medium text-accent"
                          : "text-muted hover:bg-sunken hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent" aria-hidden="true" />
                      )}
                      <Icon className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <SidebarProfileCard account={account} collapsed={collapsed} onSignOut={onSignOut} />
    </div>
  );
}
