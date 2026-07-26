"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Account, accounts } from "@/lib/api";
import { APP_NAV, AUTH_LINKS, BRAND, MARKETING_NAV, MARKETING_ROUTES } from "@/content/site";

/**
 * One nav, two audiences.
 *
 * A stranger on the marketing page shouldn't be offered Queue and Profile — those mean nothing
 * until they have an account. Once inside the product, the pitch is no longer the point.
 */

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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/80 backdrop-blur-md supports-backdrop-filter:bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-6 py-3">
        <Link href="/" className="font-display text-[1.05rem] font-semibold tracking-tight">
          {BRAND.prefix}
          <span className="text-accent">{BRAND.suffix}</span>
        </Link>

        {marketing ? (
          <>
            <nav className="ml-auto hidden items-center gap-6 text-sm text-muted md:flex">
              {MARKETING_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              ))}
            </nav>
            <nav className="flex items-center gap-5 text-sm">
              <Link
                href={AUTH_LINKS.signIn}
                className="border-b-2 border-transparent pb-0.5 text-muted transition-colors hover:border-border hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href={AUTH_LINKS.signUp}
                className="rounded-md bg-accent px-3.5 py-1.5 font-medium text-white transition-opacity hover:opacity-90"
              >
                Start free
              </Link>
            </nav>
          </>
        ) : (
          <>
            <nav className="flex gap-5 text-sm">
              {APP_NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`border-b-2 pb-0.5 transition-colors ${
                      active
                        ? "border-accent font-medium text-foreground"
                        : "border-transparent text-muted hover:border-border hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {account?.role === "admin" && (
              <Link
                href="/admin"
                className={`border-b-2 pb-0.5 transition-colors ${
                  pathname.startsWith("/admin")
                    ? "border-accent font-medium text-accent"
                    : "border-transparent text-muted hover:border-border hover:text-foreground"
                }`}
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
