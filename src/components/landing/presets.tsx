"use client";

import { motion, useReducedMotion } from "motion/react";

import { PRESETS } from "@/content/landing";

/**
 * There's no one-click "mode" behind these — see PRESETS' doc comment in content/landing.ts.
 * Each card is a labeled example of the same four sliders shown in ProfileTuner, set three
 * different ways, with the real weight labels as the "weighted toward" tag rather than
 * invented factors.
 */
export function Presets() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
          {PRESETS.kicker}
        </span>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {PRESETS.title}
        </h2>
        <p className="mt-2 max-w-xl leading-relaxed text-muted">{PRESETS.subhead}</p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_1fr] lg:grid-rows-2">
          {PRESETS.items.map((item, i) => (
            <motion.div
              key={item.label}
              className={`flex flex-col justify-center gap-3 rounded-xl border border-border bg-surface p-6 sm:p-7 ${
                item.size === "large" ? "lg:row-span-2" : ""
              }`}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: reduceMotion ? 0.01 : 0.35, delay: i * (reduceMotion ? 0 : 0.08) }}
            >
              <p className="font-display text-lg font-semibold tracking-tight">{item.label}</p>
              <p className="font-medium text-accent">{item.hook}</p>
              <p className="leading-relaxed text-muted">{item.body}</p>
              <p className="font-mono text-xs text-muted">
                Weighted toward: <span className="text-figure">{item.weightedToward.join(" · ")}</span>
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
