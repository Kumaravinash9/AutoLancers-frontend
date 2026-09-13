"use client";

import { ReactNode } from "react";

import { StaggerIn } from "@/components/app-ui";

export interface SummaryMetric {
  label: string;
  value: string;
  caption: string;
}

function Metric({ label, value, caption }: SummaryMetric) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-deep-muted">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-deep-muted">{caption}</p>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4">
      <div className="h-2.5 w-20 rounded bg-white/10" />
      <div className="mt-2.5 h-6 w-14 rounded bg-white/10" />
      <div className="mt-2 h-2.5 w-24 rounded bg-white/10" />
    </div>
  );
}

/**
 * The one dark band, reused everywhere a page needs to say "here's what the pipeline just did
 * for you" — the dashboard's "Today's match" and the Queue page's "AI summary" are the same
 * component with different metrics, so the pattern reads as one signature, not two look-alikes
 * that quietly drift apart. Navy + dot-grid texture, same motif the marketing page's dark
 * section already uses — no new gradient invented for this.
 */
export function AiSummaryBand({
  title,
  subtitle,
  metrics,
  loading = false,
  skeletonCount = 4,
  index = 0,
  action,
}: {
  title: string;
  subtitle: string;
  metrics: SummaryMetric[];
  loading?: boolean;
  skeletonCount?: number;
  index?: number;
  action?: ReactNode;
}) {
  return (
    <StaggerIn index={index}>
      <div className="relative overflow-hidden rounded-2xl bg-deep p-5 text-deep-fg sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle, var(--deep-fg) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold tracking-tight">{title}</p>
              <p className="mt-0.5 text-sm text-deep-muted">{subtitle}</p>
            </div>
            {action}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: skeletonCount }).map((_, i) => <MetricSkeleton key={i} />)
              : metrics.map((m) => <Metric key={m.label} {...m} />)}
          </div>
        </div>
      </div>
    </StaggerIn>
  );
}
