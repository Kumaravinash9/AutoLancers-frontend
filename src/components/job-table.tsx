"use client";

import Link from "next/link";

import { Empty, PlatformTag, ScoreBadge } from "@/components/ui";
import { formatBudget, Job } from "@/lib/api";

export interface JobBadge {
  label: string;
  tone?: "good" | "warn" | "muted";
}

const BADGE_TONE: Record<NonNullable<JobBadge["tone"]>, string> = {
  good: "bg-good/15 text-good",
  warn: "bg-warn/15 text-warn",
  muted: "bg-sunken text-muted",
};

function RowSkeleton() {
  return (
    <tr>
      <td className="py-3 pr-3">
        <div className="skeleton h-6 w-10 rounded-md" />
      </td>
      <td className="py-3 pr-3">
        <div className="skeleton h-4 w-48 rounded" />
      </td>
      <td className="py-3 pr-3">
        <div className="skeleton h-4 w-20 rounded" />
      </td>
      <td className="py-3 pr-3">
        <div className="skeleton h-4 w-16 rounded" />
      </td>
      <td className="py-3 pr-3">
        <div className="skeleton h-4 w-16 rounded" />
      </td>
      <td className="py-3" />
    </tr>
  );
}

function StatusCell({ job }: { job: Job }) {
  if (job.rejected) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded bg-warn/15 px-1.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-warn"
        title={job.rejection_reason ?? undefined}
      >
        Rejected
      </span>
    );
  }
  if (job.proposal_text) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-good/15 px-1.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-good">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Draft ready
      </span>
    );
  }
  return (
    <span className="rounded bg-sunken px-1.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted">
      Matched
    </span>
  );
}

/**
 * The one job-list table shape, shared by the dashboard's "Needs your review" card and the
 * full Queue page — both list the same `Job` rows with the same columns, so this is the single
 * place that markup lives rather than two copies drifting apart. `variant="reason"` swaps the
 * Status column for the actual rejection reason text — used by Queue's "Rejected" tab, where
 * every row is rejected already so repeating a "Rejected" pill on each one says nothing new.
 */
export function JobTable({
  jobs,
  loading = false,
  skeletonRows = 4,
  emptyMessage = "Nothing here.",
  variant = "status",
  getBadges,
}: {
  jobs: Job[];
  loading?: boolean;
  skeletonRows?: number;
  emptyMessage?: string;
  variant?: "status" | "reason";
  /** Optional quick-scan tags (e.g. "Low competition") rendered under the title — only the
   *  Queue page passes these today; the dashboard's compact rest-of-list stays plain. */
  getBadges?: (job: Job) => JobBadge[];
}) {
  if (!loading && jobs.length === 0) {
    return <Empty>{emptyMessage}</Empty>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 table-fixed text-sm">
        <colgroup>
          <col className="w-14" />
          <col className={variant === "reason" ? "w-56" : ""} />
          <col className="w-32" />
          <col className="w-32" />
          <col className={variant === "reason" ? "" : "w-28"} />
          <col className="w-16" />
        </colgroup>
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
            <th className="pb-2 font-medium">Score</th>
            <th className="pb-2 font-medium">Job</th>
            <th className="pb-2 font-medium">Platform</th>
            <th className="pb-2 font-medium">Budget</th>
            <th className="pb-2 font-medium">{variant === "reason" ? "Why it was filtered out" : "Status"}</th>
            <th className="pb-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => <RowSkeleton key={i} />)
            : jobs.map((job) => (
                <tr key={job.id} className="group relative transition-colors hover:bg-sunken">
                  <td className="py-3 pr-3">
                    <ScoreBadge score={job.score} />
                  </td>
                  <td className="py-3 pr-3">
                    <span className="block truncate font-medium">{job.title || "(untitled)"}</span>
                    {getBadges && getBadges(job).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {getBadges(job).map((b) => (
                          <span
                            key={b.label}
                            className={`rounded px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${BADGE_TONE[b.tone ?? "muted"]}`}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <PlatformTag platform={job.platform} />
                  </td>
                  <td className="truncate py-3 pr-3 font-mono text-xs tabular-nums">{formatBudget(job)}</td>
                  <td className="py-3 pr-3">
                    {variant === "reason" ? (
                      <span className="block truncate text-xs text-muted" title={job.rejection_reason ?? undefined}>
                        {job.rejection_reason ?? "—"}
                      </span>
                    ) : (
                      <span className="whitespace-nowrap">
                        <StatusCell job={job} />
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-3 text-right">
                    {/* Stretched link: the row itself is `relative` above, and this anchor's
                        `after:inset-0` pseudo-element fills that row's whole box (not just this
                        cell) — the real, focusable, right-clickable link stays this small
                        "Review" text, but clicking anywhere in the row hits its invisible
                        after-layer and navigates the same way. */}
                    <Link
                      href={`/jobs/${job.id}`}
                      aria-label={`Review ${job.title || "job"}`}
                      className="text-sm font-medium text-accent after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
