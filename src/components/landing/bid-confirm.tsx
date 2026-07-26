"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { BID_CONFIRM } from "@/content/landing";
import { WindowChrome } from "./window-chrome";

const STAGE = { idle: 0, filled: 1, armed: 2, confirmed: 3 } as const;

/**
 * The real double-confirmation bid flow from jobs/[id]/page.tsx's BidPanel, replayed as its own
 * large section — same window-chrome language as LiveQueue, so it reads as part of the same
 * family rather than a separate gimmick. The friction (arm, then confirm the exact numbers) is
 * the whole point of "Control," so it's shown happening, not just described.
 */
export function BidConfirm() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduceMotion = useReducedMotion();
  const [animatedStage, setStage] = useState<number>(STAGE.idle);

  const stage = reduceMotion ? (inView ? STAGE.confirmed : STAGE.idle) : animatedStage;

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    schedule(300, () => setStage(STAGE.filled));
    schedule(1400, () => setStage(STAGE.armed));
    schedule(3200, () => setStage(STAGE.confirmed));

    return () => timers.forEach(clearTimeout);
  }, [inView, reduceMotion]);

  return (
    <section className="border-b border-border px-6 py-16">
      <div
        ref={containerRef}
        className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.1fr]"
      >
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-accent">
            {BID_CONFIRM.kicker}
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {BID_CONFIRM.title}
          </h2>
          <p className="leading-relaxed text-muted">{BID_CONFIRM.body}</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_0_rgba(16,24,32,0.02)]">
          <WindowChrome label={`${BID_CONFIRM.jobTitle} — Place a bid`} />

          <div className="p-5">
            {stage < STAGE.confirmed ? (
              <>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs text-muted">
                      Amount ({BID_CONFIRM.currency})
                    </span>
                    <div className="w-28 rounded-md border border-border bg-surface px-3 py-1.5 text-sm tabular-nums">
                      {stage >= STAGE.filled ? BID_CONFIRM.amount : ""}
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-muted">Delivery (days)</span>
                    <div className="w-20 rounded-md border border-border bg-surface px-3 py-1.5 text-sm tabular-nums">
                      {stage >= STAGE.filled ? BID_CONFIRM.days : ""}
                    </div>
                  </label>
                </div>

                <div className="mt-4 min-h-18">
                  {stage >= STAGE.armed ? (
                    <motion.div
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduceMotion ? 0.01 : 0.3 }}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <span className="text-sm">
                        Send this proposal and bid {BID_CONFIRM.amount} {BID_CONFIRM.currency} over{" "}
                        {BID_CONFIRM.days} days?
                      </span>
                      <span className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white">
                        Yes, place the bid
                      </span>
                      <span className="rounded-md px-3 py-1.5 text-sm text-muted">Cancel</span>
                    </motion.div>
                  ) : (
                    <span className="inline-flex rounded-md border border-border px-3 py-1.5 text-sm text-muted">
                      Place bid…
                    </span>
                  )}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.3 }}
                className="rounded-lg border border-good/40 bg-accent-soft p-3"
              >
                <p className="text-sm">
                  Bid placed for{" "}
                  <strong>
                    {BID_CONFIRM.amount} {BID_CONFIRM.currency}
                  </strong>{" "}
                  over {BID_CONFIRM.days} days.
                </p>
                <p className="mt-1 text-xs text-muted">
                  This submits to Freelancer.com and cannot be undone from here — which is why it
                  waited for you twice.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
