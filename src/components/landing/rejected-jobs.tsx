"use client";

import { motion, useReducedMotion } from "motion/react";

import { REJECTED } from "@/content/landing";
import { WindowChrome } from "./window-chrome";

/**
 * A coded replica of the queue page's Rejected tab (queue/page.tsx's rejection_reason display) —
 * the one screen competitors never show, since "why didn't this match" is a harder sell than
 * "here's a match." Showing it is the point: it's what makes the filter trustworthy.
 */
export function RejectedJobs() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
            {REJECTED.kicker}
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {REJECTED.title}
          </h2>
          <p className="leading-relaxed text-muted">{REJECTED.body}</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_0_rgba(16,24,32,0.02)]">
          <WindowChrome label="Rejected — filtered automatically" />
          <ul className="divide-y divide-border">
            {REJECTED.jobs.map((job, i) => (
              <motion.li
                key={job.title}
                className="flex items-start gap-3 p-4"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: reduceMotion ? 0.01 : 0.3, delay: i * (reduceMotion ? 0 : 0.1) }}
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-warn/15 font-mono text-[0.6rem] text-warn"
                >
                  ✕
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-muted line-through decoration-border">
                    {job.title}
                  </p>
                  <p className="mt-0.5 text-sm">{job.reason}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
