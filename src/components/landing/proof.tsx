"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { PROOF } from "@/content/landing";
import { Counter } from "./counter";

// Illustrative shape only (a listing's bid count climbing over ~2 hours) — not plotted data.
const CLIMB = [4, 6, 9, 14, 19, 24, 31, 40];

function Sparkline({ inView, reduceMotion }: { inView: boolean; reduceMotion: boolean }) {
  const max = CLIMB[CLIMB.length - 1];
  const barWidth = 10;
  const gap = 6;
  return (
    <svg
      width={CLIMB.length * (barWidth + gap)}
      height={56}
      aria-hidden="true"
      className="shrink-0"
    >
      {CLIMB.map((v, i) => {
        const h = (v / max) * 48;
        return (
          <motion.rect
            key={i}
            x={i * (barWidth + gap)}
            width={barWidth}
            rx={2}
            className={i === CLIMB.length - 1 ? "fill-figure" : "fill-border"}
            initial={{ y: 56 - 4, height: 4 }}
            animate={inView ? { y: 56 - h, height: h } : {}}
            transition={{
              duration: reduceMotion ? 0.01 : 0.4,
              delay: reduceMotion ? 0 : 0.15 + i * 0.05,
              ease: "easeOut",
            }}
          />
        );
      })}
    </svg>
  );
}

export function Proof() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-b border-border px-6 py-16">
      <div
        ref={ref}
        className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-xl border border-border bg-surface p-8 sm:flex-row sm:items-center sm:gap-10"
      >
        <motion.p
          className="shrink-0 font-display text-5xl font-semibold tabular-nums tracking-tight text-accent sm:text-6xl"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.01 : 0.4 }}
        >
          <Counter value={PROOF.figure} active={inView} reduceMotion={!!reduceMotion} duration={1} />
          <span className="text-2xl text-muted sm:text-3xl">+</span>
        </motion.p>
        <Sparkline inView={inView} reduceMotion={!!reduceMotion} />
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{PROOF.unit}</p>
          <p className="mt-1.5 leading-relaxed text-balance">{PROOF.context}</p>
        </div>
      </div>
    </section>
  );
}
