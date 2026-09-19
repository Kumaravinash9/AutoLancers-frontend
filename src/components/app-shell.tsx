"use client";

import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Account, accounts, isConnectionError } from "@/lib/api";
import { DEMO_ACCOUNT } from "@/lib/demo-data";

const COLLAPSE_KEY = "al:sidebar-collapsed";

/**
 * The persistent shell for every signed-in app screen: a collapsible left rail on desktop
 * (falling back to a slide-in drawer below `lg`) plus a slim topbar. Nav chrome, the account
 * switcher, and sign-out all live here instead of SiteNav, which stays reserved for the
 * marketing pages and the admin fallback (see (marketing)/layout.tsx and admin/layout.tsx).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Read synchronously via a lazy initializer rather than an effect + setState, which the
  // project's lint config forbids (see AGENTS.md) since it causes a cascading render.
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(COLLAPSE_KEY) === "1",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  // Signed-out is the normal case here, not an error — same as SiteNav's own account fetch.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await accounts.me();
        if (!cancelled) setAccount(me);
      } catch (err) {
        if (!cancelled) setAccount(isConnectionError(err) ? DEMO_ACCOUNT : null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function toggleCollapse() {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      return !prev;
    });
  }

  async function signOut() {
    await accounts.logout().catch(() => {});
    router.push("/");
  }

  return (
    // h-screen + overflow-hidden pins the shell to the viewport; <main> below is the only
    // region that scrolls, so the sidebar and topbar never move with page content.
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`hidden shrink-0 overflow-hidden border-r border-border bg-surface transition-[width] lg:block ${
          collapsed ? "w-20" : "w-56"
        }`}
      >
        <AppSidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          account={account}
          onSignOut={signOut}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-64 overflow-hidden border-r border-border bg-surface shadow-(--shadow-lg)">
            <AppSidebar
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
              account={account}
              onSignOut={signOut}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar account={account} onOpenMobile={() => setMobileOpen(true)} onSignOut={signOut} />
        <main className="app-bg flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
