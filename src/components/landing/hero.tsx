import Link from "next/link";

import { AUTH_LINKS } from "@/content/site";
import { BADGE, HERO } from "@/content/landing";

export function Hero() {
  return (
    <section className="relative px-6 pb-12 pt-16 sm:pb-16 sm:pt-24">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-[0.7rem] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {BADGE}
        </span>

        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{HERO.kicker}</p>

        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-[3.4rem]">
          {HERO.headline[0]}
          <br />
          <span className="text-accent">{HERO.headline[1]}</span>
        </h1>

        <p className="max-w-xl text-lg leading-relaxed text-muted">{HERO.subhead}</p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            href={AUTH_LINKS.signUp}
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
          >
            {HERO.primaryCta}
          </Link>
          <Link
            href={AUTH_LINKS.demo}
            className="rounded-md border border-border px-5 py-2.5 font-medium transition-colors hover:border-accent hover:bg-accent-soft"
          >
            {HERO.secondaryCta}
          </Link>
        </div>

        <p className="font-mono text-xs text-muted">{HERO.fineprint}</p>
      </div>
    </section>
  );
}
