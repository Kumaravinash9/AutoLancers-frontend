"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ScoreBadge } from "@/components/ui";
import { QUEUE_DEMO } from "@/content/landing";
import { Counter } from "./counter";
import { WindowDots } from "./window-chrome";

const STAGE = { idle: 0, rows: 1, selected: 2, reasons: 3, typing: 4, done: 5 } as const;

/**
 * The signature: a coded replica of the actual queue + job-detail screens, built from the same
 * tabs/rows/reasons shapes the real product uses — not a screenshot, and not decoration. It plays
 * once as a single sequence (rows in → select → score reasons → proposal typed out → copy) so the
 * whole pitch — discovery, transparency, drafting, control — reads as one continuous demo instead
 * of four separate claims.
 */
export function LiveQueue() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-100px" });
  const reduceMotion = useReducedMotion();
  const [animatedStage, setStage] = useState<number>(STAGE.idle);
  const [animatedTypedLength, setTypedLength] = useState(0);
  const [copied, setCopied] = useState(false);

  // Reduced motion has no timeline to run — the end state is a direct function of visibility,
  // computed during render, rather than something an effect needs to synchronize.
  const stage = reduceMotion ? (inView ? STAGE.done : STAGE.idle) : animatedStage;
  const typedLength = reduceMotion
    ? inView
      ? QUEUE_DEMO.proposal.length
      : 0
    : animatedTypedLength;

  useEffect(() => {
    if (!inView || reduceMotion) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let typingInterval: ReturnType<typeof setInterval> | undefined;
    const schedule = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    const rowsSettle = 150 + QUEUE_DEMO.rows.length * 90;
    const reasonsStart = rowsSettle + 400;
    const reasonsSettle = reasonsStart + QUEUE_DEMO.reasons.length * 130 + 300;

    schedule(150, () => setStage(STAGE.rows));
    schedule(rowsSettle, () => setStage(STAGE.selected));
    schedule(reasonsStart, () => setStage(STAGE.reasons));
    schedule(reasonsSettle, () => {
      setStage(STAGE.typing);
      let i = 0;
      typingInterval = setInterval(() => {
        i += 2;
        setTypedLength(Math.min(i, QUEUE_DEMO.proposal.length));
        if (i >= QUEUE_DEMO.proposal.length) {
          if (typingInterval) clearInterval(typingInterval);
          setStage(STAGE.done);
        }
      }, 16);
    });

    return () => {
      timers.forEach(clearTimeout);
      if (typingInterval) clearInterval(typingInterval);
    };
  }, [inView, reduceMotion]);

  const selected = QUEUE_DEMO.rows[QUEUE_DEMO.selectedIndex];
  const dur = reduceMotion ? 0.01 : 0.3;

  return (
    <div ref={containerRef} className="mx-auto max-w-6xl px-6">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_0_rgba(16,24,32,0.02)]">
        <div className="flex items-center gap-4 border-b border-border bg-sunken px-4 py-2.5">
          <WindowDots />
          <nav className="flex gap-4 font-mono text-xs">
            {QUEUE_DEMO.tabs.map((tab, i) => (
              <span key={tab} className={i === 0 ? "font-medium text-foreground" : "text-muted"}>
                {tab}
              </span>
            ))}
          </nav>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)]">
          <ul className="divide-y divide-border border-b border-border lg:border-b-0 lg:border-r">
            {QUEUE_DEMO.rows.map((row, i) => {
              const isSelected = stage >= STAGE.selected && i === QUEUE_DEMO.selectedIndex;
              return (
                <motion.li
                  key={row.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={stage >= STAGE.rows ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: dur, delay: reduceMotion ? 0 : i * 0.07 }}
                  className={`flex items-start gap-3 p-3 transition-colors duration-300 ${
                    isSelected ? "bg-accent-soft" : ""
                  }`}
                >
                  <ScoreBadge score={row.score} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.title}</p>
                    <p className="mt-0.5 truncate font-mono text-[0.7rem] text-muted">{row.meta}</p>
                  </div>
                </motion.li>
              );
            })}
          </ul>

          <div className="p-4 sm:p-5">
            <p className="truncate text-sm font-semibold">{selected.title}</p>

            <ul className="mt-3 space-y-1.5 text-sm">
              {QUEUE_DEMO.reasons.map((reason, i) => (
                <motion.li
                  key={reason.label}
                  className="flex gap-3"
                  initial={{ opacity: 0, x: reduceMotion ? 0 : -8 }}
                  animate={stage >= STAGE.reasons ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: dur, delay: reduceMotion ? 0 : i * 0.12 }}
                >
                  <span className="w-10 shrink-0 tabular-nums text-muted">
                    +
                    <Counter
                      value={reason.points}
                      active={stage >= STAGE.reasons}
                      reduceMotion={!!reduceMotion}
                    />
                  </span>
                  <span>
                    <strong className="font-medium">{reason.label}</strong>
                    <span className="text-muted"> — {reason.detail}</span>
                  </span>
                </motion.li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg border border-border bg-sunken p-3">
              <p className="proposal min-h-[5.5rem] text-sm leading-relaxed">
                {QUEUE_DEMO.proposal.slice(0, typedLength)}
                {stage === STAGE.typing && (
                  <span aria-hidden="true" className="animate-pulse">
                    ▍
                  </span>
                )}
              </p>
            </div>

            <div className="mt-3 h-9">
              <button
                type="button"
                onClick={() => setCopied(true)}
                disabled={stage < STAGE.done}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity duration-300 disabled:pointer-events-none disabled:opacity-0"
              >
                {copied ? "Copied" : "Copy proposal"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
