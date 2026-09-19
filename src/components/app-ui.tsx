"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";

/**
 * Shared visual primitives for every signed-in app screen (dashboard, queue, proposals,
 * profiles, settings, analytics) — the flat/no-shadow card language and mini-charts the
 * dashboard redesign introduced, generalized past their original dashboard-only scope so the
 * rest of the app doesn't fall back to the plain bordered `Card` in `components/ui.tsx`.
 */

/**
 * Replaces the plain bordered `Card`. A hairline ring instead of a solid border, flat, no
 * shadow, no hover state — nothing here competes for attention. An optional accent wash marks
 * the one tile on a page meant to read as "the" hero.
 *
 * Clips overflow by default so the `tint` wash never bleeds past the rounded corners — pass
 * `allowOverflow` for a card that needs to show something outside its own bounds on purpose
 * (a hover tooltip, an open dropdown), so that content floats over the page instead of being
 * silently cut off at the card edge.
 */
export function DashCard({
  children,
  className = "",
  tint = false,
  id,
  allowOverflow = false,
}: {
  children: ReactNode;
  className?: string;
  tint?: boolean;
  id?: string;
  allowOverflow?: boolean;
}) {
  return (
    <div
      id={id}
      className={`relative ${allowOverflow ? "" : "overflow-hidden"} rounded-2xl bg-surface ring-1 ring-border/60 ${className}`}
    >
      {tint && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-linear-to-br from-accent-soft via-transparent to-transparent opacity-80"
        />
      )}
      {children}
    </div>
  );
}

/** Staggers its children in on mount (fade + rise), the same rhythm LiveQueue/Glance use on
 *  the marketing site. `index` sets each item's place in the sequence. */
export function StaggerIn({
  children,
  index = 0,
  className = "",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.4, delay: reduceMotion ? 0 : index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * The one label/value/caption stat tile, used anywhere a page needs a small grid of headline
 * numbers (Proposals' stat row, Finance's earnings cells, Analytics' range-scoped strip) — one
 * definition so they can't quietly drift into three slightly different tiles.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  caption,
  tint = false,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  caption: string;
  tint?: boolean;
}) {
  return (
    <DashCard tint={tint} className="p-5">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {Icon && <Icon size={14} />}
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      <p className="mt-2 text-xs text-muted">{caption}</p>
    </DashCard>
  );
}

export function StatTileSkeleton() {
  return (
    <DashCard className="p-5">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton mt-3 h-8 w-16 rounded" />
      <div className="skeleton mt-3 h-3 w-32 rounded" />
    </DashCard>
  );
}

/**
 * A compact circular progress ring — the same 0–100 value a `Meter` shows, drawn as an arc
 * instead of a bar for the cells where a bento layout gives a metric enough width to read as a
 * shape rather than just a number. One flat accent stroke, no gradient or glow.
 */
export function Ring({
  value,
  max = 100,
  size = 80,
  stroke = 8,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
}) {
  const reduceMotion = useReducedMotion();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = Math.max(0, Math.min(1, value / max));

  return (
    <div className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - fraction) }}
          transition={{ duration: reduceMotion ? 0.01 : 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span
        className="absolute font-display font-semibold tabular-nums"
        style={{ fontSize: size * 0.28 }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}

/**
 * A labeled progress bar — the fill carries the value, the track is a lighter step of the same
 * ramp so the state reads across the whole bar, not just the filled tip. No sweep-in animation:
 * the bar is just drawn at its resting width, same as any other stat on the page.
 */
export function Meter({ value, max = 100 }: { value: number; max?: number }) {
  const fraction = Math.max(0, Math.min(1, value / max));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-accent-soft" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-full rounded-full bg-accent" style={{ width: `${fraction * 100}%` }} />
    </div>
  );
}

/** A 12-point trend line for a stat tile — the muted hue for history, the accent for the
 *  current point, no axes or gridlines (the number beside it already carries the value). */
export function Sparkline({
  values,
  width = 96,
  height = 32,
  positive = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  if (values.length < 2) return null;

  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = (width - pad * 2) / (values.length - 1);

  const coords = values.map((v, i) => ({
    x: pad + i * step,
    y: pad + (1 - (v - min) / span) * (height - pad * 2),
  }));
  const linePath = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x},${height} L${coords[0].x},${height} Z`;
  const last = coords[coords.length - 1];
  const tone = positive ? "var(--good)" : "var(--warn)";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
      <path d={areaPath} fill={tone} opacity={0.08} />
      <motion.path
        d={linePath}
        fill="none"
        stroke={tone}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.8, ease: "easeOut" }}
      />
      <circle cx={last.x} cy={last.y} r={2.5} fill={tone} stroke="var(--surface)" strokeWidth={1.5} />
    </svg>
  );
}

/** One row of a single-series magnitude comparison — label above, thin rounded bar, value
 *  directly labeled at the end (a single series needs no legend, so the bar's own color is
 *  purely a mark, not an identity channel). Width is relative to `max` across the whole list,
 *  passed in by the caller so bars compare correctly against each other. */
export function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const reduceMotion = useReducedMotion();
  const fraction = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-foreground">{label}</span>
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted">{value}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken">
        <motion.div
          className="h-full rounded-full bg-figure"
          initial={{ width: 0 }}
          animate={{ width: `${fraction * 100}%` }}
          transition={{ duration: reduceMotion ? 0.01 : 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
