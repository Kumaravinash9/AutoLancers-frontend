import Link from "next/link";

import { AUTH_LINKS, BRAND } from "@/content/site";
import { FOOTER, PLATFORMS } from "@/content/landing";

/** Landing page only — the in-app screens are working dashboards where a marketing footer
 *  would be clutter, same split site-nav.tsx already draws between marketing and app nav.
 *  Links are either real routes or real in-page anchors — no placeholder social icons for
 *  accounts that don't exist yet. */
export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface px-6 py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 sm:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link href="/" className="font-display text-[1.05rem] font-semibold tracking-tight">
            {BRAND.prefix}
            <span className="text-accent">{BRAND.suffix}</span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted">{FOOTER.blurb}</p>

          <div className="mt-4 flex items-center gap-3">
            <a
              href={`mailto:${FOOTER.email}`}
              title={FOOTER.email}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="sr-only">Email {FOOTER.email}</span>
            </a>
            <a
              href="#top"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="sr-only">Back to top</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.7rem] uppercase tracking-widest text-muted">
            Product
          </span>
          {FOOTER.productLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-muted hover:text-foreground">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.7rem] uppercase tracking-widest text-muted">
            Marketplaces
          </span>
          {PLATFORMS.items.map((item) => (
            <span key={item.name} className="flex items-center gap-1.5 text-sm text-muted">
              {item.name}
              {item.status !== "live" && (
                <span className="font-mono text-[0.6rem] uppercase text-muted/70">next</span>
              )}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.7rem] uppercase tracking-widest text-muted">
            Account
          </span>
          <Link href={AUTH_LINKS.signIn} className="text-sm text-muted hover:text-foreground">
            Sign in
          </Link>
          <Link href={AUTH_LINKS.signUp} className="text-sm text-muted hover:text-foreground">
            Start free
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-10 max-w-6xl border-t border-border pt-6 text-xs text-muted">
        <p className="max-w-2xl">{FOOTER.disclaimer}</p>
        <p className="mt-2">© {new Date().getFullYear()} AutoLancers.</p>
      </div>
    </footer>
  );
}
