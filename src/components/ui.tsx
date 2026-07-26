"use client";

import { ReactNode } from "react";

/** Standard content column. The root layout is full-bleed so the marketing page can run edge to
 *  edge, which means every app screen sets its own width and padding. */
export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-5xl px-6 py-8 ${className}`}>{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-4 ${className}`}>{children}</div>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
};

export function Button({
  children,
  onClick,
  variant = "secondary",
  disabled,
  type = "button",
  title,
}: ButtonProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-accent text-white hover:opacity-90",
    secondary: "border border-border bg-surface hover:bg-accent-soft",
    ghost: "text-muted hover:text-foreground",
  }[variant];

  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

/** Score pill. Colour is a coarse signal only — the reasons list is the real explanation. */
export function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 75
      ? "bg-good/15 text-good"
      : score >= 55
        ? "bg-warn/15 text-warn"
        : "bg-muted/15 text-muted";
  return (
    <span className={`rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ${tone}`}>
      {score.toFixed(0)}
    </span>
  );
}

export function StatusChip({ status }: { status: string }) {
  return (
    <span className="rounded-md border border-border px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
      {status}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {hint && <span className="mb-1 block text-xs text-muted">{hint}</span>}
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent";

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-accent/40 bg-accent-soft px-3 py-2 text-sm">
      {children}
    </div>
  );
}


/** Which marketplace a posting came from. Meaningless with one platform; essential with two. */
export function PlatformTag({ platform }: { platform: string }) {
  const label = platform === "freelancer" ? "Freelancer.com" : platform;
  return (
    <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide text-muted">
      {label}
    </span>
  );
}
