"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Account, accounts } from "@/lib/api";

/**
 * One nav, two audiences.
 *
 * A stranger on the marketing page shouldn't be offered Queue and Profile — those mean nothing
 * until they have an account. Once inside the product, the pitch is no longer the point.
 */
const APP_NAV = [
  { href: "/queue", label: "Queue" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

const MARKETING_ROUTES = new Set(["/", "/login"]);

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);

  // Signed-out is the normal case here, not an error — a failed /me just means no session.
  useEffect(() => {
    const state = { cancelled: false };
    void (async () => {
      try {
        const me = await accounts.me();
        if (!state.cancelled) setAccount(me);
      } catch {
        if (!state.cancelled) setAccount(null);
      }
    })();
    return () => {
      state.cancelled = true;
    };
  }, [pathname]);
  const marketing = MARKETING_ROUTES.has(pathname);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3.5">
        <Link href="/" className="font-display text-[1.05rem] font-semibold tracking-tight">
          automate<span className="text-accent">Lancers</span>
        </Link>

        {marketing ? (
          <nav className="ml-auto flex items-center gap-5 text-sm">
            <Link href="/login" className="text-muted transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-md bg-accent px-3.5 py-1.5 font-medium text-white transition-opacity hover:opacity-90"
            >
              Start free
            </Link>
          </nav>
        ) : (
          <>
            <nav className="flex gap-4 text-sm">
              {APP_NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active ? "font-medium text-foreground" : "text-muted hover:text-foreground"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {account?.role === "admin" && (
              <Link
                href="/admin"
                className={
                  pathname.startsWith("/admin")
                    ? "font-medium text-accent"
                    : "text-muted hover:text-foreground"
                }
              >
                Admin
              </Link>
            )}
            <div className="ml-auto flex items-center gap-3 text-sm">
              {account && <span className="hidden text-muted sm:inline">{account.email}</span>}
              <button
                type="button"
                onClick={async () => {
                  await accounts.logout().catch(() => {});
                  setAccount(null);
                  router.push("/");
                }}
                className="text-muted transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
