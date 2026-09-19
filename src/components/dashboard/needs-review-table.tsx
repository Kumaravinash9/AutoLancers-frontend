"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Empty, ErrorNote, PlatformTag, ScoreBadge } from "@/components/ui";
import { DashCard, StaggerIn } from "@/components/app-ui";
import { JobTable } from "@/components/job-table";
import {
  api,
  formatBudget,
  isConnectionError,
  Job,
  needsReview,
} from "@/lib/api";
import { DEMO_JOBS } from "@/lib/demo-data";

const PREVIEW_COUNT = 6;

function SpotlightSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-accent-soft/60 p-4 sm:flex-row sm:items-center">
      <div className="skeleton h-11 w-16 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="skeleton h-9 w-24 shrink-0 rounded-md" />
    </div>
  );
}

/**
 * The top-scoring open job, expanded — the one thing on this page most worth a click, with the
 * reasons that earned its score right beside it (the product's whole pitch: transparent
 * scoring, not a black box). Everything else stays a scan-and-go table below it.
 */
function Spotlight({ job }: { job: Job }) {
  const topReasons = [...job.reasons].sort((a, b) => b.points - a.points).slice(0, 3);

  return (
    <div className="rounded-xl bg-accent-soft/60 p-4 sm:p-5">
      {/* `relative` scopes the button's stretched after-layer to just this row (title/score/
          budget), not the reason chips below, so those chips keep their own hover tooltip. */}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <ScoreBadge score={job.score} />
          <div className="min-w-0">
            <p className="font-medium leading-snug">{job.title || "(untitled)"}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <PlatformTag platform={job.platform} />
              <span className="font-mono tabular-nums">{formatBudget(job)}</span>
            </div>
          </div>
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white after:absolute after:inset-0 after:content-[''] transition-opacity hover:opacity-90 sm:self-center"
        >
          Review top match
        </Link>
      </div>

      {topReasons.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {topReasons.map((reason) => (
            <li
              key={reason.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-border/60"
              title={reason.detail}
            >
              <span className="font-mono tabular-nums text-good">+{reason.points}</span>
              {reason.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Own fetch, own failure handling, silent demo fallback — same pattern as every other
 *  dashboard card. The highest-scoring open job leads as a spotlight; the rest scan as a
 *  compact table underneath (the same `JobTable` the full Queue page uses). */
export function NeedsReviewTable({ accountId }: { accountId: string | null }) {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.listJobs({ rejected: false });
        if (!cancelled) {
          setAllJobs(needsReview(result));
        }
      } catch (err) {
        if (cancelled) return;
        if (isConnectionError(err)) {
          setAllJobs(needsReview(DEMO_JOBS));
        } else {
          setError(err instanceof Error ? err.message : "Could not load jobs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const jobs = [...allJobs].sort((a, b) => b.score - a.score).slice(0, PREVIEW_COUNT);
  const [spotlightJob, ...restJobs] = jobs;

  return (
    <StaggerIn index={2}>
      <DashCard className="p-5!">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold tracking-tight">Needs your review</h2>
            {!loading && jobs.length > 0 && (
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                {jobs.length} waiting
              </span>
            )}
          </div>
          <Link
            href="/queue"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-transform hover:translate-x-0.5"
          >
            Open full queue →
          </Link>
        </div>

        {error ? (
          <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>
        ) : loading ? (
          <div className="mt-4">
            <SpotlightSkeleton />
          </div>
        ) : jobs.length === 0 ? (
          <div className="mt-4">
            <Empty>Nothing waiting on you.</Empty>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <Spotlight job={spotlightJob} />
            </div>

            {restJobs.length > 0 && (
              <div className="mt-4">
                <JobTable jobs={restJobs} />
              </div>
            )}
          </>
        )}
      </DashCard>
    </StaggerIn>
  );
}
