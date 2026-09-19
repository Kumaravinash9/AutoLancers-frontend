import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const sans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoLancers — bid on the jobs worth bidding on",
  description:
    "Watches freelance marketplaces for work that fits your skills, scores every listing with "
    + "its reasons shown, and drafts the proposal. You review and send.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      {/* No content box here: nav chrome and the content wrapper are both owned by the
          nested route-group layouts (marketing SiteNav vs. the app sidebar shell), since
          they differ per audience rather than being one global header. */}
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
