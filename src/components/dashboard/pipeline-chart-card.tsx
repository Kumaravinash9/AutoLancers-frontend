"use client";

import { useId, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { DashCard, StaggerIn } from "@/components/app-ui";
import { DEMO_PIPELINE_DRAFTED, DEMO_PIPELINE_MONTHS, DEMO_PIPELINE_SCORED } from "@/lib/demo-data";

const WIDTH = 560;
const HEIGHT = 200;
const PAD_L = 30;
const PAD_R = 34;
const PAD_T = 16;
const PAD_B = 24;

function buildLine(values: number[], max: number): string {
  const step = (WIDTH - PAD_L - PAD_R) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = PAD_L + i * step;
      const y = HEIGHT - PAD_B - (v / max) * (HEIGHT - PAD_T - PAD_B);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

function buildArea(values: number[], max: number): string {
  const step = (WIDTH - PAD_L - PAD_R) / (values.length - 1);
  const line = buildLine(values, max);
  const lastX = PAD_L + (values.length - 1) * step;
  return `${line} L${lastX},${HEIGHT - PAD_B} L${PAD_L},${HEIGHT - PAD_B} Z`;
}

function xForIndex(i: number): number {
  return PAD_L + i * ((WIDTH - PAD_L - PAD_R) / (DEMO_PIPELINE_MONTHS.length - 1));
}

function yForValue(v: number, max: number): number {
  return HEIGHT - PAD_B - (v / max) * (HEIGHT - PAD_T - PAD_B);
}

function LegendKey({ color, children }: { color: string; children: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
        <line x1="0" y1="4" x2="12" y2="4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </svg>
      {children}
    </span>
  );
}

export function PipelineChartCard() {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const max = Math.max(...DEMO_PIPELINE_SCORED, ...DEMO_PIPELINE_DRAFTED) * 1.15;
  const scoredLine = buildLine(DEMO_PIPELINE_SCORED, max);
  const draftedLine = buildLine(DEMO_PIPELINE_DRAFTED, max);
  const scoredArea = buildArea(DEMO_PIPELINE_SCORED, max);
  const draftedArea = buildArea(DEMO_PIPELINE_DRAFTED, max);
  const step = (WIDTH - PAD_L - PAD_R) / (DEMO_PIPELINE_MONTHS.length - 1);
  const lastIndex = DEMO_PIPELINE_MONTHS.length - 1;

  const drawn = reduceMotion || inView;
  const dur = reduceMotion ? 0.01 : 1;

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const i = Math.round((px - PAD_L) / step);
    setHoverIndex(Math.max(0, Math.min(lastIndex, i)));
  }

  const tipLeftPct = hoverIndex !== null ? (xForIndex(hoverIndex) / WIDTH) * 100 : 0;
  const tipTopPct =
    hoverIndex !== null
      ? (Math.min(yForValue(DEMO_PIPELINE_SCORED[hoverIndex], max), yForValue(DEMO_PIPELINE_DRAFTED[hoverIndex], max)) /
          HEIGHT) *
        100
      : 0;

  return (
    <StaggerIn index={3} className="h-full">
      <DashCard className="h-full space-y-4 p-5!">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">Pipeline volume</h2>
            <p className="mt-0.5 text-xs text-muted">Jobs scored vs. proposals drafted, monthly</p>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs text-muted">
            <LegendKey color="var(--chart-scored)">Scored</LegendKey>
            <LegendKey color="var(--chart-drafted)">Drafted</LegendKey>
          </div>
        </div>

        <div ref={wrapRef} className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            role="img"
            aria-label={`Jobs scored versus drafted, by month. Latest: ${DEMO_PIPELINE_SCORED[lastIndex]} scored, ${DEMO_PIPELINE_DRAFTED[lastIndex]} drafted.`}
          >
            <defs>
              <linearGradient id={`${gradientId}-scored`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-scored)" stopOpacity={0.16} />
                <stop offset="100%" stopColor="var(--chart-scored)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`${gradientId}-drafted`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-drafted)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--chart-drafted)" stopOpacity={0} />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map((f) => {
              const y = PAD_T + f * (HEIGHT - PAD_T - PAD_B);
              return <line key={f} x1={PAD_L} x2={WIDTH - PAD_R} y1={y} y2={y} className="stroke-border" strokeWidth={1} />;
            })}

            <motion.path
              d={scoredArea}
              fill={`url(#${gradientId}-scored)`}
              initial={{ opacity: 0 }}
              animate={{ opacity: drawn ? 1 : 0 }}
              transition={{ duration: dur, delay: reduceMotion ? 0 : 0.4 }}
            />
            <motion.path
              d={draftedArea}
              fill={`url(#${gradientId}-drafted)`}
              initial={{ opacity: 0 }}
              animate={{ opacity: drawn ? 1 : 0 }}
              transition={{ duration: dur, delay: reduceMotion ? 0 : 0.4 }}
            />

            <motion.path
              d={scoredLine}
              fill="none"
              stroke="var(--chart-scored)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: drawn ? 1 : 0 }}
              transition={{ duration: dur, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.path
              d={draftedLine}
              fill="none"
              stroke="var(--chart-drafted)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: drawn ? 1 : 0 }}
              transition={{ duration: dur, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* End markers + direct labels — "lines end with their value" rather than making
                the reader trace back to an axis. */}
            <circle
              cx={xForIndex(lastIndex)}
              cy={yForValue(DEMO_PIPELINE_SCORED[lastIndex], max)}
              r={3.5}
              fill="var(--chart-scored)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
            <text
              x={xForIndex(lastIndex) + 6}
              y={yForValue(DEMO_PIPELINE_SCORED[lastIndex], max) - 6}
              className="fill-foreground font-mono font-medium"
              fontSize={10}
            >
              {DEMO_PIPELINE_SCORED[lastIndex]}
            </text>
            <circle
              cx={xForIndex(lastIndex)}
              cy={yForValue(DEMO_PIPELINE_DRAFTED[lastIndex], max)}
              r={3.5}
              fill="var(--chart-drafted)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
            <text
              x={xForIndex(lastIndex) + 6}
              y={yForValue(DEMO_PIPELINE_DRAFTED[lastIndex], max) + 12}
              className="fill-foreground font-mono font-medium"
              fontSize={10}
            >
              {DEMO_PIPELINE_DRAFTED[lastIndex]}
            </text>

            {DEMO_PIPELINE_MONTHS.map((m, i) => (
              <text key={m} x={PAD_L + i * step} y={HEIGHT - 6} textAnchor="middle" className="fill-muted font-mono" fontSize={9}>
                {m}
              </text>
            ))}

            {hoverIndex !== null && (
              <>
                <line
                  x1={xForIndex(hoverIndex)}
                  x2={xForIndex(hoverIndex)}
                  y1={PAD_T}
                  y2={HEIGHT - PAD_B}
                  className="stroke-muted"
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
                <circle
                  cx={xForIndex(hoverIndex)}
                  cy={yForValue(DEMO_PIPELINE_SCORED[hoverIndex], max)}
                  r={4}
                  fill="var(--chart-scored)"
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
                <circle
                  cx={xForIndex(hoverIndex)}
                  cy={yForValue(DEMO_PIPELINE_DRAFTED[hoverIndex], max)}
                  r={4}
                  fill="var(--chart-drafted)"
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              </>
            )}

            {/* Transparent hit layer sized to the whole plot area, on top so hover tracks the
                nearest month regardless of where between the two lines the cursor sits. */}
            <rect
              x={PAD_L}
              y={PAD_T}
              width={WIDTH - PAD_L - PAD_R}
              height={HEIGHT - PAD_T - PAD_B}
              fill="transparent"
              onMouseMove={handleMove}
              onMouseLeave={() => setHoverIndex(null)}
            />
          </svg>

          {hoverIndex !== null && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-(--shadow-lg)"
              style={{ left: `${tipLeftPct}%`, top: `${tipTopPct}%` }}
            >
              <p className="font-semibold">{DEMO_PIPELINE_MONTHS[hoverIndex]}</p>
              <p className="mt-1 flex items-center justify-between gap-3 whitespace-nowrap">
                <span className="flex items-center gap-1.5 text-background/70">
                  <span className="h-1.5 w-3 rounded-full" style={{ background: "var(--chart-scored)" }} />
                  Scored
                </span>
                <span className="font-mono font-semibold tabular-nums">{DEMO_PIPELINE_SCORED[hoverIndex]}</span>
              </p>
              <p className="mt-0.5 flex items-center justify-between gap-3 whitespace-nowrap">
                <span className="flex items-center gap-1.5 text-background/70">
                  <span className="h-1.5 w-3 rounded-full" style={{ background: "var(--chart-drafted)" }} />
                  Drafted
                </span>
                <span className="font-mono font-semibold tabular-nums">{DEMO_PIPELINE_DRAFTED[hoverIndex]}</span>
              </p>
            </div>
          )}
        </div>
      </DashCard>
    </StaggerIn>
  );
}
