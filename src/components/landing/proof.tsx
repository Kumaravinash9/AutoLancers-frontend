"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { PROOF } from "@/content/landing";
import { Counter } from "./counter";

// Illustrative shape only (a listing's bid count climbing over ~2 hours) — not plotted data.
const CLIMB = [4, 6, 9, 14, 19, 24, 31, 40];

function Sparkline({ inView, reduceMotion }: { inView: boolean; reduceMotion: boolean }) {
  const max = CLIMB[CLIMB.length - 1];
  const barWidth = 8;
  const gap = 5;
  return (
    <svg
      width={CLIMB.length * (barWidth + gap)}
      height={40}
      aria-hidden="true"
      className="shrink-0"
    >
      {CLIMB.map((v, i) => {
        const h = (v / max) * 34;
        return (
          <motion.rect
            key={i}
            x={i * (barWidth + gap)}
            width={barWidth}
            rx={2}
            className={i === CLIMB.length - 1 ? "fill-figure" : "fill-border"}
            initial={{ y: 40 - 3, height: 3 }}
            animate={inView ? { y: 40 - h, height: h } : {}}
            transition={{
              duration: reduceMotion ? 0.01 : 0.4,
              delay: reduceMotion ? 0 : 0.4 + i * 0.05,
              ease: "easeOut",
            }}
          />
        );
      })}
    </svg>
  );
}

/** The "problem" moment both reference sites open with — dramatized as a pull-quote rather than
 *  a boxed stat card, since the point is to be felt in one line, not scanned. */
export function Proof() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-b border-border px-6 py-20">
      <div ref={ref} className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <motion.p
          className="font-display text-3xl font-medium leading-snug tracking-tight text-balance sm:text-4xl"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.01 : 0.4 }}
        >
          &ldquo;A typical Freelancer.com listing passes{" "}
          <span className="whitespace-nowrap text-accent">
            <Counter value={PROOF.figure} active={inView} reduceMotion={!!reduceMotion} duration={1} />
            + bids
          </span>{" "}
          inside two hours.&rdquo;
        </motion.p>

        <p className="max-w-xl leading-relaxed text-muted">{PROOF.context}</p>

        <motion.p
          className="max-w-lg border-l-2 border-accent/40 pl-4 text-left font-display italic leading-snug text-balance"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.01 : 0.4, delay: reduceMotion ? 0 : 0.3 }}
        >
          {PROOF.callout}
        </motion.p>

        <Sparkline inView={inView} reduceMotion={!!reduceMotion} />
      </div>
    </section>
  );
}
