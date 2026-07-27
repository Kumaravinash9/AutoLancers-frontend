import Link from "next/link";

import { AUTH_LINKS, BRAND } from "@/content/site";
import { FOOTER, PLATFORMS } from "@/content/landing";

/** Landing page only — the in-app screens are working dashboards where a marketing footer
 *  would be clutter, same split site-nav.tsx already draws between marketing and app nav.
 *  Links are either real routes or real in-page anchors — no placeholder social icons for
 *  accounts that don't exist yet. A tinted `bg-sunken` (rather than the dot-grid texture Hero
 *  and Close already use) so it settles as the page's floor instead of repeating a motif. */
export function Footer() {
  return (
    <footer className="border-t border-border bg-sunken px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="font-display text-xl font-semibold tracking-tight">
              {BRAND.prefix}
              <span className="text-accent">{BRAND.suffix}</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted">{FOOTER.blurb}</p>
          </div>

          <FooterColumn title="Product">
            {FOOTER.productLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-muted hover:text-foreground">
                {link.label}
              </a>
            ))}
          </FooterColumn>

          <FooterColumn title="Marketplaces">
            {PLATFORMS.items.map((item) => (
              <span key={item.name} className="flex items-center gap-2 text-sm text-muted">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    item.status === "live" ? "bg-accent" : "bg-border"
                  }`}
                />
                {item.name}
                {item.status !== "live" && (
                  <span className="font-mono text-[0.6rem] uppercase text-muted/70">next</span>
                )}
              </span>
            ))}
          </FooterColumn>

          <FooterColumn title="Account">
            <Link href={AUTH_LINKS.signIn} className="text-sm text-muted hover:text-foreground">
              Sign in
            </Link>
            <Link href={AUTH_LINKS.signUp} className="text-sm text-muted hover:text-foreground">
              Start free
            </Link>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="max-w-2xl text-xs text-muted">{FOOTER.disclaimer}</p>
            <p className="mt-1.5 font-mono text-xs text-muted">
              © {new Date().getFullYear()} AutoLancers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <IconLink href={`mailto:${FOOTER.email}`} label={`Email ${FOOTER.email}`}>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
            </IconLink>
            <IconLink href="#top" label="Back to top">
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </IconLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-mono text-[0.7rem] uppercase tracking-widest text-muted">{title}</span>
      {children}
    </div>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        {children}
      </svg>
      <span className="sr-only">{label}</span>
    </a>
  );
}
