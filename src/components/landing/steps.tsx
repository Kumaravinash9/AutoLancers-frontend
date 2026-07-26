"use client";

import { motion, useReducedMotion } from "motion/react";

import { STEPS } from "@/content/landing";

const ICONS = [
  // account
  <path key="a" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" strokeLinecap="round" strokeLinejoin="round" />,
  // connect
  <path key="b" d="M9 12h6M8 8V6a2 2 0 0 1 2-2h1M16 8V6a2 2 0 0 0-2-2h-1M8 16v2a2 2 0 0 0 2 2h1M16 16v2a2 2 0 0 1-2 2h-1" strokeLinecap="round" strokeLinejoin="round" />,
  // describe
  <path key="c" d="M5 6h9M5 12h14M5 18h9" strokeLinecap="round" />,
  // review
  <path key="d" d="M5 12.5l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />,
];

/** The one other dark band on the page (alongside Close) — a real, ordered sequence, drawn as a
 *  rail that fills in as it enters view, rather than a plain feature grid. */
export function Steps() {
  const reduceMotion = useReducedMotion();
  const lineDuration = reduceMotion ? 0.01 : 1.1;

  return (
    <section id="steps" className="scroll-mt-20 border-b border-border bg-deep px-6 py-16 text-deep-fg">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-deep-muted">
          Getting set up
        </h2>

        <ol className="relative mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            aria-hidden="true"
            style={{ originX: 0 }}
            className="absolute inset-x-0 top-4 hidden h-px bg-figure/40 lg:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: lineDuration, ease: "easeInOut" }}
          />
          {STEPS.map((s, i) => {
            const delay = reduceMotion ? 0 : (i / STEPS.length) * lineDuration;
            return (
              <li key={s.title} className="relative flex flex-col gap-3">
                <motion.span
                  className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-figure bg-deep text-figure"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.3, delay }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    {ICONS[i]}
                  </svg>
                </motion.span>
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.3, delay: delay + 0.1 }}
                  className="flex flex-col gap-1.5"
                >
                  <h3 className="font-display font-semibold tracking-tight">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-deep-muted">{s.body}</p>
                </motion.div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
