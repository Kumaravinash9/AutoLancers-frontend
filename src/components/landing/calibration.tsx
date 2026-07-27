"use client";

import { motion, useReducedMotion } from "motion/react";

import { ScoreBadge } from "@/components/ui";
import { CALIBRATION } from "@/content/landing";
import { WindowChrome } from "./window-chrome";

// Mirrors STATUS_TONE / STATUS_LABEL in src/app/proposals/page.tsx exactly, so this section and
// the real screen never disagree about what a status means or looks like.
const STATUS_TONE: Record<(typeof CALIBRATION.rows)[number]["status"], string> = {
  SUBMITTED: "bg-accent-soft text-accent",
  ACCEPTED: "bg-good/15 text-good",
  REJECTED: "bg-warn/15 text-warn",
};
const STATUS_LABEL: Record<(typeof CALIBRATION.rows)[number]["status"], string> = {
  SUBMITTED: "Sent",
  ACCEPTED: "Selected",
  REJECTED: "Not selected",
};

/**
 * A coded replica of the real Proposals page — see the doc comment on CALIBRATION in
 * content/landing.ts. Same window-chrome language as LiveQueue/BidConfirm/ProfileTuner so it
 * reads as one family of real screens.
 */
export function Calibration() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
            {CALIBRATION.kicker}
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {CALIBRATION.title}
          </h2>
          <p className="leading-relaxed text-muted">{CALIBRATION.body}</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_0_rgba(16,24,32,0.02)]">
          <WindowChrome label="Proposals — Calibration" />

          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {CALIBRATION.stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="flex flex-col gap-1 bg-surface p-4"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.3,
                  delay: i * (reduceMotion ? 0 : 0.07),
                }}
              >
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                  {s.label}
                </span>
                <span className="font-display text-xl font-semibold tabular-nums">{s.value}</span>
                <span className="text-[0.7rem] text-muted">{s.note}</span>
              </motion.div>
            ))}
          </div>

          <ul className="divide-y divide-border border-t border-border">
            {CALIBRATION.rows.map((row, i) => (
              <motion.li
                key={row.title}
                className="flex items-center gap-3 p-3"
                initial={{ opacity: 0, x: reduceMotion ? 0 : -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.3,
                  delay: 0.3 + i * (reduceMotion ? 0 : 0.08),
                }}
              >
                <ScoreBadge score={row.score} />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{row.title}</p>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[0.65rem] ${STATUS_TONE[row.status]}`}
                >
                  {STATUS_LABEL[row.status]}
                </span>
                <span className="hidden shrink-0 font-mono text-[0.65rem] text-muted sm:inline">
                  {row.recommended ? "recommended" : "your own find"}
                </span>
              </motion.li>
            ))}
          </ul>

          <p className="border-t border-border bg-sunken px-4 py-3 text-xs leading-relaxed text-muted">
            {CALIBRATION.note}
          </p>
        </div>
      </div>
    </section>
  );
}
