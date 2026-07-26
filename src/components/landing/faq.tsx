"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { FAQ, FAQ_INTRO } from "@/content/landing";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="scroll-mt-20 border-b border-border px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
            {FAQ_INTRO.kicker}
          </span>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-balance">
            {FAQ_INTRO.title}
          </h2>
          <p className="mt-2 max-w-sm leading-relaxed text-muted">{FAQ_INTRO.body}</p>
        </div>

        <ul className="divide-y divide-border border-t border-border lg:border-t-0">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.question} className={isOpen ? "-mx-4 rounded-lg bg-sunken px-4" : ""}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="font-display font-medium tracking-tight">{item.question}</span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 font-mono text-lg text-muted transition-transform ${isOpen ? "rotate-45" : ""}`}
                  >
                    +
                  </span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-4 leading-relaxed text-muted">{item.answer}</p>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
