"use client";

import { motion, useReducedMotion } from "motion/react";

import { PLATFORMS } from "@/content/landing";

export function Platforms() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="platforms" className="scroll-mt-20 border-b border-border px-6 py-14">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
            {PLATFORMS.kicker}
          </span>
          <h2 className="font-display text-xl font-semibold tracking-tight text-balance sm:text-2xl">
            {PLATFORMS.title}
          </h2>
          <p className="max-w-md leading-relaxed text-muted">{PLATFORMS.body}</p>
        </div>

        <ul className="flex flex-wrap gap-2.5 lg:justify-end">
          {PLATFORMS.items.map((item, i) => {
            const live = item.status === "live";
            return (
              <motion.li
                key={item.name}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: reduceMotion ? 0.01 : 0.3, delay: i * (reduceMotion ? 0 : 0.06) }}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm ${
                  live
                    ? "border border-accent/30 bg-accent-soft text-accent"
                    : "border border-dashed border-border text-muted"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${live ? "bg-accent" : "bg-border"}`}
                  aria-hidden="true"
                />
                {item.name}
                {!live && <span className="font-mono text-[0.65rem] uppercase text-muted">next</span>}
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
