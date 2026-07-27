"use client";

import { motion, useReducedMotion } from "motion/react";

import { COMPARISON } from "@/content/landing";

/**
 * A real positioning device, not a new claim — every point on the right already exists
 * elsewhere on this page (reasons list, floors/excludes, re-scoring). Deliberately styled as a
 * contrast card (muted/struck left, accent-lit right) rather than the kicker+title+card
 * template used everywhere else, so it reads as a distinct moment, not another repeated section.
 */
export function Comparison() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
            {COMPARISON.kicker}
          </span>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {COMPARISON.title}
          </h2>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-xl border border-border sm:grid-cols-2">
          <div className="bg-sunken p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted">
              {COMPARISON.before.label}
            </p>
            <pre className="mt-3 whitespace-pre-wrap rounded-md border border-border bg-surface px-3 py-2.5 font-mono text-xs leading-relaxed text-muted">
              {COMPARISON.before.snippet}
            </pre>
            <ul className="mt-4 space-y-3">
              {COMPARISON.before.points.map((point, i) => (
                <motion.li
                  key={point}
                  className="flex gap-2.5 text-sm text-muted"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.3,
                    delay: i * (reduceMotion ? 0 : 0.07),
                  }}
                >
                  <span aria-hidden="true" className="shrink-0 text-muted/70">
                    ✕
                  </span>
                  {point}
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="border-t border-border bg-accent-soft p-6 sm:border-t-0 sm:border-l sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-accent">
              {COMPARISON.after.label}
            </p>
            <ul className="mt-4 space-y-3">
              {COMPARISON.after.points.map((point, i) => (
                <motion.li
                  key={point}
                  className="flex gap-2.5 text-sm font-medium"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.3,
                    delay: i * (reduceMotion ? 0 : 0.07),
                  }}
                >
                  <span aria-hidden="true" className="shrink-0 text-accent">
                    ✓
                  </span>
                  {point}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
