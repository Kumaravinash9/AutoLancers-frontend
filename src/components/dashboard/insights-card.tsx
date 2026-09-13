import Link from "next/link";
import { ReactNode } from "react";

import { DashCard, StaggerIn } from "@/components/app-ui";

const TONE = {
  warn: { badge: "bg-warn/15 text-warn", text: "text-warn" },
  good: { badge: "bg-good/15 text-good", text: "text-good" },
} as const;

function WarnIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l9 16H3z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  );
}
function GoodIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Insight({
  tone,
  icon,
  eyebrow,
  children,
  href,
  linkLabel,
}: {
  tone: keyof typeof TONE;
  icon: ReactNode;
  eyebrow: string;
  children: ReactNode;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="group flex gap-3 border-b border-border py-3.5 first:pt-0 last:border-0 last:pb-0">
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${TONE[tone].badge}`}>{icon}</div>
      <div className="min-w-0 text-sm">
        <p className="leading-relaxed text-foreground">
          <span className={`font-semibold ${TONE[tone].text}`}>{eyebrow}</span> — {children}
        </p>
        <Link
          href={href}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors group-hover:text-accent"
        >
          {linkLabel}
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * No endpoint generates these — there's no LLM-driven insight feature in the backend today, so
 * the sentences are fixed content. The links underneath aren't: each one goes to the real page
 * that would let you act on it.
 */
export function InsightsCard() {
  return (
    <StaggerIn index={4} className="h-full">
      <DashCard className="h-full p-5!">
        <h2 className="font-display text-lg font-semibold tracking-tight">Insights</h2>
        <div className="mt-1">
          <Insight tone="warn" icon={<WarnIcon />} eyebrow="Budget" href="/settings" linkLabel="Review budget">
            LLM spend is at 85% of this cycle&apos;s cap. Drafting pauses automatically if it&apos;s
            reached.
          </Insight>
          <Insight tone="good" icon={<GoodIcon />} eyebrow="Trending well" href="/proposals" linkLabel="See calibration">
            Proposal acceptance is up since you tightened the budget-floor filter.
          </Insight>
        </div>
      </DashCard>
    </StaggerIn>
  );
}
