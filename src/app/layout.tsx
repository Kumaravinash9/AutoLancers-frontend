import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "automateLancers",
  description: "Freelancer.com job discovery, scoring, and AI-drafted proposals.",
};

const NAV = [
  { href: "/queue", label: "Queue" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              automate<span className="text-accent">Lancers</span>
            </Link>
            <nav className="flex gap-4 text-sm">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="text-muted hover:text-foreground">
                  {item.label}
                </Link>
              ))}
            </nav>
            <span className="ml-auto text-xs text-muted">
              Draft-only · nothing is auto-submitted
            </span>
          </div>
        </header>
        {/* No content box here on purpose: the marketing page runs edge to edge, so each page
            owns its own width and padding via <Page>. */}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
