"use client";

import { motion, useReducedMotion } from "motion/react";

import { PROFILE_DEMO } from "@/content/landing";
import { WindowChrome } from "./window-chrome";

/**
 * A coded replica of the real scoring surface from profile/page.tsx. Lighter motion than
 * BidConfirm and LiveQueue on purpose — the point here is that the controls are legible and
 * plain, not a demo to watch.
 */
export function ProfileTuner() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="lg:order-1">
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_0_rgba(16,24,32,0.02)]">
            <WindowChrome label="Profile — Matching" />

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted">
                  Skills
                </p>
                <ul className="space-y-1.5">
                  {PROFILE_DEMO.skills.map((skill, i) => (
                    <motion.li
                      key={skill.name}
                      className="flex items-center justify-between rounded-md border border-border bg-sunken px-2.5 py-1.5 font-mono text-xs"
                      initial={{ opacity: 0, x: reduceMotion ? 0 : -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{
                        duration: reduceMotion ? 0.01 : 0.3,
                        delay: i * (reduceMotion ? 0 : 0.08),
                      }}
                    >
                      <span>{skill.name}</span>
                      <span className="text-figure">{skill.weight}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted">
                  Score weights
                </p>
                <ul className="space-y-1.5">
                  {PROFILE_DEMO.weights.map((w, i) => (
                    <motion.li
                      key={w.label}
                      className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-xs"
                      initial={{ opacity: 0, x: reduceMotion ? 0 : 6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{
                        duration: reduceMotion ? 0.01 : 0.3,
                        delay: i * (reduceMotion ? 0 : 0.08),
                      }}
                    >
                      <span className="text-muted">{w.label}</span>
                      <span className="font-mono tabular-nums">{w.value}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 lg:order-2">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
            {PROFILE_DEMO.kicker}
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {PROFILE_DEMO.title}
          </h2>
          <p className="leading-relaxed text-muted">{PROFILE_DEMO.body}</p>
        </div>
      </div>
    </section>
  );
}
