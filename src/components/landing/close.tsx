"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import { AUTH_LINKS } from "@/content/site";
import { CLOSE } from "@/content/landing";

/** Bookends the hero's "two hundred / four" claim — the same numbers, animated once as a
 *  before/after, rather than a new stat or a decorative flourish. */
function Bookend() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-6">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-deep-muted">
        Where you started
      </p>
      <div className="mt-3 flex items-center gap-4">
        <motion.span
          className="font-display text-4xl font-semibold text-deep-muted line-through decoration-white/20 sm:text-5xl"
          initial={{ opacity: 1 }}
          whileInView={{ opacity: 0.4 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: reduceMotion ? 0.01 : 0.5 }}
        >
          204
        </motion.span>
        <span aria-hidden="true" className="text-deep-muted">
          →
        </span>
        <motion.span
          className="font-display text-5xl font-semibold text-deep-fg sm:text-6xl"
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: reduceMotion ? 0.01 : 0.4, delay: reduceMotion ? 0 : 0.35 }}
        >
          4
        </motion.span>
      </div>
      <p className="mt-2 text-sm text-deep-muted">listings in the feed → worth opening</p>
    </div>
  );
}

export function Close() {
  return (
    <section className="relative overflow-hidden bg-deep px-6 py-24 text-deep-fg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(circle, var(--deep-fg) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col items-start gap-6">
          <h2 className="max-w-xl font-display text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
            {CLOSE.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={AUTH_LINKS.signUp}
              className="rounded-md bg-deep-fg px-5 py-2.5 font-medium text-deep transition-opacity hover:opacity-90"
            >
              {CLOSE.primaryCta}
            </Link>
            <Link
              href={AUTH_LINKS.signIn}
              className="rounded-md border border-white/15 px-5 py-2.5 font-medium transition-colors hover:bg-white/5"
            >
              {CLOSE.secondaryCta}
            </Link>
          </div>

          <p className="font-mono text-xs text-deep-muted">{CLOSE.fineprint}</p>
        </div>

        <Bookend />
      </div>
    </section>
  );
}
