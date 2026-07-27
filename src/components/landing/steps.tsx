"use client";

import { motion, useReducedMotion } from "motion/react";

import { STEPS, STEPS_INTRO } from "@/content/landing";

/** Numbered rows with a large faded index, a title, and a full sentence beside it — matches how
 *  a real ordered sequence reads (order carries information here: you can't connect before you
 *  have an account), rather than a card grid. */
export function Steps() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="steps" className="scroll-mt-20 border-b border-border px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
          {STEPS_INTRO.kicker}
        </span>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {STEPS_INTRO.title}
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">{STEPS_INTRO.subhead}</p>

        <ol className="mt-10 border-t border-border">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-6 gap-y-2 border-b border-border py-6 sm:grid-cols-[3rem_14rem_1fr]"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: reduceMotion ? 0.01 : 0.35, delay: i * (reduceMotion ? 0 : 0.08) }}
            >
              <span className="font-display text-2xl font-semibold text-muted/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="col-span-2 leading-relaxed text-muted sm:col-span-1">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
